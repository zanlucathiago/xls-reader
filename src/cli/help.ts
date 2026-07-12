export const HELP_TEXT = `xls-reader — read a legacy .xls (BIFF8 / Excel 97-2003) and print its cells as JSON

Usage:
  xls-reader <file.xls> [options]

Options:
  --objects          Emit each row as an object keyed by the header row
  --sheet <name|n>   Only the sheet with this name or 0-based index
  --visible-only     Skip hidden and very-hidden sheets
  --compact          Single-line JSON (default is pretty-printed)
  -v, --version      Print the version
  -h, --help         Show this help

Examples:
  xls-reader report.xls
  xls-reader report.xls --objects --sheet 0
  npx xls-reader report.xls --visible-only > report.json
`;
