---
id: TASK-8
title: 'Clear cells with Delete, Backspace, and X'
status: To Do
assignee: []
created_date: '2026-10-24 19:22'
updated_date: '2026-10-24 19:31'
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
Let the player clear what they've entered in the Selected cell: one layer at a time with Delete/Backspace (chosen by the active entry mode), or everything at once with X. Builds on task-7, which provides letter chords; the active mode for clearing is the chord if one is held, otherwise the sticky entry mode.

Spec: keymap §5 (clearing). This is the last M0 keymap task; undo/redo is M1. Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Delete and Backspace behave identically
- [ ] #2 In fill mode, Delete removes the Placed digit and reveals any hidden Candidates unchanged; on a cell with no Placed digit it does nothing
- [ ] #3 In center mode, or with C held, Delete removes all Center marks in the cell and leaves its Corner marks
- [ ] #4 In corner mode, or with S held, Delete removes all Corner marks in the cell and leaves its Center marks
- [ ] #5 On a cell holding a Placed digit, Delete in center or corner mode (or with C or S held) does nothing, and the hidden Candidates are kept
- [ ] #6 X clears everything from the Selected cell — Placed digit, Center marks, and Corner marks, including hidden Candidates — in any entry mode
- [ ] #7 On a Given, neither Delete/Backspace nor X does anything
- [ ] #8 Clearing rules live in src/core/ and are covered by unit tests; the keyboard wiring is covered by UI tests
<!-- AC:END -->
