---
id: TASK-21
title: Eliminate candidates on placement
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - feedback
milestone: m-1
dependencies:
  - TASK-16
  - TASK-20
references:
  - docs/spec/feedback.md
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: the app should tidy candidates like a human player does. Placing a digit without creating a conflict removes that digit's candidates (center marks and corner marks) from the cell's peers. The placement and the elimination it causes are one undo step — this changes what TASK-16's engine counts as one step, which is why it depends on undo. Elimination does not consult the solution: it happens on every conflict-free placement, mistake or not (mistakes arrive later, in TASK-22).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Placing a digit that creates no conflict removes every candidate of that digit (center marks and corner marks) from the cell peers
- [ ] #2 A placement that creates a conflict causes no elimination
- [ ] #3 The placement and the elimination it causes are one undo step: undoing the placement restores every candidate it eliminated
- [ ] #4 Removing or replacing the placed digit by any means other than undo does not restore eliminated candidates
- [ ] #5 Elimination is always on; there is no setting for it
- [ ] #6 Elimination rules live in src/core/ with unit tests, extending the undo step rules of TASK-16; the visible result is covered by UI tests
<!-- AC:END -->
