import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseArgs, type CliOptions } from "../src/cli/args";
import { renderWorkbook } from "../src/cli/render";
import { runCli, type CliIO } from "../src/cli/run";
import { XlsError } from "../src/errors";
import type { Cell, Sheet, Workbook } from "../src/types";

const NUMBERS_XLS = readFileSync(new URL("./fixtures/numbers.xls", import.meta.url));

// Captures stdout/stderr and serves canned bytes (or a rejection) so the runner
// exercises the full pipeline without touching the real filesystem or streams.
class FakeCliIO implements CliIO {
  out = "";
  err = "";
  readonly version = "9.9.9";
  constructor(private readonly result: Uint8Array | Error) {}
  readFile = (): Promise<Uint8Array> =>
    this.result instanceof Error ? Promise.reject(this.result) : Promise.resolve(this.result);
  stdout = (text: string): void => {
    this.out += text;
  };
  stderr = (text: string): void => {
    this.err += text;
  };
}

interface OutSheet {
  name: string;
  visibility: string;
  rows: unknown;
}

function sheet(name: string, visibility: Sheet["visibility"], rows: Cell[][]): Sheet {
  return { name, visibility, rows };
}

function options(overrides: Partial<CliOptions> = {}): CliOptions {
  return {
    file: "x.xls",
    sheet: undefined,
    asObjects: false,
    visibleOnly: false,
    compact: false,
    format: "json",
    ...overrides,
  };
}

describe("parseArgs", () => {
  it("reads the file with defaults", () => {
    expect(parseArgs(["a.xls"])).toEqual({
      kind: "run",
      options: {
        file: "a.xls",
        sheet: undefined,
        asObjects: false,
        visibleOnly: false,
        compact: false,
        format: "json",
      },
    });
  });

  it("collects flags and the --sheet value in both forms", () => {
    expect(
      parseArgs(["a.xls", "--objects", "--visible-only", "--compact", "--sheet", "2"]),
    ).toEqual({
      kind: "run",
      options: {
        file: "a.xls",
        sheet: "2",
        asObjects: true,
        visibleOnly: true,
        compact: true,
        format: "json",
      },
    });
    const eq = parseArgs(["--sheet=Report", "a.xls"]);
    expect(eq.kind === "run" && eq.options.sheet).toBe("Report");
  });

  it("--csv selects the csv output format", () => {
    const parsed = parseArgs(["a.xls", "--csv"]);
    expect(parsed.kind === "run" && parsed.options.format).toBe("csv");
  });

  it("rejects --csv together with --objects", () => {
    const conflict = parseArgs(["a.xls", "--csv", "--objects"]);
    expect(conflict.kind).toBe("error");
    expect(conflict.kind === "error" && conflict.message).toContain("--csv cannot be combined");
  });

  it("returns help and version outcomes", () => {
    expect(parseArgs(["-h"]).kind).toBe("help");
    expect(parseArgs(["--help"]).kind).toBe("help");
    expect(parseArgs(["-v"]).kind).toBe("version");
  });

  it("errors on a missing file, an unknown option, or a second file", () => {
    const missing = parseArgs(["--objects"]);
    expect(missing.kind).toBe("error");
    expect(missing.kind === "error" && missing.message).toContain("missing .xls");
    expect(parseArgs(["a.xls", "--nope"]).kind).toBe("error");
    expect(parseArgs(["a.xls", "b.xls"]).kind).toBe("error");
  });
});

describe("renderWorkbook", () => {
  const workbook: Workbook = {
    sheets: [
      sheet("Data", "visible", [
        ["Name", "Age"],
        ["Ada", 36],
      ]),
      sheet("Hidden", "hidden", [["x"]]),
    ],
  };
  const parse = (json: string): OutSheet[] => JSON.parse(json) as OutSheet[];

  it("emits rows as arrays, pretty-printed by default", () => {
    const out = renderWorkbook(workbook, options());
    expect(out).toContain("\n  ");
    expect(parse(out)[0]).toEqual({
      name: "Data",
      visibility: "visible",
      rows: [
        ["Name", "Age"],
        ["Ada", 36],
      ],
    });
  });

  it("--objects keys each row by the header row", () => {
    const parsed = parse(renderWorkbook(workbook, options({ asObjects: true, sheet: "Data" })));
    expect(parsed[0]?.rows).toEqual([{ Name: "Ada", Age: 36 }]);
  });

  it("--visible-only drops hidden sheets", () => {
    expect(
      parse(renderWorkbook(workbook, options({ visibleOnly: true }))).map((s) => s.name),
    ).toEqual(["Data"]);
  });

  it("--sheet selects by name or 0-based index", () => {
    expect(parse(renderWorkbook(workbook, options({ sheet: "1" }))).map((s) => s.name)).toEqual([
      "Hidden",
    ]);
    expect(parse(renderWorkbook(workbook, options({ sheet: "Data" }))).map((s) => s.name)).toEqual([
      "Data",
    ]);
  });

  it("--compact yields single-line JSON", () => {
    expect(renderWorkbook(workbook, options({ compact: true }))).not.toContain("\n");
  });

  it("throws XlsError when --sheet matches nothing", () => {
    expect(() => renderWorkbook(workbook, options({ sheet: "ghost" }))).toThrow(XlsError);
  });

  it("--csv renders the single selected sheet as CSV", () => {
    const csv = renderWorkbook(workbook, options({ format: "csv", sheet: "Data" }));
    expect(csv).toBe("Name,Age\nAda,36");
  });

  it("--csv throws XlsError when the selection isn't exactly one sheet", () => {
    expect(() => renderWorkbook(workbook, options({ format: "csv" }))).toThrow(XlsError);
    expect(() => renderWorkbook(workbook, options({ format: "csv" }))).toThrow(/exactly one sheet/);
  });
});

describe("runCli", () => {
  it("reads a real .xls and prints JSON (exit 0)", async () => {
    const io = new FakeCliIO(NUMBERS_XLS);
    expect(await runCli(["numbers.xls", "--compact"], io)).toBe(0);
    expect((JSON.parse(io.out) as OutSheet[])[0]?.name).toBe("Numbers");
  });

  it("reads a real .xls and prints CSV (exit 0)", async () => {
    const io = new FakeCliIO(NUMBERS_XLS);
    expect(await runCli(["numbers.xls", "--csv", "--sheet", "0"], io)).toBe(0);
    expect(io.out).not.toContain("{");
    expect(io.out.endsWith("\n")).toBe(true);
    expect(io.out.split("\n").length).toBeGreaterThan(1);
  });

  it("prints help and version to stdout (exit 0)", async () => {
    const help = new FakeCliIO(NUMBERS_XLS);
    expect(await runCli(["--help"], help)).toBe(0);
    expect(help.out).toContain("Usage:");
    const version = new FakeCliIO(NUMBERS_XLS);
    expect(await runCli(["--version"], version)).toBe(0);
    expect(version.out).toBe("9.9.9\n");
  });

  it("reports a usage error on stderr (exit 2)", async () => {
    const io = new FakeCliIO(NUMBERS_XLS);
    expect(await runCli([], io)).toBe(2);
    expect(io.err).toContain("missing .xls");
  });

  it("reports a missing file (exit 1)", async () => {
    const io = new FakeCliIO(Object.assign(new Error("nope"), { code: "ENOENT" }));
    expect(await runCli(["gone.xls"], io)).toBe(1);
    expect(io.err).toContain("file not found: gone.xls");
  });

  it("reports invalid .xls bytes as an error (exit 1)", async () => {
    const io = new FakeCliIO(new Uint8Array([1, 2, 3, 4]));
    expect(await runCli(["bad.xls"], io)).toBe(1);
    expect(io.err).toContain("xls-reader:");
  });
});
