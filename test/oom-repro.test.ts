import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readXls, XlsError } from "../src/index";

// Repro harness for the parser-robustness work. Classifies readXls on hostile
// input as: "xls-error" (good, guarded), "workbook" (parsed), or "RAW:<name>"
// (a raw RangeError/TypeError escaping the parser — an unhandled crash). Run
// under a low --max-old-space-size so an unbounded allocation aborts the Node
// process cleanly instead of exhausting the machine's RAM.
function classify(bytes: Uint8Array): string {
  try {
    readXls(bytes);
    return "workbook";
  } catch (err) {
    if (err instanceof XlsError) return "xls-error";
    return `RAW:${(err as Error).constructor.name}: ${(err as Error).message}`;
  }
}

const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

function writeU16(b: Uint8Array, off: number, v: number): void {
  b[off] = v & 0xff;
  b[off + 1] = (v >>> 8) & 0xff;
}
function writeU32(b: Uint8Array, off: number, v: number): void {
  b[off] = v & 0xff;
  b[off + 1] = (v >>> 8) & 0xff;
  b[off + 2] = (v >>> 16) & 0xff;
  b[off + 3] = (v >>> 24) & 0xff;
}

// Vector 1: a DIFAT chain that self-loops with a near-2^32 sector count. Without
// a cycle guard, collectFatSectorIds re-reads the same in-bounds sector billions
// of times, pushing 127 ids each pass → the FAT id array grows without bound → OOM.
function difatBomb(): Uint8Array {
  const b = new Uint8Array(1024); // 512 header + one 512-byte sector
  b.set(SIGNATURE, 0);
  writeU16(b, 30, 9); // sector shift → 512
  writeU16(b, 32, 6); // mini shift → 64
  writeU32(b, 48, 0xfffffffe); // firstDirSector = ENDOFCHAIN (irrelevant; we OOM before)
  writeU32(b, 68, 0); // firstDifatSector = sector 0 (offset 512, in-bounds)
  writeU32(b, 72, 0xfffffffe); // numDifatSectors ≈ 4.29 billion
  for (let i = 0; i < 109; i++) writeU32(b, 76 + i * 4, 0xffffffff); // initial DIFAT = all FREESECT
  // Sector 0: 127 valid FAT ids (0x00000000) that get pushed each pass, then a
  // "next DIFAT" link pointing back to sector 0 → an in-bounds self-loop.
  for (let i = 0; i < 127; i++) writeU32(b, 512 + i * 4, 0x00000000);
  writeU32(b, 512 + 127 * 4, 0); // next DIFAT sector = 0 (self-loop)
  return b;
}

// Vector 2: an out-of-range power-of-two sector shift. `1 << 31` is negative in
// JS; downstream sizes/offsets go negative or huge, yielding a raw RangeError
// ("Invalid typed array length" / DataView out of bounds) rather than XlsError.
function badSectorShift(shift: number): Uint8Array {
  const b = new Uint8Array(1024);
  b.set(SIGNATURE, 0);
  writeU16(b, 30, shift);
  writeU16(b, 32, 6);
  writeU32(b, 48, 0); // firstDirSector = 0
  for (let i = 0; i < 109; i++) writeU32(b, 76 + i * 4, i === 0 ? 0 : 0xffffffff);
  return b;
}

// Vector 3: a real (fuzzer-found) file whose sheet has a cell at column 6400,
// far past the BIFF8 max of 255. The dense grid is sized to the max column, so
// without the limit check this allocated a hundreds-of-MB grid from a 5.6 KB
// file. See test/fixtures/README.md.
const hugeColumn = new Uint8Array(
  readFileSync(new URL("./fixtures/corrupt-huge-column.xls", import.meta.url)),
);

describe("OOM / crash repro (parser-robustness)", () => {
  // Each vector must fail cleanly as XlsError, never a raw crash or OOM. The heap
  // assertion on the DIFAT bomb proves the cycle guard actually caps growth.
  it("vector 1: self-looping DIFAT does not exhaust memory", () => {
    const before = process.memoryUsage().heapUsed;
    expect(classify(difatBomb())).toBe("xls-error");
    const grewMB = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
    expect(grewMB).toBeLessThan(50);
  });

  it("vector 2: invalid sector shift 31 (negative size) fails cleanly", () => {
    expect(classify(badSectorShift(31))).toBe("xls-error");
  });

  it("vector 2: invalid sector shift 30 (huge size) fails cleanly", () => {
    expect(classify(badSectorShift(30))).toBe("xls-error");
  });

  it("vector 3: out-of-range cell column does not allocate a giant grid", () => {
    const before = process.memoryUsage().heapUsed;
    expect(classify(hugeColumn)).toBe("xls-error");
    const grewMB = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
    expect(grewMB).toBeLessThan(50);
  });
});
