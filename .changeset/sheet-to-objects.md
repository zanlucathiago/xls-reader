---
"xls-reader": minor
---

Add `sheetToObjects(sheet, options?)`, a helper that turns a parsed sheet's dense
rows into an array of objects keyed by a header row — the shape most callers want
when they read an `.xls` "into JSON". Blank-header columns are skipped, a short
data row is padded with `null`, and `headerRow` selects which row supplies the
keys (the first by default). Additive and zero-dependency; existing APIs are
unchanged.
