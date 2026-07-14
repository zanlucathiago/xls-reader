// The seven Excel error values, in their worksheet spelling ([MS-XLS] BErr).
export type ExcelErrorCode =
  "#NULL!" | "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#NUM!" | "#N/A";

// An Excel error value sitting in a cell (e.g. `#DIV/0!`). It's a distinct type
// rather than `null` so an importer can tell an errored cell from a blank one,
// and rather than a plain string so it can't be confused with a text cell that
// literally contains "#N/A". Serializes to `{ "code": "#DIV/0!" }` in JSON.
//
// @example
//   if (cell instanceof CellError) console.warn(`errored: ${cell.code}`);
export class CellError {
  constructor(readonly code: ExcelErrorCode) {}
  toString(): string {
    return this.code;
  }
}

// A single cell value, already decoded from BIFF8 to a plain JS value. Numbers
// formatted as dates in the source come back as `Date`; error cells come back as
// a `CellError`; empty/blank cells come back as `null`.
export type Cell = string | number | boolean | Date | CellError | null;

// How a sheet is surfaced in Excel: normally visible, hidden (re-shown from the
// sheet-tab menu), or very-hidden (only togglable from the VBA editor — often a
// lookup/config sheet the author meant to keep out of sight).
export type SheetVisibility = "visible" | "hidden" | "very-hidden";

// One worksheet: its name, visibility, and a dense grid of rows. Rows are
// 0-indexed and each row is padded with `null` up to the sheet's last used
// column, so `rows[r][c]` is safe for any cell within the used range.
export interface Sheet {
  readonly name: string;
  readonly visibility: SheetVisibility;
  readonly rows: ReadonlyArray<ReadonlyArray<Cell>>;
}

// A parsed workbook: every worksheet in file order.
export interface Workbook {
  readonly sheets: readonly Sheet[];
}

// One data row turned into an object keyed by a sheet's header row, produced by
// `sheetToObjects`. Values are the same decoded `Cell`s as `Sheet.rows`.
export type RowObject = Record<string, Cell>;
