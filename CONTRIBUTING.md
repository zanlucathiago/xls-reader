# Contributing to xls-reader

Thanks for taking the time to contribute! This is a small, focused library, and
that focus is a feature — so please read this before opening a large PR.

## Project scope

`xls-reader` reads **values** out of legacy BIFF8 `.xls` workbooks (Excel
97–2003) with **zero runtime dependencies**. In scope:

- Correctly decoding more BIFF8 records and cell encodings.
- Better error messages, edge-case handling, and real-world compatibility.
- Docs, tests, and tooling.

Out of scope (for now):

- Writing `.xls` files.
- Styling, merged-cell geometry, charts, formulas beyond their cached value.
- `.xlsx` (OOXML) — use [ExcelJS](https://github.com/exceljs/exceljs).

If you want something out of scope, open an issue first so we can discuss it
before you write code.

## Development setup

We use [pnpm](https://pnpm.io) (see `packageManager` in `package.json`) and
Node `>=18` (CI runs on 22).

```bash
git clone https://github.com/zanlucathiago/xls-reader.git
cd xls-reader
pnpm install
```

Common tasks:

```bash
pnpm test          # run the test suite once
pnpm test:watch    # watch mode
pnpm coverage      # test suite with a coverage report
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint
pnpm format        # prettier --write .
pnpm build         # bundle to dist/ with tsup
```

Before pushing, make sure `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
all pass — that's exactly what CI runs.

## Coding conventions

- **TypeScript, explicit types.** No `any`. Public functions get a docstring
  with intent and a short example.
- **Small units.** Functions stay short and do one thing; files stay focused on
  one responsibility. Mirror the existing `src/cfb`, `src/biff` layout.
- **Comments explain _why_,** not what — especially the BIFF/OLE2 quirks, which
  are easy to get wrong. When a line exists because of a spec detail, cite it.
- **Errors name the offending value** and the expected shape, and are thrown as
  `XlsError` so callers can branch on them.
- Formatting is handled by Prettier; don't hand-format.

## Tests

- Every new function gets a test; every bug fix gets a regression test.
- Tests must be fast, independent, and self-validating (they run with
  `pnpm test`).
- Prefer unit tests against a focused helper. For end-to-end coverage, add a
  small synthetic fixture and document how it was generated (see
  `test/fixtures/README.md`) — please **do not** commit real, proprietary
  workbooks.

## Changesets (for maintainers and contributors)

We version and publish with [Changesets](https://github.com/changesets/changesets).
If your change affects the published package (a fix, feature, or breaking
change), add a changeset in the same PR:

```bash
pnpm changeset
```

Pick the bump type (patch/minor/major) and write a one-line, user-facing summary.
Commit the generated file under `.changeset/`. Docs-only or CI-only changes
don't need one.

## Submitting a pull request

1. Fork and create a branch off `main`.
2. Make your change with tests and (if user-facing) a changeset.
3. Ensure the full check suite passes locally.
4. Open the PR using the template; link any related issue.

By contributing you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
