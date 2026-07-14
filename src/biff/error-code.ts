import { CellError, type ExcelErrorCode } from "../types";

// BIFF8 stores an error cell's kind as a single byte ([MS-XLS] BErr). Map it to
// the worksheet-facing error, or `null` when the byte isn't one of the seven
// defined codes (a corrupt/unknown value — treated as blank rather than guessed).
const CODE_BY_BYTE: ReadonlyMap<number, ExcelErrorCode> = new Map([
  [0x00, "#NULL!"],
  [0x07, "#DIV/0!"],
  [0x0f, "#VALUE!"],
  [0x17, "#REF!"],
  [0x1d, "#NAME?"],
  [0x24, "#NUM!"],
  [0x2a, "#N/A"],
]);

// Turns a BIFF error byte into a CellError, or null if the byte is unrecognized.
export function errorFromByte(byte: number): CellError | null {
  const code = CODE_BY_BYTE.get(byte);
  return code === undefined ? null : new CellError(code);
}
