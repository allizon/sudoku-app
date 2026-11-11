---
id: TASK-23
title: Detect and show a solved puzzle
status: To Do
assignee: []
created_date: '2026-11-01T16:26:00Z'
labels:
  - feedback
milestone: m-1
dependencies:
  - TASK-18
  - TASK-20
references:
  - docs/spec/feedback.md
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: the app should notice the puzzle is done. When the grid becomes solved, say so on screen with a small celebratory flourish — a little pizzazz, short of confetti. The exact treatment is a design decision still to be made (Alix decides during the task's test-review step). A solved grid locks: digits and candidates cannot be changed, but selection, movement, and undo still work, and undoing out of solved unlocks the grid. This ticket unblocks the solved-state parts of TASK-12 (confirmed replacement). Reduced motion: any motion respects the player's reduced-motion setting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When the grid becomes solved, the app says so clearly on screen, with a small celebratory flourish; any motion respects the reduced-motion setting
- [ ] #2 Solved is evaluated after every change to the grid, including undo and redo
- [ ] #3 A solved grid is locked: digits and candidates cannot be changed
- [ ] #4 Selection and movement still work on a solved grid, so the player can look over the finished grid
- [ ] #5 Undo still works on a solved grid; undoing out of the solved state unlocks the grid
- [ ] #6 A solved grid never shows a mistake flag
- [ ] #7 Solved rules live in src/core/ with unit tests; the lock, the message, and the flourish are covered by UI tests
<!-- AC:END -->
