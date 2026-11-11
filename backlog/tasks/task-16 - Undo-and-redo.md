---
id: TASK-16
title: Undo and redo
status: Done
assignee:
  - '@claude'
created_date: '2026-11-01T16:25:00Z'
updated_date: '2026-11-01T17:57:00Z'
labels:
  - undo
milestone: m-1
dependencies: []
references:
  - docs/spec/keymap.md
  - docs/spec/feedback.md
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: the player can take back mistakes. Adds the undo/redo engine and its keys. The undo step rules are subtle — especially that each digit in a chord is its own step, and that undo restores a cell exactly, including hidden ◆CANDIDATEs and ◆CORNER MARKs. Keeps the §6 table and rules. History survives a page refresh (§6), but refresh survival lands with the autosave ticket: it depends on the storage interface. When elimination lands later (feedback.md §3), the 'placement + elimination is one step' bundling is added by that ticket.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cmd+Z (macOS) / Ctrl+Z undoes the last step; Shift+Cmd+Z (macOS) / Shift+Ctrl+Z / Ctrl+Y redoes
- [x] #2 Each change to the grid is one undo step: placing, removing, or replacing a digit; toggling one candidate; one Delete/Backspace; one X
- [x] #3 Each digit pressed during a chord is its own step: hold C, press 1, 2, 3, and undo removes 3, then 2, then 1
- [x] #4 Moving the selection and changing the sticky mode are not undo steps
- [x] #5 Undo restores the cell exactly as it was, including hidden candidates and corner marks (undoing X brings everything back)
- [x] #6 Making a new change after undoing discards the redo history
- [x] #7 Undo/redo rules live in src/core/ with unit tests; the key bindings are covered by UI tests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Undo/redo engine in src/core/undo.ts: a history of one-cell snapshots (the whole Puzzle is immutable, so a snapshot of the affected cell suffices to restore it exactly, including hidden Candidates and Corner marks). Each grid change pushes {position, before} onto the undo stack and clears the redo stack; a no-op change pushes nothing.
2. applyWithUndo(puzzle, mutator) wraps fillDigit/toggleCenterMark/toggleCornerMark/clearLayer/clearCell/replaceCell calls; undo() and redo() swap the cell in and out.
3. App.tsx wires Cmd/Ctrl+Z and Shift+Cmd+Z/Shift+Ctrl+Z/Ctrl+Y; selection and sticky-mode changes bypass history.
4. Refresh survival is deferred to TASK-24 (per the ticket description); history is in-memory this task, but the Store interface stays untouched.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review record — round 1 (code-reviewer + ux-reviewer in parallel): no majors. Fixed: (1) undo.ts invariant comment described board-matching that laid-back steps actually rely on not needing — rewritten; (2) App.tsx comment promised KeyZ+both(Cmd,Ctrl) is left to the browser while the code treated it as undo — guard tightened (metaKey !== ctrlKey) and a new UI test pins it; (3) added core test for a two-step discarded redo trail, which caught a genuine order bug in the lay-back (steps now reversed when laid back). Settled, not findings: commit scope (undo) → (keymap) at tidy; auto-repeat of undo/redo keys repeats, undo works while a chord letter is held, Ctrl+Y honored on all platforms per §6 table. Declined: none. Additional fixup found by implementer while adding (3): multi-step discard order was wrong, fixed in same commit.

Verified on main after merge: 1179/1179 tests (69 new), tsc clean. Evidence per AC: #1 src/ui/undo.test.tsx key-variant describes; #2 core it.each (one step per place/remove/replace/toggle/Delete/X) + no-op it.each; #3 chord test in both files; #4 selection/click/N tests; #5 hidden-Candidates tests including undoing X; #6 revised trail tests (redo discarded, trail kept, no-ops keep redo); #7 src/core/undo.ts + unit tests, bindings in UI tests.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @claude
created: 2026-11-01T17:53:00Z

---

auto-repeat/chord-held/Ctrl+Y recorded as spec gaps in the handoff

---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Undo/redo added: engine in src/core/undo.ts (reversible {position, before, after} steps; no-ops record nothing; a real change after an undo discards redo but the undo trail keeps earlier changes — laid back sides-exchanged, newest first), wired in App.tsx (Cmd/Ctrl+Z, Shift+Cmd+Z/Shift+Ctrl+Z/Ctrl+Y by physical key; preventDefault always; selection and Sticky mode outside history; paste resets history). Settled rules written to keymap §6. Refresh survival deferred to TASK-24. 1179 green. Risks/follow-ups: spec gaps recorded (auto-repeat repeats, undo during a chord, Ctrl+Y all platforms, Cmd+Ctrl+Z left to browser); redo-stack layout for multi-cell discards only tested at length 1 and 2; undo/redo focus rules to revisit at TASK-12's confirmation dialog.
<!-- SECTION:FINAL_SUMMARY:END -->
