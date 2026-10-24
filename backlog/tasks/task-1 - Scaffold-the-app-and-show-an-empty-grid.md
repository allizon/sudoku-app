---
id: TASK-1
title: Scaffold the app and show an empty grid
status: To Do
assignee: []
created_date: '2026-10-24 19:21'
updated_date: '2026-10-24 19:26'
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
- [ ] #1 The project installs, builds, and runs its tests with standard npm scripts (dev, build, test)
- [ ] #2 src/core/ exists and holds the puzzle's representation: a 9×9 grid of cells
- [ ] #3 A test fails if any file in src/core/ imports from outside src/core/ (other than the standard library), including React or DOM APIs
- [ ] #4 The boundary test is shown to catch a violation (e.g. a deliberately bad import makes it fail) and passes on the real code
- [ ] #5 Opening the app shows an empty 9×9 grid with the nine 3×3 boxes visibly distinguished
- [ ] #6 README.md no longer says "No code yet" and states how to install, run, and test
<!-- AC:END -->
