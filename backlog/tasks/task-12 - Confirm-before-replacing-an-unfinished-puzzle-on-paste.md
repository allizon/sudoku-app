---
id: TASK-12
title: Confirm before replacing an unfinished puzzle on paste
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-25T22:31:00Z'
updated_date: '2026-11-11T23:41:00Z'
labels: []
milestone: m-1
dependencies:
  - TASK-23
references:
  - docs/spec/import.md
  - docs/spec/milestones.md
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Until now, paste is refused once a ◆PUZZLE is loaded (M0, milestones.md). Once the player can place digits (task-5), a paste over work in progress should not be silently refused or silently destroy it: it should ask, and on confirmation wipe the whole ◆PUZZLE and start fresh. Spec: import.md §2 (confirmation is keyboard-driven) and §5. Open point for Alix: import.md §5 asks only when at least one digit or ◆CANDIDATE has been entered (a ◆PUZZLE with only ◆GIVENs is replaced without asking); Alix described the trigger as "non-empty cells", which could also cover ◆GIVENs. Settle before writing tests. The "not ◆SOLVED" exemption depends on ◆SOLVED detection (feedback.md §5); if that is not built yet, the exemption is skipped and noted as a spec gap.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pasting a valid ◆PUZZLE while the current ◆PUZZLE has at least one ◆PLACED DIGIT or ◆CANDIDATE entered asks the player to confirm replacing it
- [ ] #2 Enter confirms, Escape cancels, and focus starts on cancel
- [ ] #3 Confirming replaces the whole ◆PUZZLE: new ◆GIVENs, empty undo history, fill mode, row 1 column 1 selected, nothing carried over from the old ◆PUZZLE
- [ ] #4 Cancelling leaves the current ◆PUZZLE exactly as it was
- [ ] #5 When nothing has been entered (or the ◆PUZZLE is ◆SOLVED), an accepted paste replaces the ◆PUZZLE without asking
- [ ] #6 A rejected paste (parse error) leaves the current ◆PUZZLE as it was and does not show the confirmation
- [ ] #7 Rules live in src/core/ with unit tests; the confirmation flow is covered by UI tests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read import.md §2/§5 and current paste implementation. 2. Branch task-12/confirm-replace-puzzle. 3. Write failing tests for confirmation flow. 4. Implement core rules + UI confirmation. 5. Review and merge.

4. Implement hasPlayerInput in core and confirmation dialog in App.tsx. 5. Run full suite green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
From task-8 UX review (2026-10-28): the grid's onKeyDown handles Backspace, Delete and X (and digits/letters). Any import text field or the replace-puzzle confirmation must not sit inside the grid element, or typing Backspace/X there would be caught and cancelled. Worth an acceptance criterion.

Dependency added when M1 tickets were planned (2026-11-01): AC #5's not-solved exemption needs solved detection, which lands with TASK-23. Until then the exemption can ship as a spec gap, as noted in the description.

2026-11-01 step 2: Alix approved test list. Answers: (1) trigger is PLACED DIGIT or CANDIDATE only, GIVENs alone do not ask; (2) Enter confirms + initial focus on Cancel, with possible UX review once running; (3) buttons labelled Cancel / Import. Solved-detection exemption skipped as spec gap (TASK-23).
<!-- SECTION:NOTES:END -->
