import { describe, expect, it } from "vitest";
import { sheetToObjects } from "../src/sheet-to-objects";
import { XlsError } from "../src/errors";
import type { Cell, Sheet } from "../src/types";

function sheet(rows: Cell[][]): Sheet {
  return { name: "Sheet1", visibility: "visible", rows };
}

describe("sheetToObjects", () => {
  it("keys each data row by the header row", () => {
    const result = sheetToObjects(
      sheet([
        ["Name", "Age"],
        ["Ada", 36],
        ["Alan", 41],
      ]),
    );
    expect(result).toEqual([
      { Name: "Ada", Age: 36 },
      { Name: "Alan", Age: 41 },
    ]);
  });

  it("honors a non-zero headerRow, ignoring the rows above it", () => {
    const result = sheetToObjects(
      sheet([
        ["Quarterly report", null],
        ["City", "Pop"],
        ["Rio", 6],
      ]),
      { headerRow: 1 },
    );
    expect(result).toEqual([{ City: "Rio", Pop: 6 }]);
  });

  it("skips columns whose header cell is blank or whitespace", () => {
    const result = sheetToObjects(
      sheet([
        ["Name", null, "  "],
        ["Ada", "x", "y"],
      ]),
    );
    expect(result).toEqual([{ Name: "Ada" }]);
  });

  it("lets the rightmost column win when headers repeat", () => {
    const result = sheetToObjects(
      sheet([
        ["Id", "Id"],
        [1, 2],
      ]),
    );
    expect(result).toEqual([{ Id: 2 }]);
  });

  it("pads a short data row with null for missing trailing cells", () => {
    const result = sheetToObjects(sheet([["A", "B", "C"], [1]]));
    expect(result).toEqual([{ A: 1, B: null, C: null }]);
  });

  it("returns [] when there is no data below the header or no rows at all", () => {
    expect(sheetToObjects(sheet([["A", "B"]]))).toEqual([]);
    expect(sheetToObjects(sheet([]))).toEqual([]);
  });

  it("returns [] when headerRow is past the last row", () => {
    expect(sheetToObjects(sheet([["A"]]), { headerRow: 5 })).toEqual([]);
  });

  it("rejects a negative or non-integer headerRow with XlsError", () => {
    expect(() => sheetToObjects(sheet([["A"]]), { headerRow: -1 })).toThrow(XlsError);
    expect(() => sheetToObjects(sheet([["A"]]), { headerRow: 1.5 })).toThrow(
      /headerRow must be a non-negative integer, got 1.5/,
    );
  });
});
