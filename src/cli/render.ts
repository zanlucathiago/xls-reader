import { XlsError } from "../errors";
import { sheetToObjects } from "../sheet-to-objects";
import type { Cell, RowObject, Sheet, SheetVisibility, Workbook } from "../types";
import type { CliOptions } from "./args";

interface SheetJson {
  readonly name: string;
  readonly visibility: SheetVisibility;
  readonly rows: ReadonlyArray<ReadonlyArray<Cell>> | readonly RowObject[];
}

// Renders the selected sheets as a JSON string. Dates serialize to ISO strings
// via the default `Date.toJSON`, which is what a JSON consumer expects.
export function renderWorkbook(workbook: Workbook, options: CliOptions): string {
  const payload = selectSheets(workbook.sheets, options).map((sheet) =>
    renderSheet(sheet, options),
  );
  return JSON.stringify(payload, null, options.compact ? undefined : 2);
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
