---
"xls-reader": patch
---

Build with tsdown (rolldown) instead of tsup, which is no longer maintained. No
API change and no runtime dependencies — the public `import`/`require` entry
points resolve exactly as before via the `exports` map. Internally the ESM
output is now `index.mjs` (was `index.js`); the CJS build is unchanged. This also
drops the `ignoreDeprecations` TypeScript workaround that tsup required.
