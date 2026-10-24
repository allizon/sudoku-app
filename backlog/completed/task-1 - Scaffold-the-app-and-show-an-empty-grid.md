---
id: TASK-1
title: Scaffold the app and show an empty grid
status: Done
assignee:
  - '@claude'
created_date: 2026-10-24 19:21
updated_date: '2026-10-24T20:15:00Z'
labels:
  - afk
milestone: m-0
dependencies: []
documentation:
  - AGENTS.md
  - CONTEXT.md
  - docs/spec/milestones.md
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
First slice of M0 (Walking skeleton). The repo has no code yet. Set up the stack and the core/UI boundary, and put an empty sudoku grid on screen so every later M0 task has somewhere to land.

Stack (decided, see AGENTS.md "Stack and architecture"): TypeScript, React, Vite, Vitest, test-driven. Node version is pinned in .nvmrc. Puzzle logic lives in src/core/ as plain TypeScript that imports only from src/core/ and the standard library — no React, no DOM — because a future Angular UI will reuse it unchanged. This task creates src/core/ and the test that enforces that boundary.

Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The project installs, builds, and runs its tests with standard npm scripts (dev, build, test)
- [x] #2 src/core/ exists and holds the puzzle's representation: a 9×9 grid of cells
- [x] #3 A test fails if any file in src/core/ imports from outside src/core/ (other than the standard library), including React or DOM APIs
- [x] #4 The boundary test is shown to catch a violation (e.g. a deliberately bad import makes it fail) and passes on the real code
- [x] #5 Opening the app shows an empty 9×9 grid with the nine 3×3 boxes visibly distinguished
- [x] #6 README.md no longer says "No code yet" and states how to install, run, and test
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch task-1/scaffold-empty-grid
2. Main session set up toolchain only (npm scripts, Vite, Vitest, strict TS)
3. test-writer: failing tests for empty Puzzle in src/core/, core boundary checker, empty grid render; Alix approved; committed red
4. implementer: src/core/puzzle.ts, src/tooling/core-boundary.ts, src/ui/App.tsx + CSS, entry files, README
5. Two review rounds (code + UX); added tsconfig.core.json type-check of src/core/ without DOM/Node types, core tests in node environment
6. Hand off; Alix approved merge
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tests approved by Alix (2026-10-24). Decisions: Node built-ins and type-only imports are core-boundary violations; DOM globals (document, window, navigator, localStorage, sessionStorage) are flagged in src/core/; storage interface will live in src/core/, browser implementation outside it (e.g. src/storage/); boundary checker lives in src/tooling/.

## Review round 1
Code review:
- MAJOR backtick import()/require() literals undetected (core-boundary.ts) — Fixed: specifier regex accepts no-${} template literals; tests added.
- MAJOR triple-slash reference directives blanked as comments — Fixed: types= always flagged, lib= flagged unless es*, path= flagged if outside src/core; tests added.
- MAJOR DOM/Node globals via globalThis/self, fetch, indexedDB, process, HTMLElement undetected — Fixed: checker flags globalThis./self./window. + listed names (list extended with indexedDB, fetch, XMLHttpRequest, process); new tsconfig.core.json type-checks src/core with lib ES2023 and no types, wired into typecheck/build, with core-typecheck.test.ts probes.
- minor box lines not drawn from data-box — Declined: CSS can't draw box edges from box id alone; visual check is UX review's job.
- minor boxOf in UI — Fixed: boxOf/BOX_SIZE moved to src/core/puzzle.ts with tests.
- minor core tests ran in jsdom — Fixed: Vitest projects, core runs in node.
- minor real-files scan only .ts/.tsx — Fixed via new core-boundary-gaps.test.ts (approved test untouched).
- minor false positives for '.', '..', '../core' resolving to src/core — Fixed; window/document as object keys/params — Declined: needs a real parser, harmless, type-check is the exact check.
- minor regex literal with backtick hides globals — Declined: regex detection by text is unreliable; core type-check backs it up; limit documented.
- minor weak fresh-Puzzle test — Declined: approved test; added a deeper new test.
- Spec question (commit scope/section for setup work) — Alix: keep (setup) / (§M0).
UX review:
- minor thin lines 2.2:1 contrast — Fixed: #8a8a8a (~3.4:1).
- minor no box info for assistive tech — Declined: TASK-3 scope (cell labels incl. box).
- minor no focus model — Declined: TASK-3 scope (container focus + aria-activedescendant).
- minor unequal cell content near box lines — Fixed: explicit equal cell size, borders outside.
- minor page scrolls under ~610px tall — Fixed: cell size from dvh/vw; verified no scroll at 800x420.
- minor no h1 — Fixed: visually hidden h1.
Spec questions raised (open): grid size cap, dark mode, where entry mode indicator goes.

## Review round 2
Code review (verifying round 1 fixes):
- MAJOR types= reference not first attribute (e.g. resolution-mode then types="node") passed scanner and core type-check — Fixed: attributes matched anywhere in the <reference> tag; reference with no known attribute is flagged; tests added.
- MAJOR (raised from minor) globalThis/self reached via cast, alias, brackets, ?. — Fixed: any use of globalThis or self as an identifier in src/core is flagged; property access like options.self allowed; tests added.
- minor absolute path= treated as inside core — Fixed: leading / is outside; test added.
- minor type-check probes ran in OS temp dir — Fixed: probes under node_modules/.cache/core-typecheck so type resolution matches real core files; test records that tsc alone accepts a types="node" reference, which is why the scanner also runs. Windows tsc.cmd — Declined: project runs on macOS and Vercel Linux.
- minor non-.ts real-file scan has nothing to check today — Declined: guards future .js/.mjs/etc. files at no cost.
Verified by main session: probes for both majors now flagged; 104/104 tests; build green. No open majors.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scaffolded the app (React 19, Vite, Vitest, strict TS; npm scripts dev/build/test/typecheck). src/core/puzzle.ts holds the Puzzle as a 9x9 grid of cells plus boxOf. The core boundary is enforced two ways: a source scanner (src/tooling/core-boundary.ts) for outside imports, triple-slash references, DOM/Node globals and globalThis/self; and tsconfig.core.json type-checking src/core/ with ES2023 only, run in typecheck/build. The app shows an empty 9x9 grid with thick 3x3 box lines, equal cells, no scrolling down to 420px tall. README has install/run/test steps. Verified: npm ci, 104/104 tests, build green, grid checked in a browser at desktop and phone widths. Follow-ups: TASK-3 should add cell labels incl. box and container focus with aria-activedescendant; open spec questions on grid size cap, dark mode, entry-mode indicator placement.
<!-- SECTION:FINAL_SUMMARY:END -->
