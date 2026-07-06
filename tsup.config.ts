import { defineConfig } from "tsup";

// Dual ESM + CJS output with type declarations, so the package works from both
// `import` and `require` — bank tooling is a mix of both.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: "es2021",
});
