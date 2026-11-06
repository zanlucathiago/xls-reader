---
"xls-reader": patch
---

Bounds-check `ByteReader.skip()` and reject invalid read lengths so corrupt SST/CONTINUE metadata fails as `XlsError` instead of leaving the cursor past the buffer.
