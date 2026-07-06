import { ByteReader } from "../byte-reader";
import type { Cell, Sheet } from "../types";
import {
  decodeBlank,
  decodeBoolErr,
  decodeFormula,
  decodeLabel,
  decodeLabelSst,
  decodeMulBlank,
  decodeMulRk,
  decodeNumber,
  decodeRkCell,
  type CellContext,
  type PositionedCell,
} from "./cell-records";
import type { BiffRecord } from "./record-stream";
import { RecordType } from "./record-types";
import { readUnicodeString } from "./unicode-string";
import type { BoundSheet, WorkbookGlobals } from "./workbook-globals";

type Decoder = (data: Uint8Array, ctx: CellContext) => PositionedCell[];

// Cell records that decode to zero or more cells without look-ahead. FORMULA is
// handled separately because its string result arrives in a following record.
const DECODERS: ReadonlyMap<number, Decoder> = new Map([
  [RecordType.LABELSST, (d, c) => [decodeLabelSst(d, c)]],
  [RecordType.LABEL, (d) => [decodeLabel(d)]],
  [RecordType.RSTRING, (d) => [decodeLabel(d)]],
  [RecordType.NUMBER, (d, c) => [decodeNumber(d, c)]],
  [RecordType.RK, (d, c) => [decodeRkCell(d, c)]],
  [RecordType.MULRK, (d, c) => decodeMulRk(d, c)],
  [RecordType.BLANK, (d) => [decodeBlank(d)]],
  [RecordType.MULBLANK, (d) => decodeMulBlank(d)],
  [RecordType.BOOLERR, (d) => [decodeBoolErr(d)]],
]);

// Decodes one worksheet: walk its records (from its BOF to EOF) into positioned
// cells, then pack them into a dense, null-padded grid.
export function decodeSheet(
  records: readonly BiffRecord[],
  boundSheet: BoundSheet,
  offsetToIndex: ReadonlyMap<number, number>,
  globals: WorkbookGlobals,
): Sheet {
  const ctx: CellContext = { sharedStrings: globals.sharedStrings, numeric: globals.numeric };
  const cells = collectCells(records, offsetToIndex.get(boundSheet.offset), ctx);
  return { name: boundSheet.name, rows: toGrid(cells) };
}

function collectCells(
  records: readonly BiffRecord[],
  start: number | undefined,
  ctx: CellContext,
): PositionedCell[] {
  if (start === undefined) return [];
  const cells: PositionedCell[] = [];
  let pending: { row: number; col: number } | null = null;
  for (let i = start + 1; i < records.length; i++) {
    const record = records[i];
    if (record === undefined || record.type === RecordType.EOF) break;
    pending = handleRecord(record, cells, pending, ctx);
  }
  return cells;
}

// Processes one record, appending any decoded cells. Threads the "a FORMULA is
// waiting for its STRING result" state through the loop.
function handleRecord(
  record: BiffRecord,
  cells: PositionedCell[],
  pending: { row: number; col: number } | null,
  ctx: CellContext,
): { row: number; col: number } | null {
  if (record.type === RecordType.STRING && pending) {
    cells.push({ ...pending, value: readUnicodeString(new ByteReader(record.data), false) });
    return null;
  }
  if (record.type === RecordType.FORMULA) return appendFormula(record.data, cells, ctx);
  const decode = DECODERS.get(record.type);
  if (decode) cells.push(...decode(record.data, ctx));
  return null;
}

function appendFormula(
  data: Uint8Array,
  cells: PositionedCell[],
  ctx: CellContext,
): { row: number; col: number } | null {
  const result = decodeFormula(data, ctx);
  if (result.kind === "value") {
    cells.push(result.cell);
    return null;
  }
  return { row: result.row, col: result.col };
}

// Packs sparse positioned cells into a dense grid, padding gaps with null so
// every row has the same length (the sheet's last used column + 1).
function toGrid(cells: readonly PositionedCell[]): Cell[][] {
  if (cells.length === 0) return [];
  const maxRow = cells.reduce((max, cell) => Math.max(max, cell.row), 0);
  const maxCol = cells.reduce((max, cell) => Math.max(max, cell.col), 0);
  const rows: Cell[][] = Array.from({ length: maxRow + 1 }, () =>
    new Array<Cell>(maxCol + 1).fill(null),
  );
  for (const cell of cells) {
    const row = rows[cell.row];
    if (row) row[cell.col] = cell.value;
  }
  return rows;
}
