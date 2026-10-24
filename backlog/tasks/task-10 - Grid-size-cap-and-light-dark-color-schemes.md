---
id: TASK-10
title: Grid size cap and light/dark color schemes
status: To Do
assignee: []
created_date: '2026-10-24T20:20:00Z'
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
Implements docs/spec/display.md §1 (grid size) and §2 (color scheme). task-1 built the empty grid (src/ui/App.tsx, App.css) with cells capped at 58px and light colors only. This task raises the cap so the grid grows up to 1000px wide, and adds a dark color scheme with an in-app toggle, so every later color (the entry mode line in task-6, Candidates, M1 feedback colors) is chosen for both schemes. Two points are open in the spec and must be settled with Alix at the test step: which key toggles the scheme (not N, C, S, X, I), and whether the choice is remembered across reloads (saved state goes through the storage interface in src/core/; see AGENTS.md). Use CONTEXT.md terms exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The grid grows with the window up to 1000px wide
- [ ] #2 The whole grid fits in the window without scrolling, at small and large window sizes
- [ ] #3 The app starts in the light color scheme, whatever the system light/dark setting
- [ ] #4 A toggle switches between the light and dark color schemes, from the keyboard and with the mouse
- [ ] #5 Grid lines and box lines meet at least 3:1 contrast in both schemes
<!-- AC:END -->
