<p align="center">
  <a href="https://www.npmjs.com/package/xls-reader">
    <img src="https://raw.githubusercontent.com/zanlucathiago/xls-reader/main/assets/banner.png" alt="xls-reader — zero-dependency reader for legacy .xls (BIFF8 / Excel 97–2003)" width="820" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/xls-reader"><img src="https://img.shields.io/npm/v/xls-reader.svg?color=cb3837&logo=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/xls-reader"><img src="https://img.shields.io/npm/dm/xls-reader.svg?color=cb3837&logo=npm" alt="npm downloads" /></a>
  <a href="https://github.com/zanlucathiago/xls-reader/actions/workflows/ci.yml"><img src="https://github.com/zanlucathiago/xls-reader/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="https://codecov.io/gh/zanlucathiago/xls-reader"><img src="https://codecov.io/gh/zanlucathiago/xls-reader/branch/main/graph/badge.svg" alt="coverage" /></a>
  <a href="https://bundlephobia.com/package/xls-reader"><img src="https://img.shields.io/bundlephobia/minzip/xls-reader.svg?label=min%2Bgzip" alt="bundle size" /></a>
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen.svg" alt="zero dependencies" />
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/xls-reader.svg?color=blue" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="https://zanlucathiago.github.io/xls-reader/demo.html"><strong>Live demo</strong></a> · <a href="https://zanlucathiago.github.io/xls-reader/">Website</a> · <strong>English</strong> · <a href="./README.pt-BR.md">Português (BR)</a>
</p>

Runs in Node and the browser — it only needs `Uint8Array` / `DataView`. It ships
as **~3.8 KB min+gzip with zero runtime dependencies**, dual ESM/CJS, fully typed,
and published to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements).

```bash
npm install xls-reader
# or: pnpm add xls-reader / yarn add xls-reader
```

## Contents

- [Why this exists](#why-this-exists)
- [Usage](#usage)
- [Convert an .xls to JSON](#convert-an-xls-to-json)
- [Command line](#command-line)
- [API](#api)
- [Comparison](#comparison)
- [Supported](#supported)
- [Limitations](#limitations)
- [FAQ](#faq)
- [Contributing](#contributing)

## Why this exists

Modern readers like [ExcelJS](https://github.com/exceljs/exceljs) only handle the
newer `.xlsx` (OOXML) format. The de-facto `.xls` reader,
[SheetJS](https://sheetjs.com), **no longer publishes to the npm registry** — its
last npm release (`0.18.5`) is frozen with known advisories, and fixed versions
ship only from its own CDN. Installing from a CDN means `npm audit` and
Dependabot can't see the package, so you lose automated vulnerability alerts.

`xls-reader` is a small, focused, **npm-published** alternative for the common
case: _read the cells out of a legacy `.xls`_. No dependencies, MIT-licensed,
covered by the same supply-chain tooling as the rest of your tree.

## Usage

```ts
import { readFile } from "node:fs/promises";
import { readXls } from "xls-reader";

const workbook = readXls(await readFile("posicao.xls"));

for (const sheet of workbook.sheets) {
  console.log(sheet.name);
  for (const row of sheet.rows) {
    console.log(row); // e.g. ["BANCO DAYCOVAL S/A", "CDB", "CDI", 1.1, Date(2024-04-02), 1000, ...]
  }
}
```

Single-sheet shortcut:

```ts
import { readFirstSheet } from "xls-reader";

const sheet = readFirstSheet(bytes);
```

In the browser (e.g. from a file `<input>`):

```ts
import { readXls } from "xls-reader";

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) return;
  const workbook = readXls(await file.arrayBuffer());
  console.table(workbook.sheets[0]?.rows);
});
```

## Convert an .xls to JSON

`sheetToObjects` uses the first row as the keys and returns one object per data
row:

```ts
import { readFirstSheet, sheetToObjects } from "xls-reader";

const sheet = readFirstSheet(bytes);
const json = sheet ? sheetToObjects(sheet) : [];
// [{ Emitente: "BANCO X S/A", Taxa: 1.1, Data: 2024-04-02T00:00:00.000Z }, ...]
```

Blank-header columns are skipped and short rows are padded with `null`. Pass
`{ headerRow }` when the header isn't the first row (e.g. a title row above it).

Handling non-`.xls` input:

```ts
import { readXls, XlsError } from "xls-reader";

try {
  const workbook = readXls(bytes);
} catch (err) {
  if (err instanceof XlsError) {
    // Not a BIFF .xls — e.g. it's really an .xlsx, CSV, or HTML mislabeled as .xls
    console.error(err.message);
  } else {
    throw err;
  }
}
```

## Command line

No code needed for a quick look or a shell pipeline — the package ships an
`xls-reader` bin that prints a workbook's cells as JSON (or CSV) to stdout:

```bash
npx xls-reader report.xls                    # every sheet, pretty-printed
npx xls-reader report.xls --objects          # rows keyed by the header row
npx xls-reader report.xls --sheet 0 --compact > sheet0.json
npx xls-reader report.xls --csv --sheet 0 > sheet0.csv
```

| Flag                | Effect                                           |
| ------------------- | ------------------------------------------------ |
| `--objects`         | Each row as an object keyed by the header row    |
| `--csv`             | The selected sheet as CSV (needs a single sheet) |
| `--sheet <name\|n>` | Only the sheet with this name or 0-based index   |
| `--visible-only`    | Skip hidden and very-hidden sheets               |
| `--compact`         | Single-line JSON (default is pretty-printed)     |

Output goes to stdout; errors go to stderr with a non-zero exit code. `--csv`
serializes a single sheet, so pair it with `--sheet` when the workbook has more
than one — otherwise it exits with an error listing the available sheets.

## API

### `readXls(data: ArrayBuffer | Uint8Array): Workbook`

Parses a whole workbook. Throws `XlsError` if the bytes aren't a BIFF `.xls`.

### `readFirstSheet(data): Sheet | undefined`

The first worksheet, for the single-sheet case.

### `sheetToObjects(sheet: Sheet, options?: { headerRow?: number }): RowObject[]`

Turns a sheet's rows into objects keyed by a header row (the first by default).
Blank-header columns are skipped and short rows are padded with `null`.

### `sheetToCsv(sheet: Sheet, options?: { delimiter?: string; eol?: string }): string`

Serializes a sheet to a CSV string with RFC-4180 quoting. A `Date` becomes a UTC
ISO-8601 string, a `CellError` becomes its code (e.g. `#DIV/0!`), and a blank
cell becomes an empty field. `delimiter` defaults to `,` and `eol` to `\n` (pass
`\r\n` for Excel-style output).

```ts
import { readFirstSheet, sheetToCsv } from "xls-reader";

const sheet = readFirstSheet(bytes);
const csv = sheet ? sheetToCsv(sheet) : "";
// "Name,Age\nAda,36\nAlan,41"
```

### `excelSerialToDate(serial: number, date1904: boolean): Date`

The raw serial-number → `Date` (UTC) conversion, if you need it directly.

### Types

```ts
type Cell = string | number | boolean | Date | CellError | null;

// An Excel error value, e.g. new CellError("#DIV/0!"). `.code` is the error text.
class CellError {
  readonly code: "#NULL!" | "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#NUM!" | "#N/A";
}

type SheetVisibility = "visible" | "hidden" | "very-hidden";

interface Sheet {
  name: string;
  visibility: SheetVisibility;
  rows: Cell[][]; // dense, null-padded to the last used column
}

interface Workbook {
  sheets: Sheet[];
}
```

- **Numbers** come back as `number` (both `NUMBER` and compact `RK` encodings).
- **Dates** — a number whose cell format is a date/time (built-in or custom) is
  returned as a `Date` (UTC). Use `excelSerialToDate` if you need the raw
  conversion.
- **Error** cells come back as a `CellError` (e.g. `#DIV/0!`, `#N/A`) — check
  `cell instanceof CellError` and read `cell.code`. In JSON they serialize to
  `{ "code": "#DIV/0!" }`.
- **Blank** cells are `null`.
- **Visibility** — each sheet reports whether it's `visible`, `hidden`, or
  `very-hidden`, so you can skip the hidden lookup/config tabs. Chart, macro, and
  VBA substreams aren't worksheets and are left out of `workbook.sheets`.

## Comparison

|                                  | **xls-reader** | SheetJS (`xlsx`)      | ExcelJS |
| -------------------------------- | -------------- | --------------------- | ------- |
| Reads legacy `.xls` (BIFF8)      | ✅             | ✅                    | ❌      |
| Reads `.xlsx` (OOXML)            | ❌             | ✅                    | ✅      |
| Latest fixes on the npm registry | ✅             | ⚠️ frozen at `0.18.5` | ✅      |
| Runtime dependencies             | **0**          | several               | several |
| Install size                     | ~4 KB min+gzip | large                 | large   |
| npm provenance attestation       | ✅             | ❌                    | ❌      |
| Writes files / styling / charts  | ❌             | ✅                    | ✅      |

If you need to **write** spreadsheets, style cells, or read `.xlsx`, reach for
ExcelJS or SheetJS. `xls-reader` deliberately does one thing: get the values out
of a legacy `.xls`.

## Supported

- OLE2 / Compound File container (regular **and** mini streams).
- BIFF8 records: `LABELSST`, `LABEL`, `RSTRING`, `NUMBER`, `RK`, `MULRK`,
  `BLANK`, `MULBLANK`, `BOOLERR`, `FORMULA` (+ its `STRING` result).
- Shared-string table (`SST`) including strings split across `CONTINUE` records.
- Date detection via `XF` + `FORMAT`, and the 1900 / 1904 date systems.
- Sheet visibility (`visible` / `hidden` / `very-hidden`); chart, Excel-4 macro,
  and VBA substreams are recognized and skipped (they aren't worksheets).

## Limitations

- Read-only, and reads **values** — not styling, merged-cell geometry, or charts.
- BIFF8 only (Excel 97+). It does not read the much older BIFF5/BIFF2, nor the
  HTML/XML files some tools mislabel as `.xls` (check the magic bytes).
- Encrypted workbooks are not supported.
- Dates before 1900-03-01 in the 1900 system are off by one day (Excel's
  historical leap-year bug); real-world data is unaffected.

## FAQ

### How do I read an `.xls` file in Node.js?

Install `xls-reader`, read the file into bytes, and call `readXls` — no other
setup, no native modules:

```ts
import { readFile } from "node:fs/promises";
import { readXls } from "xls-reader";

const workbook = readXls(await readFile("report.xls"));
```

### Is this a SheetJS (`xlsx`) alternative?

For **reading legacy `.xls`**, yes. SheetJS no longer publishes to npm, so
`xls-reader` is a small, npm-published, zero-dependency option when all you need
is the cell values. It does not write files or read `.xlsx` — for that, use
SheetJS or ExcelJS.

### Can it read `.xlsx` files?

No. `.xlsx` is the newer OOXML (zipped XML) format — a completely different
container. `xls-reader` handles the older binary BIFF8 `.xls` only. Use
[ExcelJS](https://github.com/exceljs/exceljs) for `.xlsx`.

### How do I convert an `.xls` to JSON?

See [Convert an .xls to JSON](#convert-an-xls-to-json) above — call
`sheetToObjects(sheet)` to key each data row by the header row.

### Does it work in the browser?

Yes. It only uses `Uint8Array` / `DataView`, so pass an `ArrayBuffer` (e.g. from
a file `<input>` or `fetch`) straight to `readXls`.

## Contributing

Bug reports, sample files, and PRs are very welcome — see
[CONTRIBUTING.md](./CONTRIBUTING.md). Please also read the
[Code of Conduct](./CODE_OF_CONDUCT.md). To report a security issue, see the
[Security Policy](./SECURITY.md).

## License

[MIT](./LICENSE) © Thiago Zanluca
