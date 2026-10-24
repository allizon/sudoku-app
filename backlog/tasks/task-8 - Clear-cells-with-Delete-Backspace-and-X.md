---
id: TASK-8
title: Clear cells with Delete, Backspace, and X
status: To Do
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-24T21:43:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-7
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let the player clear what they've entered in the ◆SELECTED CELL: one layer at a time with Delete/Backspace (chosen by the active ◆ENTRY MODE), or everything at once with X. Builds on task-7, which provides letter chords; the active mode for clearing is the chord if one is held, otherwise the ◆STICKY MODE.

Spec: keymap §5 (clearing). This is the last M0 keymap task; undo/redo is M1. Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Delete and Backspace behave identically
- [ ] #2 In fill mode, Delete removes the ◆PLACED DIGIT and reveals any hidden ◆CANDIDATEs unchanged; on a cell with no ◆PLACED DIGIT it does nothing
- [ ] #3 In center mode, or with C held, Delete removes all ◆CENTER MARKs in the cell and leaves its ◆CORNER MARKs
- [ ] #4 In corner mode, or with S held, Delete removes all ◆CORNER MARKs in the cell and leaves its ◆CENTER MARKs
- [ ] #5 On a cell holding a ◆PLACED DIGIT, Delete in center or corner mode (or with C or S held) does nothing, and the hidden ◆CANDIDATEs are kept
- [ ] #6 X clears everything from the ◆SELECTED CELL — ◆PLACED DIGIT, ◆CENTER MARKs, and ◆CORNER MARKs, including hidden ◆CANDIDATEs — in any ◆ENTRY MODE
- [ ] #7 On a ◆GIVEN, neither Delete/Backspace nor X does anything
- [ ] #8 Clearing rules live in src/core/ and are covered by unit tests; the keyboard wiring is covered by UI tests
<!-- AC:END -->
