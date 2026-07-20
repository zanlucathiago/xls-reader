# xls-reader

## 0.7.0

### Minor Changes

- [#48](https://github.com/zanlucathiago/xls-reader/pull/48) [`0399e14`](https://github.com/zanlucathiago/xls-reader/commit/0399e14e6f55f23e9cc229a010910f2d5b51f574) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Add `sheetToCsv(sheet, options?)`, a CSV counterpart to `sheetToObjects`. It
  serializes a sheet's grid to a CSV string with RFC-4180 quoting: a `Date` becomes
  a UTC ISO-8601 string, a `CellError` becomes its code (e.g. `#DIV/0!`), and a
  blank cell becomes an empty field. `delimiter` defaults to `,` and `eol` to `\n`
  (pass `\r\n` for Excel-style output). Exports the new `SheetToCsvOptions` type.

  The `xls-reader` CLI gains a `--csv` flag that prints the selected sheet as CSV
  instead of JSON. CSV is a single flat table, so `--csv` needs the selection to
  resolve to exactly one sheet — pair it with `--sheet <name|index>` on a
  multi-sheet workbook — and it can't be combined with `--objects`.

## 0.6.0

### Minor Changes

- [#44](https://github.com/zanlucathiago/xls-reader/pull/44) [`3dc76b6`](https://github.com/zanlucathiago/xls-reader/commit/3dc76b6b4a4c3eb6e397ecee801359939feaf051) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Add `sheetToCsv(sheet, options?)`, a CSV counterpart to `sheetToObjects`. It
  serializes a sheet's grid to a CSV string with RFC-4180 quoting: a `Date` becomes
  a UTC ISO-8601 string, a `CellError` becomes its code (e.g. `#DIV/0!`), and a
  blank cell becomes an empty field. `delimiter` defaults to `,` and `eol` to `\n`
  (pass `\r\n` for Excel-style output). Exports the new `SheetToCsvOptions` type.

## 0.5.0

### Minor Changes

- [#42](https://github.com/zanlucathiago/xls-reader/pull/42) [`8249bd0`](https://github.com/zanlucathiago/xls-reader/commit/8249bd003bbc9cc767ede1e23a7dba4fae5408e9) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Return Excel error cells as a typed `CellError` instead of collapsing them to
  `null`. A cell holding `#DIV/0!`, `#N/A`, `#REF!`, `#VALUE!`, `#NAME?`, `#NUM!`,
  or `#NULL!` (whether a literal error or a formula's cached error result) now comes
  back as `new CellError(code)` — distinct from a blank cell (`null`) and from a
  text cell that happens to contain that string. Check `cell instanceof CellError`
  and read `cell.code`; in JSON it serializes to `{ "code": "#DIV/0!" }`. Exports
  the new `CellError` class and `ExcelErrorCode` type.

  Behavior change: error cells were previously `null`. If you relied on that, treat
  a `CellError` as empty explicitly.

## 0.4.0

### Minor Changes

- [#37](https://github.com/zanlucathiago/xls-reader/pull/37) [`67fb30c`](https://github.com/zanlucathiago/xls-reader/commit/67fb30cc06f2dba2ea59becbb7bfeca2fbb82654) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Add a `xls-reader` command-line tool. Run `npx xls-reader report.xls` to print a
  workbook's cells as JSON without writing any code — handy for a quick look or a
  shell pipeline, and directly runnable by agents/tooling. Flags: `--objects` (rows
  as header-keyed objects), `--sheet <name|index>`, `--visible-only`, `--compact`,
  plus `--help` / `--version`. It reads from a file argument and writes JSON to
  stdout; errors go to stderr with a non-zero exit code. The library API is
  unchanged.

## 0.3.0

### Minor Changes

- [#35](https://github.com/zanlucathiago/xls-reader/pull/35) [`5fe65c2`](https://github.com/zanlucathiago/xls-reader/commit/5fe65c29acb9f76894507cad9f54bdd74571c3ca) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Surface sheet visibility and stop returning non-worksheet substreams. Each `Sheet`
  now carries `visibility` (`"visible" | "hidden" | "very-hidden"`), decoded from the
  `BOUNDSHEET8` record, so you can skip hidden lookup/config sheets. Chart sheets,
  Excel-4 macro sheets, and VBA modules are bound sheets that hold no cells — they
  were previously returned as empty phantom sheets and are now omitted from
  `workbook.sheets`.

## 0.2.0

### Minor Changes

- [#33](https://github.com/zanlucathiago/xls-reader/pull/33) [`ada1411`](https://github.com/zanlucathiago/xls-reader/commit/ada1411238690bf8b3afbc970faeaf943e211a2d) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Add `sheetToObjects(sheet, options?)`, a helper that turns a parsed sheet's dense
  rows into an array of objects keyed by a header row — the shape most callers want
  when they read an `.xls` "into JSON". Blank-header columns are skipped, a short
  data row is padded with `null`, and `headerRow` selects which row supplies the
  keys (the first by default). Additive and zero-dependency; existing APIs are
  unchanged.

## 0.1.3

### Patch Changes

- [#30](https://github.com/zanlucathiago/xls-reader/pull/30) [`333f275`](https://github.com/zanlucathiago/xls-reader/commit/333f275aaad387bb550d7bc29074a6d342026f4f) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Harden the parser against malformed and malicious `.xls` input. Fuzzing surfaced
  inputs that could crash the process with a raw `RangeError` or exhaust memory
  (OOM) instead of failing with `XlsError`; all now fail cleanly:

  - Validate the CFB sector/mini-sector power-of-two shift (only 512/4096/64 are
    legal) — an out-of-range shift produced a negative or huge sector size.
  - Guard the DIFAT chain walk against self-loops that grew the FAT unbounded.
  - Reject a negative/non-integer read offset in the byte reader.
  - Enforce the BIFF8 sheet limits (65536 rows × 256 columns) so a corrupt cell
    column can't size the dense grid into a hundreds-of-megabytes allocation.

  Adds a seeded fuzz suite and deterministic regression vectors. No API change.

- [#28](https://github.com/zanlucathiago/xls-reader/pull/28) [`9e773c3`](https://github.com/zanlucathiago/xls-reader/commit/9e773c37571b605361b03056253249567e212c55) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Build with tsdown (rolldown) instead of tsup, which is no longer maintained. No
  API change and no runtime dependencies — the public `import`/`require` entry
  points resolve exactly as before via the `exports` map. Internally the ESM
  output is now `index.mjs` (was `index.js`); the CJS build is unchanged. This also
  drops the `ignoreDeprecations` TypeScript workaround that tsup required.

## 0.1.2

### Patch Changes

- [#22](https://github.com/zanlucathiago/xls-reader/pull/22) [`a00d7e1`](https://github.com/zanlucathiago/xls-reader/commit/a00d7e16c33ab57909046f571dd40e989d632fc1) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Docs & discoverability: sharpen the npm description and keywords, and add an
  "Convert an .xls to JSON" example plus an FAQ to the README (English and
  pt-BR). No API changes.

## 0.1.1

### Patch Changes

- [#1](https://github.com/zanlucathiago/xls-reader/pull/1) [`7cd6a31`](https://github.com/zanlucathiago/xls-reader/commit/7cd6a3127caa16fe2ecc3428b0b51cd51b5c4d45) Thanks [@zanlucathiago](https://github.com/zanlucathiago)! - Republish with npm provenance attestation and a rewritten README (badges,
  comparison table vs SheetJS/ExcelJS, browser and error-handling examples). No
  changes to the parser or public API.

## 0.1.0

Initial release. A zero-dependency reader for legacy `.xls` (BIFF8 / Excel
97–2003) files that returns each worksheet as a dense grid of typed cells
(strings, numbers, booleans, dates, and `null` for blank/error cells).

- OLE2 / Compound File container support, including mini streams.
- BIFF8 cell records: `LABELSST`, `LABEL`, `RSTRING`, `NUMBER`, `RK`, `MULRK`,
  `BLANK`, `MULBLANK`, `BOOLERR`, and `FORMULA` (with its cached `STRING`
  result).
- Shared-string table (`SST`) with `CONTINUE`-split strings.
- Date detection via `XF` + `FORMAT`, honoring the 1900 and 1904 date systems.
- Dual ESM/CJS output, full type declarations, and npm provenance.
