# xls-reader

Zero-dependency reader for **legacy `.xls`** files (BIFF8 — Excel 97–2003). It
returns each worksheet as a grid of typed cells: strings, numbers, booleans, and
dates. Runs in Node and the browser (it only needs `Uint8Array` / `DataView`).

```bash
npm install xls-reader
```

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

## API

### `readXls(data: ArrayBuffer | Uint8Array): Workbook`

Parses a whole workbook. Throws `XlsError` if the bytes aren't a BIFF `.xls`.

### `readFirstSheet(data): Sheet | undefined`

The first worksheet, for the single-sheet case.

### Types

```ts
type Cell = string | number | boolean | Date | null;
interface Sheet {
  name: string;
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
- **Blank / error** cells are `null`.

## Supported

- OLE2 / Compound File container (regular **and** mini streams).
- BIFF8 records: `LABELSST`, `LABEL`, `RSTRING`, `NUMBER`, `RK`, `MULRK`,
  `BLANK`, `MULBLANK`, `BOOLERR`, `FORMULA` (+ its `STRING` result).
- Shared-string table (`SST`) including strings split across `CONTINUE` records.
- Date detection via `XF` + `FORMAT`, and the 1900 / 1904 date systems.

## Limitations

- Read-only, and reads **values** — not styling, merged-cell geometry, or charts.
- BIFF8 only (Excel 97+). It does not read the much older BIFF5/BIFF2, nor the
  HTML/XML files some tools mislabel as `.xls` (check the magic bytes).
- Encrypted workbooks are not supported.
- Dates before 1900-03-01 in the 1900 system are off by one day (Excel's
  historical leap-year bug); real-world data is unaffected.

## License

[MIT](./LICENSE) © Thiago Zanluca
