import { ByteReader } from "../byte-reader";
import type { Cell } from "../types";
import { decodeRk } from "./rk-number";
import { readUnicodeString } from "./unicode-string";

// A decoded cell with its position. Row/column are 0-based.
export interface PositionedCell {
  readonly row: number;
  readonly col: number;
  readonly value: Cell;
}

// What a cell decoder needs from the workbook globals: the shared strings, and a
// function that turns a raw number into a number or a Date depending on the
// cell's format (the xf index).
export interface CellContext {
  readonly sharedStrings: readonly string[];
  readonly numeric: (xfIndex: number, value: number) => number | Date;
}

// FORMULA results are either an immediate value or a promise of a STRING record
// that follows; the workbook loop resolves the latter.
export type FormulaResult =
  | { readonly kind: "value"; readonly cell: PositionedCell }
  | { readonly kind: "pending-string"; readonly row: number; readonly col: number };

export function decodeLabelSst(data: Uint8Array, ctx: CellContext): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col } = readHead(reader);
  const index = reader.u32();
  return { row, col, value: ctx.sharedStrings[index] ?? "" };
}

export function decodeLabel(data: Uint8Array): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col } = readHead(reader);
  return { row, col, value: readUnicodeString(reader, false) };
}

export function decodeNumber(data: Uint8Array, ctx: CellContext): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col, xf } = readHead(reader);
  return { row, col, value: ctx.numeric(xf, reader.f64()) };
}

export function decodeRkCell(data: Uint8Array, ctx: CellContext): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col, xf } = readHead(reader);
  return { row, col, value: ctx.numeric(xf, decodeRk(reader.u32())) };
}

export function decodeBlank(data: Uint8Array): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col } = readHead(reader);
  return { row, col, value: null };
}

export function decodeBoolErr(data: Uint8Array): PositionedCell {
  const reader = new ByteReader(data);
  const { row, col } = readHead(reader);
  const raw = reader.u8();
  const isError = reader.u8() !== 0;
  return { row, col, value: isError ? null : raw !== 0 };
}

// MULRK packs several RK cells sharing a row: [row][colFirst] then one (xf, rk)
// per column, then colLast. We derive the count from the record length.
export function decodeMulRk(data: Uint8Array, ctx: CellContext): PositionedCell[] {
  const reader = new ByteReader(data);
  const row = reader.u16();
  const colFirst = reader.u16();
  const count = (data.length - 6) / 6; // 6 header/trailer bytes; 6 bytes per entry
  const cells: PositionedCell[] = [];
  for (let i = 0; i < count; i++) {
    const xf = reader.u16();
    cells.push({ row, col: colFirst + i, value: ctx.numeric(xf, decodeRk(reader.u32())) });
  }
  return cells;
}

// MULBLANK is a run of blank cells: [row][colFirst] then one xf per column.
export function decodeMulBlank(data: Uint8Array): PositionedCell[] {
  const row = new ByteReader(data).u16();
  const colFirst = new ByteReader(data, 2).u16();
  const count = (data.length - 6) / 2; // 6 header/trailer bytes; 2 bytes per xf
  const cells: PositionedCell[] = [];
  for (let i = 0; i < count; i++) cells.push({ row, col: colFirst + i, value: null });
  return cells;
}

export function decodeFormula(data: Uint8Array, ctx: CellContext): FormulaResult {
  const reader = new ByteReader(data);
  const { row, col, xf } = readHead(reader);
  const result = data.subarray(reader.position, reader.position + 8);
  if (isNonNumericResult(result)) return nonNumericResult(row, col, result);
  return { kind: "value", cell: { row, col, value: ctx.numeric(xf, reader.f64()) } };
}

// A cached formula result is a plain double unless its last two bytes are 0xFFFF,
// which tags a string/boolean/error/blank result keyed by the leading byte.
function isNonNumericResult(result: Uint8Array): boolean {
  return result[6] === 0xff && result[7] === 0xff;
}

function nonNumericResult(row: number, col: number, result: Uint8Array): FormulaResult {
  const kind = result[0];
  if (kind === 0) return { kind: "pending-string", row, col };
  if (kind === 1) return { kind: "value", cell: { row, col, value: result[2] !== 0 } };
  return { kind: "value", cell: { row, col, value: null } }; // error (2) or blank (3)
}

// Every cell record starts with row (u16), column (u16), and an xf index (u16).
function readHead(reader: ByteReader): { row: number; col: number; xf: number } {
  return { row: reader.u16(), col: reader.u16(), xf: reader.u16() };
}
