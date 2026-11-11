---
id: TASK-24
title: Autosave the puzzle in progress
status: To Do
assignee: []
created_date: '2026-11-01T16:26:00Z'
labels:
  - autosave
milestone: m-1
dependencies:
  - TASK-16
  - TASK-23
references:
  - docs/spec/milestones.md
  - AGENTS.md
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: a refresh should not throw away the player's work. The puzzle in progress, its undo history, and its solved state survive a page refresh, read and written through the single storage interface (Store, AGENTS.md 'Stack and architecture'). Browser storage is one implementation of Store, so a synced store could replace it later by swapping one module. Nothing outside Store reads or writes saved state — the sole exception is the color-scheme script in index.html, which already exists and must keep its key and format in sync with the browser store. Undo history arrives with TASK-16 and the solved state with TASK-23, which is why this ticket depends on them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The puzzle in progress survives a page refresh: givens, placed digits, candidates, and selection are restored
- [ ] #2 The undo/redo history survives a page refresh: undo after a refresh still works across saved steps
- [ ] #3 The solved state survives a page refresh: a solved puzzle is still shown solved, on screen and still locked
- [ ] #4 With nothing saved, a refresh opens an empty grid ready for a paste, as in M0
- [ ] #5 All saved state is read and written through the Store interface; no code outside Store and the index.html color-scheme script reads or writes browser storage
- [ ] #6 Store unit tests cover save and reload of the full saved state
<!-- AC:END -->
