// A single cell value, already decoded from BIFF8 to a plain JS value. Numbers
// formatted as dates in the source come back as `Date`; empty/blank cells and
// error cells come back as `null`.
export type Cell = string | number | boolean | Date | null;

// One worksheet: its name and a dense grid of rows. Rows are 0-indexed and each
// row is padded with `null` up to the sheet's last used column, so `rows[r][c]`
// is safe for any cell within the used range.
export interface Sheet {
  readonly name: string;
  readonly rows: ReadonlyArray<ReadonlyArray<Cell>>;
}

// A parsed workbook: every worksheet in file order.
export interface Workbook {
  readonly sheets: readonly Sheet[];
}
