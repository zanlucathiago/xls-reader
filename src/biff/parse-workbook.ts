import type { Workbook } from "../types";
import { readRecords } from "./record-stream";
import { decodeSheet } from "./sheet-decoder";
import { parseGlobals } from "./workbook-globals";

// Turns a raw Workbook/Book BIFF8 stream into a Workbook: parse the globals
// substream, then decode each worksheet the globals point to. Sheets are located
// by the byte offset of their BOF, so we index records by offset once. Chart,
// macro, and VBA substreams are bound sheets too but hold no cells, so we skip
// them rather than return empty phantom sheets.
export function parseWorkbook(stream: Uint8Array): Workbook {
  const records = readRecords(stream);
  const globals = parseGlobals(records);
  const offsetToIndex = new Map(records.map((record, index) => [record.offset, index]));
  const sheets = globals.boundSheets
    .filter((sheet) => sheet.isWorksheet)
    .map((sheet) => decodeSheet(records, sheet, offsetToIndex, globals));
  return { sheets };
}
