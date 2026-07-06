import { describe, expect, it } from "vitest";
import { excelSerialToDate } from "../src/excel-serial-date";

const iso = (date: Date): string => date.toISOString().slice(0, 10);

describe("excelSerialToDate", () => {
  it("converts 1900-system serials matching the Daycoval sample", () => {
    expect(iso(excelSerialToDate(45384, false))).toBe("2024-04-02");
    expect(iso(excelSerialToDate(46482, false))).toBe("2027-04-05");
  });

  it("uses the 1904 epoch when the workbook is 1904-based", () => {
    expect(iso(excelSerialToDate(0, true))).toBe("1904-01-01");
  });

  it("keeps the fractional part as the time of day", () => {
    expect(excelSerialToDate(45384.5, false).toISOString()).toBe("2024-04-02T12:00:00.000Z");
  });
});
