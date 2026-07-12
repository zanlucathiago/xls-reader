import { XlsError } from "../errors";
import { readXls } from "../reader";
import { parseArgs, type CliOptions } from "./args";
import { HELP_TEXT } from "./help";
import { renderWorkbook } from "./render";

// The I/O and environment the CLI depends on, injected so the runner can be
// tested against fakes instead of the real filesystem and process streams.
export interface CliIO {
  readonly readFile: (path: string) => Promise<Uint8Array>;
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
  readonly version: string;
}

// Runs the CLI end-to-end and resolves to the process exit code (0 ok, 1 read
// failure, 2 usage error). Never rejects — every failure becomes a stderr line.
export async function runCli(argv: readonly string[], io: CliIO): Promise<number> {
  const parsed = parseArgs(argv);
  if (parsed.kind === "help") return emit(io.stdout, HELP_TEXT, 0);
  if (parsed.kind === "version") return emit(io.stdout, `${io.version}\n`, 0);
  if (parsed.kind === "error") return emit(io.stderr, `xls-reader: ${parsed.message}\n`, 2);
  return readAndRender(parsed.options, io);
}

function emit(write: (text: string) => void, text: string, code: number): number {
  write(text);
  return code;
}

async function readAndRender(options: CliOptions, io: CliIO): Promise<number> {
  try {
    const bytes = await io.readFile(options.file);
    io.stdout(`${renderWorkbook(readXls(bytes), options)}\n`);
    return 0;
  } catch (error) {
    io.stderr(`xls-reader: ${describeError(error, options.file)}\n`);
    return 1;
  }
}

// One-line, user-facing message (plain text, per the CLI logging convention).
// XlsError messages already name the offending value; ENOENT gets a friendlier
// phrasing than Node's raw "ENOENT: no such file or directory".
function describeError(error: unknown, file: string): string {
  if (error instanceof XlsError) return error.message;
  if (isNoSuchFile(error)) return `file not found: ${file}`;
  return error instanceof Error ? error.message : String(error);
}

function isNoSuchFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
