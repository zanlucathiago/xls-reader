# Test fixtures

`sample.xls` is a **synthetic** BIFF8 workbook generated with Python's `xlwt`,
containing only made-up values. It exercises the reader end-to-end: shared
strings, integer/float (RK) numbers, a negative number, a boolean, a
date-formatted cell, and a second worksheet.

It is committed on purpose so the integration test runs against a real
Excel-97-2003 file with no external tooling. Regenerate with:

```py
import xlwt
from datetime import datetime

wb = xlwt.Workbook()
s1 = wb.add_sheet("Types")
s1.write(0, 0, "Emitente"); s1.write(0, 1, "Taxa"); s1.write(0, 2, "Data")
s1.write(1, 0, "BANCO X S/A"); s1.write(1, 1, 1.1)
s1.write(1, 2, 42, xlwt.easyxf(num_format_str="0"))
s1.write(2, 0, "CDB"); s1.write(2, 1, 110)
s1.write(2, 2, datetime(2024, 4, 2), xlwt.easyxf(num_format_str="DD/MM/YYYY"))
s1.write(3, 0, True); s1.write(3, 1, -5); s1.write(3, 2, 3.14)
s2 = wb.add_sheet("Renda Fixa")
s2.write(0, 0, "Produto")
s2.write(1, 0, "CDB DI"); s2.write(1, 1, 267.85)
wb.save("test/fixtures/sample.xls")
```

## `corrupt-huge-column.xls`

A **hostile** fixture: `sample.xls` with a handful of bytes flipped (found by the
fuzz harness in `test/robustness.test.ts`). The mutation lands in a cell record's
column field, decoding to column 6400 — far past the BIFF8 maximum of 255. The
dense grid is sized to the largest column seen, so before the fix this allocated
a hundreds-of-megabytes grid from a 5.6 KB file and OOM-crashed the process.

It is committed as a deterministic regression for that bug (`test/oom-repro.test.ts`,
vector 3): reading it must throw `XlsError`, not crash. Do not "repair" it.
