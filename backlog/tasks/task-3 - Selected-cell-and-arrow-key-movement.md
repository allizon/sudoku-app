---
id: TASK-3
title: Selected cell and arrow-key movement
status: To Do
assignee: []
created_date: '2026-10-24 19:21'
updated_date: '2026-10-24 19:30'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Give the grid a Selected cell that the player moves with the arrow keys, or selects with a click. This is the first input behavior and the base for every later key: digits, modes, chords, and clearing all act on the Selected cell. Builds on task-1, which provides the app, src/core/, and an empty grid on screen.

The app is fully playable from the keyboard. The mouse is allowed but never required: clicking a cell makes it the Selected cell (keymap §1). Movement rules are in keymap §4. Reserved keys are in keymap §8: in M0 the only letters with a meaning are N, C, S, and X (added by later M0 tasks); I is reserved for M1's import field and does nothing yet.

Use the terms in CONTEXT.md exactly (Selected cell, Given, …).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exactly one cell is the Selected cell at all times, and it is clearly visible on the grid
- [ ] #2 When the app opens, row 1, column 1 is the Selected cell
- [ ] #3 Each arrow key moves the selection one cell in its direction
- [ ] #4 Movement wraps within the same row or column: right from column 9 goes to column 1 of the same row, down from row 9 goes to row 1 of the same column, and likewise for left and up
- [ ] #5 Clicking a cell makes it the Selected cell, including a cell holding a Given
- [ ] #6 After a click, the arrow keys and other keys keep working from the clicked cell without a further click
- [ ] #7 Letter keys never move the selection
- [ ] #8 Letter keys with no meaning in M0 (every letter except N, C, S, X), including I, do nothing
- [ ] #9 Movement logic lives in src/core/ and is covered by unit tests; the keyboard and click wiring is covered by UI tests
<!-- AC:END -->
