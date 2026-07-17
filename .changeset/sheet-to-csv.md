---
"xls-reader": minor
---

Add `sheetToCsv(sheet, options?)`, a CSV counterpart to `sheetToObjects`. It
serializes a sheet's grid to a CSV string with RFC-4180 quoting: a `Date` becomes
a UTC ISO-8601 string, a `CellError` becomes its code (e.g. `#DIV/0!`), and a
blank cell becomes an empty field. `delimiter` defaults to `,` and `eol` to `\n`
(pass `\r\n` for Excel-style output). Exports the new `SheetToCsvOptions` type.
