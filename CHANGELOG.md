# xls-reader

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
