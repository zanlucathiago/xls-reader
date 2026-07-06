import { parseWorkbook } from "./biff/parse-workbook";
import { openCompoundFile } from "./cfb/compound-file";
import { XlsError } from "./errors";
import type { Sheet, Workbook } from "./types";

// Reads a legacy .xls (BIFF8 / Excel 97-2003) file into a Workbook. Accepts the
// file bytes as an ArrayBuffer or Uint8Array (e.g. from fs.readFile or an
// upload). Throws XlsError if the bytes aren't a BIFF .xls workbook.
//
// @example
//   const wb = readXls(await readFile("posicao.xls"));
//   wb.sheets[1].rows.forEach((row) => console.log(row));
export function readXls(data: ArrayBuffer | Uint8Array): Workbook {
  const cfb = openCompoundFile(toBytes(data));
  const stream = cfb.readStream("Workbook") ?? cfb.readStream("Book");
  if (!stream) {
    throw new XlsError(
      "No 'Workbook' or 'Book' stream in the OLE2 file — not a BIFF .xls workbook",
    );
  }
  return parseWorkbook(stream);
}

// Convenience for the common single-sheet case: the first worksheet, or
// undefined if the workbook has none.
export function readFirstSheet(data: ArrayBuffer | Uint8Array): Sheet | undefined {
  return readXls(data).sheets[0];
}

function toBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}
