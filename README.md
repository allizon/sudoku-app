# Sudoku App

A personal, keyboard-first web app for solving sudoku puzzles. Personal use only — not for sale or distribution.

Built as practice in spec-driven, agent-assisted development: specs and work breakdown are written first, and AI agents do most of the implementation.

## Where things are

- [`CONTEXT.md`](./CONTEXT.md) — glossary; the canonical terms for specs, tests, and code
- [`docs/spec/`](./docs/spec/) — the spec, one file per feature area
- [`LEARNING-LOG.md`](./LEARNING-LOG.md) — running log of decisions and what was learned along the way

## Getting started

The Node version is pinned in [`.nvmrc`](./.nvmrc).

```sh
nvm use          # switch to the pinned Node version
npm install      # install dependencies
```

- **Run:** `npm run dev`, then open the local URL Vite prints.
- **Test:** `npm test` (or `npm run test:watch` to rerun on changes).
- **Type-check:** `npm run typecheck`.
- **Build:** `npm run build` type-checks, then writes the production build to `dist/`.
