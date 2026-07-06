// Built-in number-format ids that Excel renders as dates/times ([MS-XLS]
// §2.5.198.17). Custom formats (id >= 164, or overridden builtins) are checked
// by their format string instead.
const BUILTIN_DATE_FORMAT_IDS = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51,
  52, 53, 54, 55, 56, 57, 58,
]);

// Whether a cell with this format index should be read as a date. A numeric cell
// is only a "date" because of its format, so this decides Date vs number.
export function isDateFormatIndex(
  formatIndex: number,
  customFormats: ReadonlyMap<number, string>,
): boolean {
  if (BUILTIN_DATE_FORMAT_IDS.has(formatIndex)) return true;
  const format = customFormats.get(formatIndex);
  return format !== undefined && looksLikeDateFormat(format);
}

// A format string is a date/time format if, after removing literals, it still
// contains a date/time token (y, m, d, h, s). Stripping avoids false positives
// like "m" inside a quoted currency prefix.
function looksLikeDateFormat(format: string): boolean {
  const stripped = format
    .replace(/\\./g, "")
    .replace(/"[^"]*"/g, "")
    .replace(/\[[^\]]*\]/g, "");
  return /[ymdhs]/i.test(stripped);
}
