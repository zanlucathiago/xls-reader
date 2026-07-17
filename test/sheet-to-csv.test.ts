import { describe, expect, it } from "vitest";
import { sheetToCsv } from "../src/sheet-to-csv";
import { CellError, type Cell, type Sheet } from "../src/types";

// A visible sheet wrapping the given grid — the only field sheetToCsv reads.
function sheetFrom(rows: Cell[][]): Sheet {
  return { name: "S", visibility: "visible", rows };
}

describe("sheetToCsv", () => {
  it("joins rows and columns with the default comma and newline", () => {
    const csv = sheetToCsv(sheetFrom([["Name", "Age"], ["Ada", 36], ["Alan", 41]]));
    expect(csv).toBe("Name,Age\nAda,36\nAlan,41");
  });

  it("quotes fields that hold the delimiter, a quote, or a newline", () => {
    const csv = sheetToCsv(sheetFrom([["a,b", 'he said "hi"', "line\nbreak"]]));
    expect(csv).toBe('"a,b","he said ""hi""","line\nbreak"');
  });

  it("renders Date as UTC ISO-8601 and CellError as its code", () => {
    const csv = sheetToCsv(sheetFrom([[new Date(Date.UTC(2024, 3, 2)), new CellError("#DIV/0!")]]));
    expect(csv).toBe("2024-04-02T00:00:00.000Z,#DIV/0!");
  });

  it("renders a blank cell as an empty field and keeps false/0 verbatim", () => {
    expect(sheetToCsv(sheetFrom([[null, false, 0]]))).toBe(",false,0");
  });

  it("honors a custom delimiter and end-of-line", () => {
    const csv = sheetToCsv(sheetFrom([["a", "b"], ["c", "d"]]), { delimiter: ";", eol: "\r\n" });
    expect(csv).toBe("a;b\r\nc;d");
  });

  it("quotes a field that contains the custom delimiter", () => {
    expect(sheetToCsv(sheetFrom([["a;b", "c"]]), { delimiter: ";" })).toBe('"a;b";c');
  });

  it("returns an empty string for a sheet with no rows", () => {
    expect(sheetToCsv(sheetFrom([]))).toBe("");
  });

  it("rejects a multi-character or newline delimiter", () => {
    expect(() => sheetToCsv(sheetFrom([["a"]]), { delimiter: ",," })).toThrow(/delimiter/);
    expect(() => sheetToCsv(sheetFrom([["a"]]), { delimiter: "\n" })).toThrow(/delimiter/);
  });
});
