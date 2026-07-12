---
"xls-reader": minor
---

Surface sheet visibility and stop returning non-worksheet substreams. Each `Sheet`
now carries `visibility` (`"visible" | "hidden" | "very-hidden"`), decoded from the
`BOUNDSHEET8` record, so you can skip hidden lookup/config sheets. Chart sheets,
Excel-4 macro sheets, and VBA modules are bound sheets that hold no cells — they
were previously returned as empty phantom sheets and are now omitted from
`workbook.sheets`.
