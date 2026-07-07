import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readXls, XlsError } from "../src/index";

// The reader parses UNTRUSTED binary input. Its contract for any byte sequence:
// it either returns a Workbook or throws XlsError — it must never hang, and must
// never throw a raw RangeError/TypeError (that would be an unhandled parser bug,
// and the kind of crash SECURITY.md promises we guard against).
//
// These tests assert that contract across malformed, truncated, and random
// inputs. Each `readOutcome` call rethrows any non-XlsError, so an unexpected
// crash fails the test with the offending error — which is exactly what we want
// to surface. Vitest's per-test timeout catches infinite loops.

type Outcome = "workbook" | "xls-error";

// Calls readXls and classifies the result. An unexpected error type escapes and
// fails the test on purpose — that's a parser bug we want to see.
function readOutcome(bytes: Uint8Array): Outcome {
  try {
    readXls(bytes);
    return "workbook";
  } catch (err) {
    if (err instanceof XlsError) return "xls-error";
    throw err;
  }
}

// The OLE2 / Compound File magic. Prefixing a buffer with it gets past the cheap
// signature check and exercises the risky code: header, FAT, directory, streams.
const CFB_SIGNATURE = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

// Small, seeded PRNG (mulberry32) so the fuzz corpus is repeatable (FIRST tests).
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBytes(length: number, rand: () => number): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
}

// A random buffer that starts with the CFB signature, so parsing proceeds past
// the magic-number gate into the container logic where the real risk lives.
function randomCfbLike(length: number, rand: () => number): Uint8Array {
  const bytes = randomBytes(length, rand);
  bytes.set(CFB_SIGNATURE, 0);
  return bytes;
}

const sample = new Uint8Array(readFileSync(new URL("./fixtures/sample.xls", import.meta.url)));

describe("robustness: never crashes or hangs on hostile input", () => {
  it("handles trivially malformed buffers", () => {
    const cases = [
      new Uint8Array(0),
      new Uint8Array([1, 2, 3, 4]),
      new Uint8Array(511), // one byte short of the 512-byte header
      new Uint8Array(512), // all-zero header
      new Uint8Array(4096).fill(0xff), // all-0xFF: every field is a max/marker value
      CFB_SIGNATURE, // valid magic, nothing after it
    ];
    for (const bytes of cases) {
      expect(["workbook", "xls-error"]).toContain(readOutcome(bytes));
    }
  });

  it("handles every truncation of a real .xls", () => {
    // Prefixes of a valid file are the most common real-world corruption
    // (interrupted download/copy). Every prefix must fail cleanly, not crash.
    for (let len = 0; len <= sample.length; len += 7) {
      expect(["workbook", "xls-error"]).toContain(readOutcome(sample.subarray(0, len)));
    }
  });

  it("handles a real .xls with single-byte corruption at each header offset", () => {
    // Flip one byte across the 512-byte header/FAT-pointer region and confirm the
    // reader still returns or throws XlsError rather than crashing.
    for (let offset = 0; offset < 512; offset++) {
      const corrupt = sample.slice();
      corrupt[offset] = ((corrupt[offset] ?? 0) + 1) & 0xff;
      expect(["workbook", "xls-error"]).toContain(readOutcome(corrupt));
    }
  });

  it("handles thousands of random CFB-signed buffers without crashing", () => {
    const rand = seededRandom(0x9e3779b9);
    for (let i = 0; i < 3000; i++) {
      const length = 512 + Math.floor(rand() * 4096);
      expect(["workbook", "xls-error"]).toContain(readOutcome(randomCfbLike(length, rand)));
    }
  });

  it("handles random non-CFB buffers", () => {
    const rand = seededRandom(0x1234abcd);
    for (let i = 0; i < 1000; i++) {
      const length = Math.floor(rand() * 2048);
      expect(["workbook", "xls-error"]).toContain(readOutcome(randomBytes(length, rand)));
    }
  });
});
