import { ByteReader } from "../byte-reader";
import { excelSerialToDate } from "../excel-serial-date";
import { isDateFormatIndex } from "./number-format";
import type { BiffRecord } from "./record-stream";
import { RecordType } from "./record-types";
import { parseSharedStrings } from "./shared-strings";
import { readUnicodeString } from "./unicode-string";

// A worksheet as advertised by the globals: its name and the byte offset of its
// BOF within the Workbook stream.
export interface BoundSheet {
  readonly name: string;
  readonly offset: number;
}

// Everything from the workbook-globals substream that the sheets need to decode:
// the shared strings, how to interpret a numeric cell (number vs date), and the
// list of sheets.
export interface WorkbookGlobals {
  readonly sharedStrings: readonly string[];
  readonly boundSheets: readonly BoundSheet[];
  readonly numeric: (xfIndex: number, value: number) => number | Date;
}

// Parses the globals substream (records 0..first EOF): date system, custom
// number formats, XF→format map, shared strings, and the sheet directory.
export function parseGlobals(records: readonly BiffRecord[]): WorkbookGlobals {
  let date1904 = false;
  const customFormats = new Map<number, string>();
  const xfFormatIndex: number[] = [];
  let sharedStrings: string[] = [];
  const boundSheets: BoundSheet[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (record === undefined || record.type === RecordType.EOF) break;
    if (record.type === RecordType.DATEMODE) date1904 = new ByteReader(record.data).u16() === 1;
    else if (record.type === RecordType.FORMAT) addFormat(record.data, customFormats);
    else if (record.type === RecordType.XF)
      xfFormatIndex.push(new ByteReader(record.data, 2).u16());
    else if (record.type === RecordType.SST)
      sharedStrings = parseSharedStrings(collectSstChunks(records, i));
    else if (record.type === RecordType.BOUNDSHEET8) boundSheets.push(parseBoundSheet(record.data));
  }

  return {
    sharedStrings,
    boundSheets,
    numeric: makeNumeric(xfFormatIndex, customFormats, date1904),
  };
}

function addFormat(data: Uint8Array, into: Map<number, string>): void {
  const reader = new ByteReader(data);
  const formatIndex = reader.u16();
  into.set(formatIndex, readUnicodeString(reader, false));
}

// The SST record plus every CONTINUE record immediately after it form one string
// table; return their data as ordered chunks for parseSharedStrings.
function collectSstChunks(records: readonly BiffRecord[], sstIndex: number): Uint8Array[] {
  const first = records[sstIndex];
  const chunks: Uint8Array[] = first ? [first.data] : [];
  for (let j = sstIndex + 1; j < records.length; j++) {
    const record = records[j];
    if (record === undefined || record.type !== RecordType.CONTINUE) break;
    chunks.push(record.data);
  }
  return chunks;
}

// BOUNDSHEET8: byte offset of the sheet's BOF (u32), grbit (u16, skipped), then a
// short (1-byte length) unicode name.
function parseBoundSheet(data: Uint8Array): BoundSheet {
  const reader = new ByteReader(data);
  const offset = reader.u32();
  reader.u16();
  return { name: readUnicodeString(reader, true), offset };
}

// Builds the number/date interpreter: a cell's xf index selects a format index,
// and a date format means the raw serial becomes a Date.
function makeNumeric(
  xfFormatIndex: readonly number[],
  customFormats: ReadonlyMap<number, string>,
  date1904: boolean,
): (xfIndex: number, value: number) => number | Date {
  return (xfIndex, value) => {
    const formatIndex = xfFormatIndex[xfIndex] ?? 0;
    return isDateFormatIndex(formatIndex, customFormats)
      ? excelSerialToDate(value, date1904)
      : value;
  };
}
