// Thrown when the input isn't a readable BIFF8 .xls file. Carries a message that
// names the offending value and what was expected, so callers can log or branch
// (e.g. "not an .xls — try an .xlsx reader instead").
export class XlsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsError";
  }
}
