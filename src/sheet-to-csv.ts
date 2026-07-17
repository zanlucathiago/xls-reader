import { XlsError } from "./errors";
import type { Cell, Sheet } from "./types";
import { CellError } from "./types";

// Options for `sheetToCsv`. `delimiter` is the field separator (default `,`);
// `eol` is the line terminator between rows (default `\n` — pass `\r\n` for
// strict RFC-4180 / Excel-style output).
export interface SheetToCsvOptions {
  readonly delimiter?: string;
  readonly eol?: string;
}

// Serializes a sheet's dense grid to a CSV string with RFC-4180 quoting. Each
// row becomes one line and every cell is rendered as text — a `Date` as a UTC
// ISO-8601 string, a `CellError` as its code (e.g. `#DIV/0!`), and a blank cell
// (`null`) as an empty field. Fields containing the delimiter, a double quote,
// or a newline are wrapped in quotes with inner quotes doubled.
//
// @example
//   const csv = sheetToCsv(readFirstSheet(bytes)!);
//   // "Name,Age\nAda,36\nAlan,41"
export function sheetToCsv(sheet: Sheet, options: SheetToCsvOptions = {}): string {
  const delimiter = options.delimiter ?? ",";
  const eol = options.eol ?? "\n";
  assertDelimiter(delimiter);
  return sheet.rows.map((row) => encodeRow(row, delimiter)).join(eol);
}

function encodeRow(row: ReadonlyArray<Cell>, delimiter: string): string {
  return row.map((cell) => encodeField(cellToText(cell), delimiter)).join(delimiter);
}

// A cell as plain text: blank → empty, Date → UTC ISO-8601, CellError → its
// code, everything else via its JS string form.
function cellToText(cell: Cell): string {
  if (cell === null) return "";
  if (cell instanceof Date) return cell.toISOString();
  if (cell instanceof CellError) return cell.code;
  return String(cell);
}

// RFC-4180: quote a field only when it holds the delimiter, a quote, or a
// newline; inside quotes a `"` is escaped by doubling it.
function encodeField(text: string, delimiter: string): string {
  if (!text.includes(delimiter) && !/["\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function assertDelimiter(delimiter: string): void {
  if (delimiter.length === 1 && !/["\r\n]/.test(delimiter)) return;
  throw new XlsError(
    `delimiter must be a single character other than '"', CR, or LF, got ${JSON.stringify(delimiter)}`,
  );
}
