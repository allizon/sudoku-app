---
id: TASK-8
title: Clear cells with Delete, Backspace, and X
status: Done
assignee:
  - '@claude'
created_date: 2026-10-24 19:22
updated_date: '2026-10-29T02:36:00Z'
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
- [x] #1 Delete and Backspace behave identically
- [x] #2 In fill mode, Delete removes the ◆PLACED DIGIT and reveals any hidden ◆CANDIDATEs unchanged; on a cell with no ◆PLACED DIGIT it does nothing
- [x] #3 In center mode, or with C held, Delete removes all ◆CENTER MARKs in the cell and leaves its ◆CORNER MARKs
- [x] #4 In corner mode, or with S held, Delete removes all ◆CORNER MARKs in the cell and leaves its ◆CENTER MARKs
- [x] #5 On a cell holding a ◆PLACED DIGIT, Delete in center or corner mode (or with C or S held) does nothing, and the hidden ◆CANDIDATEs are kept
- [x] #6 X clears everything from the ◆SELECTED CELL — ◆PLACED DIGIT, ◆CENTER MARKs, and ◆CORNER MARKs, including hidden ◆CANDIDATEs — in any ◆ENTRY MODE
- [x] #7 On a ◆GIVEN, neither Delete/Backspace nor X does anything
- [x] #8 Clearing rules live in src/core/ and are covered by unit tests; the keyboard wiring is covered by UI tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review round 1 (code-reviewer + ux-reviewer, 2026-10-28). No majors. Code-reviewer mutation-tested 7 ways; tests caught 6.
- minor (code): §5 rule 7 auto-repeat untested; adding '|| event.repeat' to the clearing guard left all tests green. Fixed: 3 repeat tests (81bff85), shown to fail with the bug injected.
- minor (code): describe labels still said 'spec gap, Qn'. Fixed: renamed to §5 rules 1-3 (81bff85).
- minor (code, note only): Delete/Backspace matched by event.key, so numpad '.' with NumLock off (Windows) also clears. Declined: no change needed; expected behavior.
- spec (both reviewers): §5 rule 6 ambiguous; code prevents default on every unmodified press, even when nothing clears. Escalated to Alix; Alix approved rewording to match code (9e545a7) plus pinning tests (c5c0573, 8 tests, shown to fail when preventDefault runs only on change).
- minor (ux, spec question): X next to S/C wipes hidden Candidates with no undo until M1. Escalated; Alix kept spec as written. Declined.
- minor (ux, spec question): fill-mode Delete on a Candidates-only cell is a silent no-op. Escalated; Alix kept spec. Declined.
- minor (ux, future): import text field / confirmation must not sit inside the grid element. Escalated; noted on TASK-12.
Note: connection to the Mac dropped mid-fix; main session verified App.tsx clean and finished the round 1 commit.

Review round 2 (code-reviewer only; round 1 fixes were tests and spec wording, nothing player-facing). No majors. Mutation-checked all 11 new tests; each fails with the bug injected.
- minor (spec wording): rule 6's parenthetical listed 'C and S both held' as a no-op case for X too, though rule 2 says X still clears. Fixed: reworded to 'Delete/Backspace with C and S both held' (squashed into 64044f3).
- minor (test strength, note only): the rule 6 C+S test can't catch a fallback to the Sticky mode on its own, but the rule 2 tests do. Declined: no change needed, its job is pinning preventDefault.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delete/Backspace clear one layer of the Selected cell by active Entry mode (chord if held, else Sticky mode); X clears everything including hidden Candidates; Givens untouched. Rules in src/core/clear.ts (clearLayer, clearCell), wired in src/ui/App.tsx. Spec gaps settled by Alix and written into keymap §5 Rules 1-7. Verification: 1117 tests green on main (121 new: 32 core, 89 UI), typecheck clean; reviewers mutation-tested the new tests. Two review rounds, no majors. Follow-ups: real-browser check of delete / fn+delete / X on a Mac; X has no undo until M1; import field must sit outside the grid (noted on TASK-12).
<!-- SECTION:FINAL_SUMMARY:END -->
