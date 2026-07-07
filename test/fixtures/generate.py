#!/usr/bin/env python3
"""Regenerates the synthetic BIFF8 fixtures used by the test suite.

Run inside a venv with xlwt (`pip install xlwt==1.3.0`):

    python3 test/fixtures/generate.py

Each file targets one reader behavior so a failure points at a specific feature.
Values here are made up; commit the outputs so tests need no external tooling.
See README.md for the per-file description that the tests assert against.
"""

import io
import os
from datetime import datetime, time

import xlwt

HERE = os.path.dirname(os.path.abspath(__file__))


def save(wb: xlwt.Workbook, name: str) -> None:
    path = os.path.join(HERE, name)
    wb.save(path)
    with open(path, "rb") as fh:
        print(f"  {name}: {len(fh.read())} bytes")


# 1900 vs 1904 date system: the same wall-clock date must decode identically
# regardless of the workbook's epoch flag. Excel's two epochs are 4 years and a
# day apart, so this catches an epoch mix-up.
def date_systems() -> None:
    for flag, name in ((False, "dates-1900.xls"), (True, "dates-1904.xls")):
        wb = xlwt.Workbook()
        wb.dates_1904 = flag
        s = wb.add_sheet("Dates")
        date_fmt = xlwt.easyxf(num_format_str="YYYY-MM-DD")
        time_fmt = xlwt.easyxf(num_format_str="HH:MM:SS")
        s.write(0, 0, datetime(2024, 4, 2), date_fmt)  # a plain date
        s.write(1, 0, datetime(1999, 12, 31), date_fmt)  # pre-2000
        s.write(2, 0, time(13, 30, 0), time_fmt)  # time-of-day, no date
        save(wb, name)


# A shared string longer than the ~8 KB BIFF record payload, forcing the SST to
# split it across CONTINUE records — the trickiest part of string decoding.
def continued_string() -> None:
    wb = xlwt.Workbook()
    s = wb.add_sheet("Long")
    long_ascii = "A" * 9000  # > 8224, so the character array spills a CONTINUE
    s.write(0, 0, long_ascii)
    s.write(1, 0, "short-after-long")  # a normal string following the split one
    # Repeat one string so the SST stores it once and both cells share the index.
    s.write(2, 0, "REPEAT")
    s.write(3, 0, "REPEAT")
    save(wb, "continued-string.xls")


# Non-ASCII text exercises the wide (UTF-16) string path rather than the
# compressed 8-bit path.
def unicode_text() -> None:
    wb = xlwt.Workbook()
    s = wb.add_sheet("Unicode")
    s.write(0, 0, "Ações")  # Latin-1 accents
    s.write(1, 0, "café ☕")  # symbol outside BMP-low
    s.write(2, 0, "日本語")  # CJK
    s.write(3, 0, "Ω≈ç√")  # math/greek
    save(wb, "unicode.xls")


# Numeric variety: integers, negatives, decimals, zero, and a large magnitude —
# spanning both the compact RK encoding and full 8-byte NUMBER records.
def numbers() -> None:
    wb = xlwt.Workbook()
    s = wb.add_sheet("Numbers")
    values = [0, 1, -1, 42, -273.15, 3.14159, 1000000, 0.0001, 2500000000]
    for i, v in enumerate(values):
        s.write(i, 0, v)
    save(wb, "numbers.xls")


# A larger grid, to exercise multi-record rows and a non-trivial used range.
def large_grid() -> None:
    wb = xlwt.Workbook()
    s = wb.add_sheet("Grid")
    for r in range(200):
        for c in range(20):
            s.write(r, c, r * 100 + c)
    save(wb, "large-grid.xls")


if __name__ == "__main__":
    print("Generating fixtures:")
    date_systems()
    continued_string()
    unicode_text()
    numbers()
    large_grid()
    print("Done.")
