---
id: TASK-7
title: Letter chords for Candidates
status: To Do
assignee: []
created_date: '2026-10-24 19:22'
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
Let the player hold C or S to mark Candidates without changing the sticky entry mode. Builds on task-6, which provides center and corner modes and Candidate toggling.

Spec: keymap §3 (letter chords), all six rules. A chord behaves like its mode for each digit press, including keymap §7 (a digit press does nothing on a Given or a Placed digit). Clearing while a chord is held is task-8. Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 While C is held, each digit press toggles that digit as a Center mark in the Selected cell
- [ ] #2 While S is held, each digit press toggles that digit as a Corner mark in the Selected cell
- [ ] #3 Several digits can be pressed during one chord (hold C, press 1, 4, 7 → three Center marks toggled)
- [ ] #4 Pressing and releasing C or S with no digit does nothing
- [ ] #5 Key auto-repeat from a held C or S is ignored
- [ ] #6 When the window loses focus, any held chord is released
- [ ] #7 A chord overrides the sticky entry mode only for its digit presses; the sticky mode is unchanged afterwards and the on-screen mode indicator still shows it
- [ ] #8 While C and S are both held, digit presses do nothing
- [ ] #9 During a chord, a digit press on a Given or a Placed digit does nothing
- [ ] #10 Chord rules live in src/core/ where they are independent of the DOM and are covered by unit tests; key and focus handling are covered by UI tests
<!-- AC:END -->
