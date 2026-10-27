---
id: TASK-6
title: Entry modes and Candidates
status: Done
assignee:
  - '@claude'
created_date: 2026-10-24 19:22
updated_date: '2026-10-27T02:38:00Z'
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
- [x] #1 The app starts in fill mode
- [x] #2 N cycles the ◆STICKY MODE fill → center → corner → fill
- [x] #3 The current ◆ENTRY MODE is always visible as a small line of text under the grid, gray for fill, blue for center, green for corner, in both color schemes (keymap §2)
- [x] #4 In center mode, a digit key toggles that digit as a ◆CENTER MARK in the ◆SELECTED CELL
- [x] #5 In corner mode, a digit key toggles that digit as a ◆CORNER MARK in the ◆SELECTED CELL
- [x] #6 A cell can hold ◆CENTER MARKs and ◆CORNER MARKs at the same time
- [x] #7 ◆CENTER MARKs and ◆CORNER MARKs are visibly distinct from each other, from ◆PLACED DIGITs, and from ◆GIVENs
- [x] #8 In center or corner mode, a digit press on a ◆GIVEN or a ◆PLACED DIGIT does nothing
- [x] #9 Placing a digit in fill mode on a cell with ◆CANDIDATEs hides them without deleting them
- [x] #10 Removing that ◆PLACED DIGIT (toggle) makes the hidden ◆CANDIDATEs reappear unchanged
- [x] #11 Replacing that ◆PLACED DIGIT with another keeps the ◆CANDIDATEs hidden
- [x] #12 Mode and ◆CANDIDATE rules live in src/core/ and are covered by unit tests; the keyboard wiring and mode display are covered by UI tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review round 1 (code-reviewer + ux-reviewer), fixes in 145c011:
- CR-1 major, grid-size test ignored the Entry mode line (src/ui/test-support/app-css.ts gridLayout): Fixed, belowGrid counts line + hint; new tests assert it fits --below-grid, empty and loaded; shown to fail.
- CR-2 major, "Center vs Corner marks differ" test compared unresolved var() strings, could not fail; position untested: Fixed, new src/ui/candidates-layout.test.ts checks corner positioning and resolved font sizes; shown to fail. Original test left in place.
- CR-3 minor, empty-Candidates cells possible: Fixed, withCandidates/placedOver constructors in puzzle.ts, used by fill.ts and candidates.ts; tests in puzzle-cells.test.ts.
- CR-5/UX-1 minor, Corner marks overlap Selected cell ring under ~75px cells (~4:1 contrast): Fixed, inset max(0.08 x cell, 7px); test ties it to the ring's spread.
- UX-3 minor, accepted paste kept center/corner mode (import.md §5 says fill): Fixed, reset to INITIAL_ENTRY_MODE; tests in entry-mode-review.test.tsx.
- CR-6 minor, CSS comment didn't mention toasts covering the Entry mode line: Fixed (comment only; milestones.md M0 allows it).
- UX-4 minor, Entry mode line not in grid's aria-describedby: Declined, would break approved assertions in paste-import.test.tsx:486/490; escalated to Alix.
- Escalated to Alix, no action: CR-4 stray mark before a puzzle blocks paste with misleading text; CR-7 keep unrequested aria-live (chord double-announce is a task-7 question); CR-8 hidden Candidates not announced; UX-2 Center marks may crowd edge Corner marks (needs browser); both mark tokens same gray; N by physical key.

Review round 2 (code-reviewer), fixes in 04551b0. Round 1 fixes all verified; UX-4 decline judged sound; no majors open.
- R2-1 minor, grid-size model change loosened approved "as large as the window allows" test by 24px: Fixed, ROOM_BELOW_GRID_ALLOWANCE 48 -> 24 (restores the 84px limit; stricter); shown to fail at --below-grid 6.5rem.
- R2-2 minor, two new round-1 grid-size tests could never fail on their own: Fixed, removed (they were implementer additions, not approved tests).
- R2-3 minor, 7px inset floor made Corner marks 1 and 9 (and 1 and 7) overlap on cells under ~42-44px: Fixed, --corner-marks-inset size token, Corner marks font capped to fit three rows, mark 9 shifted; new no-overlap tests over 7 window sizes, each half of the fix shown necessary. Model assumes 0.6em digit width; needs a real-browser look.
- R2-4 minor, round 1 commit subject omitted import.md §5: Fixed in tidy (reworded to 2919ee5).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added center and corner Entry modes, N to cycle the Sticky mode, the Entry mode line under the grid (gray/blue/green, both schemes, announced politely), Center and Corner marks, and Candidates hidden under a Placed digit (reappear on removal, stay hidden on replacement). Rules in src/core/ (entry-mode.ts, candidates.ts, normalizing cell constructors in puzzle.ts); an accepted import resets to fill mode. 844 tests pass, typecheck clean; two review rounds, no open majors; one decline (Entry mode line in the grid's aria-describedby, conflicts with approved paste tests). Decisions recorded in keymap §2 and display §2-§3. Follow-ups for Alix: whether all letter keys go by physical key; a stray mark before any puzzle blocks paste with misleading text; hidden Candidates not announced; real-browser check of mark layout on small cells (Corner marks ~4.6px at 30px cells).
<!-- SECTION:FINAL_SUMMARY:END -->
