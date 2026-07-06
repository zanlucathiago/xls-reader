# xls-reader

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
