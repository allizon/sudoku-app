---
id: TASK-11
title: Grid flashes on focus instead of showing a focus ring
status: To Do
assignee: []
created_date: '2026-10-25T03:14:00Z'
labels:
  - bug
milestone: m-0
dependencies:
  - TASK-4
documentation:
  - docs/spec/import.md
  - docs/spec/display.md
  - CONTEXT.md
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-4 gave the grid keyboard focus on load (so a paste works straight away) and drew a 3px blue focus ring around it whenever it has focus. Because focus is kept on the grid almost all the time, the ring is effectively always on: it frames the ◆PUZZLE permanently, says nothing the player needs to know, and will compete with the ◆SELECTED CELL highlight coming in TASK-3. Alix wants no ring. Instead, the grid background should flash lightly at the moment it receives focus, as a brief confirmation that keys and pastes will land there, then return to normal.

Spec: import.md §2 (the grid has focus when the app opens), display.md §2 (every color is a CSS token). Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No focus ring or outline is drawn around the grid while it has focus, whether focus arrived by page load, Tab, or a click
- [ ] #2 When the grid receives focus (on load, by Tab, by a click, or when the window regains focus), its background flashes lightly and then returns to its normal color
- [ ] #3 The flash is brief and subtle: it does not hide or obscure ◆GIVENs or any other cell content
- [ ] #4 The grid keeps focus as before: no change to which element has focus, or to paste and Escape behavior
- [ ] #5 The flash color comes from a CSS token (display.md §2)
- [ ] #6 The flash is covered by UI tests to the extent jsdom allows (e.g. a class or state applied on focus and removed after), and the absence of the ring by a CSS check
- [ ] #7 The spec records the focus feedback (display.md or import.md §2)
<!-- AC:END -->
