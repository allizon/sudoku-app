---
id: TASK-6
title: Entry modes and Candidates
status: To Do
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-24T21:43:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-5
  - TASK-10
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
  - docs/spec/display.md
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add the center and corner ◆ENTRY MODEs so the player can mark ◆CANDIDATEs, and the N key to cycle between modes. Builds on task-5, which provides fill mode and ◆PLACED DIGITs.

Spec: keymap §2 (◆ENTRY MODEs) and keymap §7 (interaction with ◆GIVENs and ◆PLACED DIGITs, including hidden ◆CANDIDATEs). Letter chords (C/S held) are task-7; clearing is task-8. Use the terms in CONTEXT.md exactly (◆ENTRY MODE, ◆CENTER MARK, ◆CORNER MARK, ◆CANDIDATE, ◆PLACED DIGIT, …).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The app starts in fill mode
- [ ] #2 N cycles the ◆STICKY MODE fill → center → corner → fill
- [ ] #3 The current ◆ENTRY MODE is always visible as a small line of text under the grid, gray for fill, blue for center, green for corner, in both color schemes (keymap §2)
- [ ] #4 In center mode, a digit key toggles that digit as a ◆CENTER MARK in the ◆SELECTED CELL
- [ ] #5 In corner mode, a digit key toggles that digit as a ◆CORNER MARK in the ◆SELECTED CELL
- [ ] #6 A cell can hold ◆CENTER MARKs and ◆CORNER MARKs at the same time
- [ ] #7 ◆CENTER MARKs and ◆CORNER MARKs are visibly distinct from each other, from ◆PLACED DIGITs, and from ◆GIVENs
- [ ] #8 In center or corner mode, a digit press on a ◆GIVEN or a ◆PLACED DIGIT does nothing
- [ ] #9 Placing a digit in fill mode on a cell with ◆CANDIDATEs hides them without deleting them
- [ ] #10 Removing that ◆PLACED DIGIT (toggle) makes the hidden ◆CANDIDATEs reappear unchanged
- [ ] #11 Replacing that ◆PLACED DIGIT with another keeps the ◆CANDIDATEs hidden
- [ ] #12 Mode and ◆CANDIDATE rules live in src/core/ and are covered by unit tests; the keyboard wiring and mode display are covered by UI tests
<!-- AC:END -->
