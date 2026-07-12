import { describe, expect, it } from "vitest";
import { parseBoundSheet } from "../src/biff/workbook-globals";

// Builds a BOUNDSHEET8 record body: BOF offset (u32), grbit (u16 as [low, high]),
// then a short (1-byte length), 8-bit unicode name.
function boundSheetRecord(
  offset: number,
  grbitLow: number,
  grbitHigh: number,
  name: string,
): Uint8Array {
  const chars = [...name].map((c) => c.charCodeAt(0));
  return Uint8Array.from([
    offset & 0xff,
    (offset >> 8) & 0xff,
    (offset >> 16) & 0xff,
    (offset >> 24) & 0xff,
    grbitLow,
    grbitHigh,
    chars.length,
    0x00, // name flags: not wide/rich/extended
    ...chars,
  ]);
}

describe("parseBoundSheet", () => {
  it("reads the name and the BOF offset", () => {
    const sheet = parseBoundSheet(boundSheetRecord(512, 0x00, 0x00, "Sheet1"));
    expect(sheet.name).toBe("Sheet1");
    expect(sheet.offset).toBe(512);
  });

  it("maps the hidden state to visibility", () => {
    expect(parseBoundSheet(boundSheetRecord(0, 0x00, 0x00, "A")).visibility).toBe("visible");
    expect(parseBoundSheet(boundSheetRecord(0, 0x01, 0x00, "A")).visibility).toBe("hidden");
    expect(parseBoundSheet(boundSheetRecord(0, 0x02, 0x00, "A")).visibility).toBe("very-hidden");
  });

  it("flags worksheets vs chart/macro/VBA substreams by sheet type", () => {
    expect(parseBoundSheet(boundSheetRecord(0, 0x00, 0x00, "W")).isWorksheet).toBe(true);
    expect(parseBoundSheet(boundSheetRecord(0, 0x00, 0x01, "Macro")).isWorksheet).toBe(false);
    expect(parseBoundSheet(boundSheetRecord(0, 0x00, 0x02, "Chart")).isWorksheet).toBe(false);
    expect(parseBoundSheet(boundSheetRecord(0, 0x00, 0x06, "VBA")).isWorksheet).toBe(false);
  });

  it("reads visibility and sheet type independently", () => {
    const hiddenChart = parseBoundSheet(boundSheetRecord(0, 0x01, 0x02, "Chart"));
    expect(hiddenChart.visibility).toBe("hidden");
    expect(hiddenChart.isWorksheet).toBe(false);
  });
});
