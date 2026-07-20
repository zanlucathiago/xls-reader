// How the selected sheets are serialized to stdout: a JSON document (default) or,
// with `--csv`, one sheet's grid as CSV.
export type OutputFormat = "json" | "csv";

// The read options carried by a parsed CLI invocation. `sheet` is a name or a
// 0-based index; undefined means "every sheet".
export interface CliOptions {
  readonly file: string;
  readonly sheet: string | undefined;
  readonly asObjects: boolean;
  readonly visibleOnly: boolean;
  readonly compact: boolean;
  readonly format: OutputFormat;
}

// The outcome of parsing argv: a read to run, a terminal help/version request, or
// a usage error the runner reports on stderr.
export type ParsedArgs =
  | { readonly kind: "run"; readonly options: CliOptions }
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | { readonly kind: "error"; readonly message: string };

interface Accumulator {
  file: string | undefined;
  sheet: string | undefined;
  asObjects: boolean;
  visibleOnly: boolean;
  compact: boolean;
  format: OutputFormat;
}

// Parses the CLI arguments (argv without node/script). Help and version win over
// everything; otherwise flags are folded in and the first bare token is the file.
export function parseArgs(argv: readonly string[]): ParsedArgs {
  if (hasFlag(argv, "-h", "--help")) return { kind: "help" };
  if (hasFlag(argv, "-v", "--version")) return { kind: "version" };
  const acc: Accumulator = createAccumulator();
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] ?? "";
    if (token === "--sheet") {
      acc.sheet = argv[++i];
      continue;
    }
    const error = applyToken(token, acc);
    if (error !== null) return { kind: "error", message: error };
  }
  if (acc.file === undefined)
    return { kind: "error", message: "missing .xls file argument (try --help)" };
  // CSV renders a single grid, so the row-reshaping of --objects has no meaning
  // there; reject the pair rather than silently ignoring one of them.
  if (acc.format === "csv" && acc.asObjects)
    return { kind: "error", message: "--csv cannot be combined with --objects (try --help)" };
  return { kind: "run", options: { ...acc, file: acc.file } };
}

function createAccumulator(): Accumulator {
  return {
    file: undefined,
    sheet: undefined,
    asObjects: false,
    visibleOnly: false,
    compact: false,
    format: "json",
  };
}

function hasFlag(argv: readonly string[], ...names: readonly string[]): boolean {
  return argv.some((arg) => names.includes(arg));
}

// Folds one token into the accumulator; returns an error message for an unknown
// option or a second positional, or null when the token was consumed cleanly.
function applyToken(token: string, acc: Accumulator): string | null {
  if (token.startsWith("--sheet=")) {
    acc.sheet = token.slice("--sheet=".length);
    return null;
  }
  if (token === "--objects") acc.asObjects = true;
  else if (token === "--csv") acc.format = "csv";
  else if (token === "--visible-only") acc.visibleOnly = true;
  else if (token === "--compact") acc.compact = true;
  else if (token.startsWith("-")) return `unknown option "${token}" (try --help)`;
  else if (acc.file !== undefined) return `unexpected extra argument "${token}"`;
  else acc.file = token;
  return null;
}
