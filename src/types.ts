// A single cell value, already decoded from BIFF8 to a plain JS value. Numbers
// formatted as dates in the source come back as `Date`; empty/blank cells and
// error cells come back as `null`.
export type Cell = string | number | boolean | Date | null;

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
