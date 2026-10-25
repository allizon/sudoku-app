---
id: TASK-3
title: Selected cell and arrow-key movement
status: Done
assignee: []
created_date: 2026-10-24 19:21
updated_date: '2026-10-25T22:17:00Z'
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
Give the grid a ◆SELECTED CELL that the player moves with the arrow keys, or selects with a click. This is the first input behavior and the base for every later key: digits, modes, chords, and clearing all act on the ◆SELECTED CELL. Builds on task-1, which provides the app, src/core/, and an empty grid on screen.

The app is fully playable from the keyboard. The mouse is allowed but never required: clicking a cell makes it the ◆SELECTED CELL (keymap §1). Movement rules are in keymap §4. Reserved keys are in keymap §8: in M0 the only letters with a meaning are N, C, S, and X (added by later M0 tasks); I is reserved for M1's import field and does nothing yet.

Use the terms in CONTEXT.md exactly (◆SELECTED CELL, ◆GIVEN, …).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Exactly one cell is the ◆SELECTED CELL at all times, and it is clearly visible on the grid
- [x] #2 When the app opens, row 1, column 1 is the ◆SELECTED CELL
- [x] #3 Each arrow key moves the selection one cell in its direction
- [x] #4 Movement wraps within the same row or column: right from column 9 goes to column 1 of the same row, down from row 9 goes to row 1 of the same column, and likewise for left and up
- [x] #5 Clicking a cell makes it the ◆SELECTED CELL, including a cell holding a ◆GIVEN
- [x] #6 After a click, the arrow keys and other keys keep working from the clicked cell without a further click
- [x] #7 Letter keys never move the selection
- [x] #8 Letter keys with no meaning in M0 (every letter except N, C, S, X), including I, do nothing
- [x] #9 Movement logic lives in src/core/ and is covered by unit tests; the keyboard and click wiring is covered by UI tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review record — round 1 (code-reviewer + ux-reviewer), branch task-3/selected-cell-movement

1. MAJOR — App.tsx handlePaste: accepted import did not reset the SELECTED CELL to row 1, column 1 (import.md §5, keymap §4); the existing paste test was vacuous. Fixed: setSelected({row:0,column:0}) on accepted import; new tests move the selection first, and a refused/unparseable paste leaves it alone (b09e3bc, aa42455).
2. MAJOR — App.tsx: DOM focus stays on the grid with no aria-activedescendant, so screen readers never announce the SELECTED CELL. Fixed: cells have ids cell-<row>-<column>, grid sets aria-activedescendant; aria-selected kept (aa42455).
3. MINOR — Shift/Alt/Ctrl/Cmd+Arrow moved the selection and swallowed browser shortcuts; keymap §9 defers Shift+arrow. Fixed: modified arrows do nothing and are not preventDefault'ed (aa42455).
4. MINOR — box-shadow vanishes in forced-colors mode. Fixed: transparent outline on the selected cell (aa42455).
5. MINOR — no user-select:none on cells. Fixed (aa42455).
6. MINOR — CSS comment typo. Fixed (aa42455).
7. MINOR — visibility test passes for a 0px shadow. Fixed in the new test file (nonzero inset spread assertion); approved test left as written.
8. MINOR — fixed 6px ring+halo is large on small cells. Declined: not blocking; revisit when marks are drawn.
9. MINOR — halo ~1.7:1 on white; ring merges with thick box border on edge cells. Declined: halo is decoration, ring alone carries 3:1+; no cheap improvement.
10. NOTE — aria-selected on every cell / "does nothing" test only guards the future. Declined: informational.
11. NOTE — no dark scheme block; "no cell background" rule will clash with future conflict/Mistake tints. Declined: out of scope, flagged for Alix.

No open major findings after round 1; no spec contradictions found. Suite 306/306, typecheck clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the SELECTED CELL: pure moveSelection in src/core/selection.ts (wraps within row/column), App.tsx selection state starting at row 1, column 1, arrow-key handling, click-to-select with the grid keeping focus, aria-selected + aria-activedescendant, and a token-based inset ring in App.css. Letters (including I) do nothing; modified arrows are ignored. A pasted PUZZLE resets the selection to row 1, column 1. Verified: full suite 306/306 (core unit tests + jsdom UI tests), typecheck clean, one review round with no open majors (record in notes). Caveats: the ring's visibility is verified only by CSS-text tests and hex-contrast estimates, not in a real browser; no dark-scheme tokens yet; ring size is fixed (revisit when marks are drawn); the no-cell-background rule will clash with future conflict/Mistake tints.
<!-- SECTION:FINAL_SUMMARY:END -->
