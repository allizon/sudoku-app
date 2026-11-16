---
id: TASK-15
title: Digit keys do nothing until a Puzzle is loaded
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T02:08:00Z'
updated_date: '2026-11-16T03:44:00Z'
labels:
  - keymap
milestone: m-0
dependencies: []
references:
  - src/ui/App.tsx
documentation:
  - docs/spec/keymap.md
  - docs/spec/import.md
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before any ◆PUZZLE is loaded, a stray digit press puts a ◆PLACED DIGIT or a ◆CANDIDATE on the empty grid. The grid then no longer counts as empty, so the next paste is refused with "A puzzle is already loaded — reload the page to start a new one", which isn't true, and the "Paste a puzzle to start" hint disappears. The only way out is a reload. Found in task-6 review (finding CR-4); Candidates made it more likely, since nothing visibly looks loaded.

Alix (2026-10-27): "ignore any marks before the puzzle loads", then chose: until a ◆PUZZLE is loaded, digit keys do nothing in every ◆ENTRY MODE, placed digits included. Write this into the spec (keymap §7 or §2) on the task branch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Before a ◆PUZZLE is loaded, a digit key does nothing in fill, center, or corner mode: no ◆PLACED DIGIT or ◆CANDIDATE appears and the hint stays
- [x] #2 After an accepted paste, digit keys work as before in every ◆ENTRY MODE
- [x] #3 N, arrow keys, and clicking still work before a ◆PUZZLE is loaded
- [x] #4 A paste onto the never-loaded grid is accepted even after digit keys were pressed
- [x] #5 The rule is recorded in docs/spec/keymap.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review round 1 (in-session, code-reviewer + ux-reviewer passes; this harness has no subagent dispatch):
- [major, Fixed] The first seed fixture (one Given at row 3, column 6) would be rejected by TASK-18's import validation (a puzzle with no solution), re-breaking the ~140 tests that load it. Replaced with a valid, uniquely solvable seed: puzzle-1 with the Givens blanked at the 8 cells these tests touch (verified: 33 Givens, exactly 1 solution).
- [minor, Fixed] The three 'no other cell changes' scans counted non-empty cells, which breaks once the loaded Puzzle has Givens; rewritten as before/after diffs of the whole grid.
- [minor, Declined] pre-load-digit-keys.test.tsx inlines the mouse-click sequence instead of a shared click() helper. Declined: each test file in this suite keeps its own helpers by convention.
- [ux, no findings] Player-facing behavior is exactly the ticket's decision: digit keys are silent no-ops before a Puzzle loads, the hint and mode line behave as before, paste still works.
Note: reviews were performed in-session rather than by dispatched subagents (this harness has no subagent mechanism).

Verification: full suite 1206/1206 green on the branch and again on main after the ff-merge; typecheck clean; the red commit verified failing on its own (6 failures). Merged to main with --ff-only and pushed (deploys).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Digit keys now do nothing until a Puzzle is loaded, in every Entry mode (keymap §2): App.tsx gates the digit branch on the empty grid. ~142 existing tests across fill-mode, entry-mode, letter-chords (and review files) load a seed puzzle first via renderApp; the seed fixture (puzzle-seed.txt) is puzzle-1 with Givens blanked at the cells those tests touch, verified uniquely solvable (33 Givens, 1 solution) so future import validation (TASK-18) will accept it. Spec rule recorded in keymap.md §2 as a docs commit. Risks/follow-ups: an imported all-empty 81-char string re-arms the no-op state (spec gap 1, flagged to Alix); tests touching new cells may need the seed re-blanked.
<!-- SECTION:FINAL_SUMMARY:END -->
