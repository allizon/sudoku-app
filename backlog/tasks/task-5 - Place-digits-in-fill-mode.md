---
id: TASK-5
title: Place digits in fill mode
status: Done
assignee: []
created_date: 2026-10-24 19:22
updated_date: '2026-10-25T22:37:00Z'
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
- [x] #1 Pressing a digit key 1–9 on an empty ◆SELECTED CELL places that digit
- [x] #2 Pressing the same digit on a cell holding that ◆PLACED DIGIT removes it (toggle)
- [x] #3 Pressing a different digit on a cell holding a ◆PLACED DIGIT replaces it
- [x] #4 Pressing a digit on a ◆GIVEN does nothing
- [x] #5 Digit keys are identified by physical key, not by the character produced (e.g. Shift+1 still counts as 1)
- [x] #6 Cmd+digit is never handled by the app, so the browser's tab switching on macOS keeps working
- [x] #7 ◆PLACED DIGITs are visibly distinct from ◆GIVENs
- [x] #8 Fill-mode rules live in src/core/ and are covered by unit tests; the keyboard wiring is covered by UI tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Review round 1 (code-reviewer + ux-reviewer)
No major findings.
- minor, process (code-reviewer): keymap.md §1 edited (numpad, Ctrl/Alt+digit, repeat) without Alix approval. Declined: the main session made the edit at Alix's instruction (numpad and repeat; the Ctrl/Alt line follows Alix's answer on Q3). Listed in the handoff.
- minor, wording (code-reviewer): cell label built from internal kind string. Fixed: cellLabel switches on kind with explicit strings (bd1b190).
- minor, forced-colors (ux-reviewer): placed vs given collapses to weight only. Fixed: .placed is italic, which survives forced-colors; CSS-rule test in placed-style.test.ts (bd1b190).
- minor, small cells (ux-reviewer): placed vs given subtle at ~30px. Fixed as a side effect of the italic (bd1b190); recheck once Candidates exist.
- Raised, not defects: no dark value for --placed-digit (no dark scheme yet, task-10); silent no-op on a Given; Shift meaning once chords exist; no undo yet.

Italics (0b835e8) dropped at Alix's request (d059731), with the italic CSS test; the forced-colors finding is therefore open again: placed and given differ only by weight there. Recheck when the display spec is next touched or once Candidates exist.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Digits 1-9 (number row and numpad) now place, toggle and replace ◆PLACED DIGITs in the ◆SELECTED CELL; ◆GIVENs are untouched. Digits are read by physical key (Shift allowed); Cmd, Ctrl, Alt and key repeat are ignored. ◆PLACED DIGITs are blue and lighter than ◆GIVENs. Rules in src/core/fill.ts and keys.ts with unit tests; wiring covered by UI tests. 440 tests pass, typecheck clean. Review: one round, no major findings. Risks/follow-ups: forced-colors shows placed vs given by weight only; no dark value for --placed-digit (task-10); silent no-op on a ◆GIVEN; replace-confirmation on paste is task-12.
<!-- SECTION:FINAL_SUMMARY:END -->
