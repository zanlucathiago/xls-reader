---
"xls-reader": minor
---

Add a `xls-reader` command-line tool. Run `npx xls-reader report.xls` to print a
workbook's cells as JSON without writing any code — handy for a quick look or a
shell pipeline, and directly runnable by agents/tooling. Flags: `--objects` (rows
as header-keyed objects), `--sheet <name|index>`, `--visible-only`, `--compact`,
plus `--help` / `--version`. It reads from a file argument and writes JSON to
stdout; errors go to stderr with a non-zero exit code. The library API is
unchanged.
