const MS_PER_DAY = 86_400_000;

// Excel stores dates as a serial day count. Two epochs exist: the 1900 system
// (Windows) and the 1904 system (old Mac); the workbook's DATEMODE record says
// which. We anchor the 1900 system at 1899-12-30 UTC, which absorbs Excel's
// fictitious 1900-02-29 leap day for every date on/after 1900-03-01 (serial 61)
// — i.e. all real-world bank data. Dates in Jan/Feb 1900 would be off by one;
// that's a documented limitation.
//
// The result is a UTC Date; the fractional part of the serial becomes the time
// of day. @example excelSerialToDate(45384, false) // 2024-04-02T00:00:00.000Z
export function excelSerialToDate(serial: number, date1904: boolean): Date {
  const epochUtc = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  return new Date(epochUtc + serial * MS_PER_DAY);
}
