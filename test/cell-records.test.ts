import { describe, expect, it } from "vitest";
import { decodeFormula, decodeMulRk, type CellContext } from "../src/biff/cell-records";

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
