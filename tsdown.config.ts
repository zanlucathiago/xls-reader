import { defineConfig } from "tsdown";

// Dual ESM + CJS output with type declarations, so the package works from both
// `import` and `require` — bank tooling is a mix of both. tsdown (rolldown) is
// the maintained successor to tsup; its Rust-based dts avoids the deprecated
// `baseUrl` injection that tsup added, so no `ignoreDeprecations` is needed.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: "es2021",
});
