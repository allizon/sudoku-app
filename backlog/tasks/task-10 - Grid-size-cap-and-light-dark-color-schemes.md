---
id: TASK-10
title: Grid size cap and light/dark color schemes
status: To Do
assignee: []
created_date: '2026-10-24T20:20:00Z'
updated_date: '2026-10-24T21:42:00Z'
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
Implements docs/spec/display.md §1 (grid size) and §2 (color scheme). task-1 built the empty grid (src/ui/App.tsx, App.css) with cells capped at 58px and light colors only. This task raises the cap so the grid grows up to 1000px wide, and adds a dark color scheme with a mouse-only toggle (no key; display.md §2 makes it an exception to keymap §1), so every later color (the ◆ENTRY MODE LINE in task-6, ◆CANDIDATEs, M1 feedback colors) is chosen for both schemes. The chosen scheme is remembered across reloads through the single storage interface in src/core/ (AGENTS.md "Stack and architecture"); this is the first saved state, so this task likely introduces that interface, whose shape is not yet specified: propose it to Alix at the test step. The interface lives in src/core/; the browser-storage implementation lives outside core (e.g. src/storage/). Use CONTEXT.md terms exactly.

Preparation for skins (later; display.md §3): every color on the site is configurable through CSS tokens (custom properties), so that a future skin can change the app's appearance by supplying its own token values. The light and dark schemes are each a set of token values. Skins themselves are not built here: no skin picker, no skin loading. App.css currently has color literals (e.g. #222, #fafafa, #fff, #8a8a8a) that move into tokens. Later tasks take their colors from tokens too.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The grid grows with the window up to 1000px wide
- [ ] #2 The whole grid fits in the window without scrolling, at small and large window sizes
- [ ] #3 The app starts in the light color scheme, whatever the system light/dark setting
- [ ] #4 A mouse-only toggle switches between the light and dark color schemes; no key is mapped to it
- [ ] #5 The chosen color scheme is remembered across reloads, saved through the storage interface in src/core/
- [ ] #6 Grid lines and box lines meet at least 3:1 contrast in both schemes
- [ ] #7 Every color the app draws comes from a CSS token (custom property); App.css has no color literals outside the token definitions
- [ ] #8 The light and dark color schemes are each defined purely as token values, so a set of token values is all a future skin needs to supply
<!-- AC:END -->
