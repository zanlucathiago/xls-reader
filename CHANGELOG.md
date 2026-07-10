# xls-reader

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
