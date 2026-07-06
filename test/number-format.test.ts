import { describe, expect, it } from "vitest";
import { isDateFormatIndex } from "../src/biff/number-format";

const noCustom = new Map<number, string>();

describe("isDateFormatIndex", () => {
  it("recognizes built-in date/time format ids", () => {
    expect(isDateFormatIndex(14, noCustom)).toBe(true); // m/d/yy
    expect(isDateFormatIndex(22, noCustom)).toBe(true); // m/d/yy h:mm
  });

  it("treats General and plain numeric builtins as non-dates", () => {
    expect(isDateFormatIndex(0, noCustom)).toBe(false); // General
    expect(isDateFormatIndex(2, noCustom)).toBe(false); // 0.00
  });

  it("detects a custom date format by its tokens", () => {
    expect(isDateFormatIndex(164, new Map([[164, "DD/MM/YYYY"]]))).toBe(true);
  });

  it("does not mistake a quoted currency prefix for a date", () => {
    expect(isDateFormatIndex(165, new Map([[165, '"R$"#,##0.00']]))).toBe(false);
  });
});
