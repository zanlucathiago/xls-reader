---
"xls-reader": minor
---

Return Excel error cells as a typed `CellError` instead of collapsing them to
`null`. A cell holding `#DIV/0!`, `#N/A`, `#REF!`, `#VALUE!`, `#NAME?`, `#NUM!`,
or `#NULL!` (whether a literal error or a formula's cached error result) now comes
back as `new CellError(code)` — distinct from a blank cell (`null`) and from a
text cell that happens to contain that string. Check `cell instanceof CellError`
and read `cell.code`; in JSON it serializes to `{ "code": "#DIV/0!" }`. Exports
the new `CellError` class and `ExcelErrorCode` type.

Behavior change: error cells were previously `null`. If you relied on that, treat
a `CellError` as empty explicitly.
