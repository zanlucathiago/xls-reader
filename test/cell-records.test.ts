import { describe, expect, it } from "vitest";
import {
  decodeBoolErr,
  decodeFormula,
  decodeMulRk,
  type CellContext,
} from "../src/biff/cell-records";
import { CellError } from "../src/types";

// A context that returns numbers verbatim (no date coercion) so tests assert the
// decoded value, not the format layer.
const ctx: CellContext = { sharedStrings: [], numeric: (_xf, value) => value };

// Builds a FORMULA record body: row, col, xf (each u16) + an 8-byte result.
function formula(result: number[]): Uint8Array {
  return Uint8Array.from([0, 0, 0, 0, 0, 0, ...result]);
}

function doubleBytes(value: number): number[] {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, true);
  return [...new Uint8Array(view.buffer)];
}

describe("decodeFormula", () => {
  it("decodes a cached numeric result", () => {
    const result = decodeFormula(formula(doubleBytes(111.1)), ctx);
    expect(result).toEqual({ kind: "value", cell: { row: 0, col: 0, value: 111.1 } });
  });

  it("flags a string result that arrives in the next STRING record", () => {
    // result[0]=0 (string), last two bytes 0xFFFF sentinel.
    const result = decodeFormula(formula([0, 0, 0, 0, 0, 0, 0xff, 0xff]), ctx);
    expect(result).toEqual({ kind: "pending-string", row: 0, col: 0 });
  });

  it("decodes a cached boolean result", () => {
    // result[0]=1 (boolean), result[2]=1 (true), 0xFFFF sentinel.
    const result = decodeFormula(formula([1, 0, 1, 0, 0, 0, 0xff, 0xff]), ctx);
    expect(result).toEqual({ kind: "value", cell: { row: 0, col: 0, value: true } });
  });

  it("decodes a cached error result as a CellError", () => {
    // result[0]=2 (error), result[2]=0x17 (#REF!), 0xFFFF sentinel.
    const result = decodeFormula(formula([2, 0, 0x17, 0, 0, 0, 0xff, 0xff]), ctx);
    expect(result).toEqual({
      kind: "value",
      cell: { row: 0, col: 0, value: new CellError("#REF!") },
    });
  });

  it("decodes a cached blank result as null", () => {
    // result[0]=3 (blank), 0xFFFF sentinel.
    const result = decodeFormula(formula([3, 0, 0, 0, 0, 0, 0xff, 0xff]), ctx);
    expect(result).toEqual({ kind: "value", cell: { row: 0, col: 0, value: null } });
  });
});

// BOOLERR body: row, col, xf (each u16), then a value byte and an isError flag.
function boolErr(value: number, isError: number): Uint8Array {
  return Uint8Array.from([0, 0, 0, 0, 0, 0, value, isError]);
}

describe("decodeBoolErr", () => {
  it("decodes booleans", () => {
    expect(decodeBoolErr(boolErr(1, 0)).value).toBe(true);
    expect(decodeBoolErr(boolErr(0, 0)).value).toBe(false);
  });

  it("decodes an error byte into a CellError", () => {
    expect(decodeBoolErr(boolErr(0x07, 1)).value).toEqual(new CellError("#DIV/0!"));
    expect(decodeBoolErr(boolErr(0x2a, 1)).value).toEqual(new CellError("#N/A"));
  });

  it("falls back to null for an unrecognized error byte", () => {
    expect(decodeBoolErr(boolErr(0x99, 1)).value).toBeNull();
  });
});

describe("decodeMulRk", () => {
  it("expands a run of RK cells sharing a row", () => {
    // row 0, colFirst 1; two entries (xf, rk) then colLast 2.
    const data = Uint8Array.from([
      0,
      0,
      1,
      0, // row, colFirst
      0,
      0,
      (10 << 2) | 0x02,
      0,
      0,
      0, // xf, rk=10 (int)
      0,
      0,
      (20 << 2) | 0x02,
      0,
      0,
      0, // xf, rk=20 (int)
      2,
      0, // colLast
    ]);
    expect(decodeMulRk(data, ctx)).toEqual([
      { row: 0, col: 1, value: 10 },
      { row: 0, col: 2, value: 20 },
    ]);
  });
});
