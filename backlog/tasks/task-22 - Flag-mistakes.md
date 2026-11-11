---
id: TASK-22
title: Flag mistakes
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - feedback
milestone: m-1
dependencies:
  - TASK-18
  - TASK-20
references:
  - docs/spec/feedback.md
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: a placed digit that is legal but wrong is flagged. Relies on the known solution stored at import validation (TASK-18). The flag must look clearly different from a conflict marking: a conflict breaks a rule, a mistake is legal but not the answer. Feedback is honest and carries no penalty (§1): the flag blocks nothing and nothing is counted. Evaluation runs after every change to the grid, including undo and redo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A placed digit that does not match the known solution is flagged as a mistake as soon as it is placed
- [ ] #2 The mistake flag disappears when the digit is removed, replaced, or undone; evaluated after every change to the grid, including undo and redo
- [ ] #3 The mistake marking is visually distinct from a conflict marking (covered by UI tests)
- [ ] #4 A placement that is both a conflict and a mistake is shown only as a conflict
- [ ] #5 A mistake blocks nothing: elimination still happens, and nothing is counted or penalized
- [ ] #6 For a puzzle with no known solution, no mistake flags are shown and the app states that mistake checking is unavailable for this puzzle
- [ ] #7 Mistake rules live in src/core/ with unit tests
<!-- AC:END -->
