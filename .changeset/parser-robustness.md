---
"xls-reader": patch
---

Harden the parser against malformed and malicious `.xls` input. Fuzzing surfaced
inputs that could crash the process with a raw `RangeError` or exhaust memory
(OOM) instead of failing with `XlsError`; all now fail cleanly:

- Validate the CFB sector/mini-sector power-of-two shift (only 512/4096/64 are
  legal) — an out-of-range shift produced a negative or huge sector size.
- Guard the DIFAT chain walk against self-loops that grew the FAT unbounded.
- Reject a negative/non-integer read offset in the byte reader.
- Enforce the BIFF8 sheet limits (65536 rows × 256 columns) so a corrupt cell
  column can't size the dense grid into a hundreds-of-megabytes allocation.

Adds a seeded fuzz suite and deterministic regression vectors. No API change.
