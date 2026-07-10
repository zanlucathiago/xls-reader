import { XlsError } from "./errors";
import type { Cell, RowObject, Sheet } from "./types";

// Options for `sheetToObjects`. `headerRow` picks which 0-based row supplies the
// keys; every row after it becomes one data object.
export interface SheetToObjectsOptions {
  readonly headerRow?: number;
}

// Turns a sheet's dense grid into objects keyed by a header row — the shape most
// callers want when they say "read the .xls into JSON". Columns whose header
// cell is blank are skipped; when two headers share a name the rightmost column
// wins. Returns [] when there is no row after the header.
//
// @example
//   const rows = sheetToObjects(readFirstSheet(bytes)!);
//   // [{ Name: "Ada", Age: 36 }, { Name: "Alan", Age: 41 }]
export function sheetToObjects(sheet: Sheet, options: SheetToObjectsOptions = {}): RowObject[] {
  const headerRow = options.headerRow ?? 0;
  assertHeaderRow(headerRow);
  const header = sheet.rows[headerRow];
  if (header === undefined) return [];
  const keys = headerKeys(header);
  return sheet.rows.slice(headerRow + 1).map((row) => rowToObject(row, keys));
}

// The header row as lookup keys, with a `null` slot for every blank column so
// `rowToObject` can skip it while keeping column alignment.
function headerKeys(row: ReadonlyArray<Cell>): (string | null)[] {
  return row.map((cell) => toKey(cell));
}

function toKey(cell: Cell): string | null {
  if (cell === null) return null;
  const key = String(cell).trim();
  return key.length === 0 ? null : key;
}

function rowToObject(row: ReadonlyArray<Cell>, keys: ReadonlyArray<string | null>): RowObject {
  const object: RowObject = {};
  keys.forEach((key, col) => {
    if (key === null) return;
    // `?? null` covers both an out-of-range column and a genuine blank cell.
    object[key] = row[col] ?? null;
  });
  return object;
}

function assertHeaderRow(headerRow: number): void {
  if (Number.isInteger(headerRow) && headerRow >= 0) return;
  throw new XlsError(`headerRow must be a non-negative integer, got ${JSON.stringify(headerRow)}`);
}
