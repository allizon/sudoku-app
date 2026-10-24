---
id: TASK-10
title: Grid size cap and light/dark color schemes
status: To Do
assignee: []
created_date: '2026-10-24T20:20:00Z'
updated_date: '2026-10-24T20:23:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/spec/display.md
  - AGENTS.md
  - CONTEXT.md
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implements docs/spec/display.md §1 (grid size) and §2 (color scheme). task-1 built the empty grid (src/ui/App.tsx, App.css) with cells capped at 58px and light colors only. This task raises the cap so the grid grows up to 1000px wide, and adds a dark color scheme with a mouse-only toggle (no key; display.md §2 makes it an exception to keymap §1), so every later color (the entry mode line in task-6, Candidates, M1 feedback colors) is chosen for both schemes. The chosen scheme is remembered across reloads through the single storage interface in src/core/ (AGENTS.md "Stack and architecture"); this is the first saved state, so this task likely introduces that interface, whose shape is not yet specified: propose it to Alix at the test step. The interface lives in src/core/; the browser-storage implementation lives outside core (e.g. src/storage/). Use CONTEXT.md terms exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The grid grows with the window up to 1000px wide
- [ ] #2 The whole grid fits in the window without scrolling, at small and large window sizes
- [ ] #3 The app starts in the light color scheme, whatever the system light/dark setting
- [ ] #4 A mouse-only toggle switches between the light and dark color schemes; no key is mapped to it
- [ ] #5 The chosen color scheme is remembered across reloads, saved through the storage interface in src/core/
- [ ] #6 Grid lines and box lines meet at least 3:1 contrast in both schemes
<!-- AC:END -->
