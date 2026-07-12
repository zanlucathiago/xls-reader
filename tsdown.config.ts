import { defineConfig } from "tsdown";

// Dual ESM + CJS output with type declarations, so the package works from both
// `import` and `require` — bank tooling is a mix of both. tsdown (rolldown) is
// the maintained successor to tsup; its Rust-based dts avoids the deprecated
// `baseUrl` injection that tsup added, so no `ignoreDeprecations` is needed.
export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    target: "es2021",
  },
  // The CLI is ESM-only (it's a bin, never imported) and needs no .d.ts. The
  // shebang in src/cli.ts is preserved so dist/cli.mjs is directly executable.
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    clean: false,
    sourcemap: false,
    minify: false,
    target: "es2021",
  },
]);
