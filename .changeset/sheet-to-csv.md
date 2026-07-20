---
"xls-reader": minor
---

Add `sheetToCsv(sheet, options?)`, a CSV counterpart to `sheetToObjects`. It
serializes a sheet's grid to a CSV string with RFC-4180 quoting: a `Date` becomes
a UTC ISO-8601 string, a `CellError` becomes its code (e.g. `#DIV/0!`), and a
blank cell becomes an empty field. `delimiter` defaults to `,` and `eol` to `\n`
(pass `\r\n` for Excel-style output). Exports the new `SheetToCsvOptions` type.

The `xls-reader` CLI gains a `--csv` flag that prints the selected sheet as CSV
instead of JSON. CSV is a single flat table, so `--csv` needs the selection to
resolve to exactly one sheet — pair it with `--sheet <name|index>` on a
multi-sheet workbook — and it can't be combined with `--objects`.
