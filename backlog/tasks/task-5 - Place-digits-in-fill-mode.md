---
id: TASK-5
title: Place digits in fill mode
status: To Do
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-24T21:42:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-3
  - TASK-4
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let the player place digits in the ◆SELECTED CELL. This task covers fill mode only, which is the only ◆ENTRY MODE until task-6 adds the others. Builds on task-3 (the ◆SELECTED CELL and arrow-key movement) and task-4 (pasting a ◆PUZZLE, so there are ◆GIVENs on the grid to play against).

Spec: keymap §1 (principles) and the fill-mode table in keymap §7. ◆CANDIDATEs (and hiding them under a ◆PLACED DIGIT) come in task-6. Nothing is checked in M0: no ◆CONFLICTs, ◆MISTAKEs, or ◆SOLVED (those are M1, feedback.md). Use the terms in CONTEXT.md exactly (◆PLACED DIGIT, ◆GIVEN, ◆SELECTED CELL, …).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pressing a digit key 1–9 on an empty ◆SELECTED CELL places that digit
- [ ] #2 Pressing the same digit on a cell holding that ◆PLACED DIGIT removes it (toggle)
- [ ] #3 Pressing a different digit on a cell holding a ◆PLACED DIGIT replaces it
- [ ] #4 Pressing a digit on a ◆GIVEN does nothing
- [ ] #5 Digit keys are identified by physical key, not by the character produced (e.g. Shift+1 still counts as 1)
- [ ] #6 Cmd+digit is never handled by the app, so the browser's tab switching on macOS keeps working
- [ ] #7 ◆PLACED DIGITs are visibly distinct from ◆GIVENs
- [ ] #8 Fill-mode rules live in src/core/ and are covered by unit tests; the keyboard wiring is covered by UI tests
<!-- AC:END -->
