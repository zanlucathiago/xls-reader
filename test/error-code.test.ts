import { describe, expect, it } from "vitest";
import { errorFromByte } from "../src/biff/error-code";
import { CellError } from "../src/types";

describe("errorFromByte", () => {
  it("maps each defined BIFF error byte to its worksheet code", () => {
    const cases: ReadonlyArray<readonly [number, string]> = [
      [0x00, "#NULL!"],
      [0x07, "#DIV/0!"],
      [0x0f, "#VALUE!"],
      [0x17, "#REF!"],
      [0x1d, "#NAME?"],
      [0x24, "#NUM!"],
      [0x2a, "#N/A"],
    ];
    for (const [byte, code] of cases) {
      const result = errorFromByte(byte);
      expect(result).toBeInstanceOf(CellError);
      expect(result?.code).toBe(code);
    }
  });

  it("returns null for an unrecognized byte instead of guessing", () => {
    expect(errorFromByte(0x99)).toBeNull();
    expect(errorFromByte(0xff)).toBeNull();
  });

  it("CellError stringifies to its code", () => {
    expect(String(new CellError("#REF!"))).toBe("#REF!");
  });

  it("CellError serializes to an explicit object in JSON", () => {
    expect(JSON.stringify(new CellError("#DIV/0!"))).toBe('{"code":"#DIV/0!"}');
  });
});
