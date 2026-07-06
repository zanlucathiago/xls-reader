import { describe, expect, it } from "vitest";
import { parseSharedStrings } from "../src/biff/shared-strings";

// Header helper: cstTotal + cstUnique, both little-endian u32.
function sstHeader(total: number, unique: number): number[] {
  return [total, 0, 0, 0, unique, 0, 0, 0];
}

describe("parseSharedStrings", () => {
  it("reads a single compressed (8-bit) string", () => {
    const chunk = Uint8Array.from([...sstHeader(1, 1), 3, 0, 0x00, 0x43, 0x44, 0x42]); // "CDB"
    expect(parseSharedStrings([chunk])).toEqual(["CDB"]);
  });

  it("reads a wide (16-bit) string", () => {
    const chunk = Uint8Array.from([...sstHeader(1, 1), 2, 0, 0x01, 0x4f, 0x00, 0x4b, 0x00]); // "OK"
    expect(parseSharedStrings([chunk])).toEqual(["OK"]);
  });

  // The hard case: a string's characters are split across a record boundary, and
  // the CONTINUE record restarts with a fresh grbit for the remaining chars.
  it("reads a string split across a CONTINUE boundary", () => {
    const first = Uint8Array.from([...sstHeader(1, 1), 5, 0, 0x00, 0x41, 0x42, 0x43]); // "ABC…"
    const cont = Uint8Array.from([0x00, 0x44, 0x45]); // fresh grbit (compressed) + "DE"
    expect(parseSharedStrings([first, cont])).toEqual(["ABCDE"]);
  });

  it("reads compression that changes at the CONTINUE boundary", () => {
    const first = Uint8Array.from([...sstHeader(1, 1), 4, 0, 0x00, 0x41, 0x42]); // compressed "AB…"
    const cont = Uint8Array.from([0x01, 0x43, 0x00, 0x44, 0x00]); // wide "CD"
    expect(parseSharedStrings([first, cont])).toEqual(["ABCD"]);
  });

  it("skips a rich-text run block after the characters", () => {
    // grbit 0x08 = rich; cRun = 1 → 4 trailing bytes to skip.
    const chunk = Uint8Array.from([
      ...sstHeader(1, 1),
      2,
      0,
      0x08,
      1,
      0,
      0x48,
      0x49,
      0xaa,
      0xbb,
      0xcc,
      0xdd,
    ]); // "HI" + one run
    expect(parseSharedStrings([chunk])).toEqual(["HI"]);
  });
});
