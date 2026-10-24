---
id: TASK-7
title: Letter chords for Candidates
status: To Do
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-24T21:42:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-6
documentation:
  - docs/spec/keymap.md
  - CONTEXT.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let the player hold C or S to mark ◆CANDIDATEs without changing the ◆STICKY MODE. Builds on task-6, which provides center and corner modes and ◆CANDIDATE toggling.

Spec: keymap §3 (letter chords), all six rules, and keymap §2 (the ◆ENTRY MODE LINE follows the chord while its letter is held). A chord behaves like its mode for each digit press, including keymap §7 (a digit press does nothing on a ◆GIVEN or a ◆PLACED DIGIT). Clearing while a chord is held is task-8. Use the terms in CONTEXT.md exactly.

Known gap, deliberately left open: what the ◆ENTRY MODE LINE shows while C and S are both held (keymap §3 rule 6) is unspecified. Alix considers that case user error and not worth pursuing now; do not add behavior or tests for it, and do not list it as a spec gap in the handoff.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 While C is held, each digit press toggles that digit as a ◆CENTER MARK in the ◆SELECTED CELL
- [ ] #2 While S is held, each digit press toggles that digit as a ◆CORNER MARK in the ◆SELECTED CELL
- [ ] #3 Several digits can be pressed during one chord (hold C, press 1, 4, 7 → three ◆CENTER MARKs toggled)
- [ ] #4 Pressing and releasing C or S with no digit does nothing
- [ ] #5 Key auto-repeat from a held C or S is ignored
- [ ] #6 When the window loses focus, any held chord is released
- [ ] #7 A chord overrides the ◆STICKY MODE only for its digit presses; the ◆STICKY MODE is unchanged afterwards
- [ ] #8 While C and S are both held, digit presses do nothing
- [ ] #9 During a chord, a digit press on a ◆GIVEN or a ◆PLACED DIGIT does nothing
- [ ] #10 The ◆ENTRY MODE LINE updates instantly whenever the ◆ENTRY MODE changes: while C or S is held it shows the chord's mode, and when the key is released it reverts to the ◆STICKY MODE
- [ ] #11 Chord rules live in src/core/ where they are independent of the DOM and are covered by unit tests; key and focus handling, and the ◆ENTRY MODE LINE updates, are covered by UI tests
<!-- AC:END -->
