import { XlsError } from "../errors";
import { sheetToCsv } from "../sheet-to-csv";
import { sheetToObjects } from "../sheet-to-objects";
import type { Cell, RowObject, Sheet, SheetVisibility, Workbook } from "../types";
import type { CliOptions } from "./args";

interface SheetJson {
  readonly name: string;
  readonly visibility: SheetVisibility;
  readonly rows: ReadonlyArray<ReadonlyArray<Cell>> | readonly RowObject[];
}

// Renders the selected sheets as JSON, or as a single sheet's CSV under `--csv`.
// Dates serialize to ISO strings via the default `Date.toJSON`, which is what a
// JSON consumer expects.
export function renderWorkbook(workbook: Workbook, options: CliOptions): string {
  const sheets = selectSheets(workbook.sheets, options);
  if (options.format === "csv") return renderCsv(sheets);
  const payload = sheets.map((sheet) => renderSheet(sheet, options));
  return JSON.stringify(payload, null, options.compact ? undefined : 2);
}

// CSV is a single flat table, so the selection must resolve to exactly one sheet.
// When it doesn't, we ask the user to disambiguate with `--sheet` rather than
// silently concatenating grids that don't share a header.
function renderCsv(sheets: readonly Sheet[]): string {
  const only = sheets[0];
  if (sheets.length !== 1 || only === undefined) {
    const names = sheets.map((s) => s.name).join(", ") || "(none)";
    throw new XlsError(
      `--csv needs exactly one sheet, but ${sheets.length} are selected (${names}) — narrow it with --sheet <name|index>`,
    );
  }
  return sheetToCsv(only);
}

function renderSheet(sheet: Sheet, options: CliOptions): SheetJson {
  const rows = options.asObjects ? sheetToObjects(sheet) : sheet.rows;
  return { name: sheet.name, visibility: sheet.visibility, rows };
}

// Applies `--visible-only` then the `--sheet` name/index filter. A `--sheet` that
// matches nothing is a user error, so it throws rather than emitting `[]`.
function selectSheets(sheets: readonly Sheet[], options: CliOptions): readonly Sheet[] {
  const pool = options.visibleOnly ? sheets.filter((s) => s.visibility === "visible") : sheets;
  const selector = options.sheet;
  if (selector === undefined) return pool;
  const selected = pool.filter(
    (sheet, index) => sheet.name === selector || String(index) === selector,
  );
  if (selected.length === 0) {
    const available = pool.map((s) => s.name).join(", ") || "(none)";
    throw new XlsError(`no sheet matches "${selector}" — available sheets: ${available}`);
  }
  return selected;
}
