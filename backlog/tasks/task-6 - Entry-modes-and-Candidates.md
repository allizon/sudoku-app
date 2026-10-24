---
id: TASK-6
title: Entry modes and Candidates
status: To Do
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-24T20:21:00Z'
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
Add the center and corner entry modes so the player can mark Candidates, and the N key to cycle between modes. Builds on task-5, which provides fill mode and Placed digits.

Spec: keymap §2 (entry modes) and keymap §7 (interaction with Givens and placed digits, including hidden Candidates). Letter chords (C/S held) are task-7; clearing is task-8. Use the terms in CONTEXT.md exactly (Entry mode, Center mark, Corner mark, Candidate, Placed digit, …).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The app starts in fill mode
- [ ] #2 N cycles the sticky entry mode fill → center → corner → fill
- [ ] #3 The current entry mode is always visible as a small line of text under the grid, gray for fill, blue for center, green for corner, in both color schemes (keymap §2)
- [ ] #4 In center mode, a digit key toggles that digit as a Center mark in the Selected cell
- [ ] #5 In corner mode, a digit key toggles that digit as a Corner mark in the Selected cell
- [ ] #6 A cell can hold Center marks and Corner marks at the same time
- [ ] #7 Center marks and Corner marks are visibly distinct from each other, from Placed digits, and from Givens
- [ ] #8 In center or corner mode, a digit press on a Given or a Placed digit does nothing
- [ ] #9 Placing a digit in fill mode on a cell with Candidates hides them without deleting them
- [ ] #10 Removing that Placed digit (toggle) makes the hidden Candidates reappear unchanged
- [ ] #11 Replacing that Placed digit with another keeps the Candidates hidden
- [ ] #12 Mode and Candidate rules live in src/core/ and are covered by unit tests; the keyboard wiring and mode display are covered by UI tests
<!-- AC:END -->
