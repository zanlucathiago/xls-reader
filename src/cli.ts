#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { runCli } from "./cli/run";

// The bin is emitted to dist/cli.mjs, so package.json is one directory up in both
// the published package and a local build — read the version from there rather
// than duplicating it.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

runCli(process.argv.slice(2), {
  readFile: (path) => readFile(path),
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  },
  version: pkg.version,
})
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(`xls-reader: ${String(error)}\n`);
    process.exit(1);
  });
