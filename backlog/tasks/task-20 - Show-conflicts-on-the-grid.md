---
id: TASK-20
title: Show conflicts on the grid
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - feedback
milestone: m-1
dependencies:
  - TASK-16
references:
  - docs/spec/feedback.md
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: first feedback feature. A conflict marking appears the moment a duplicate exists among the givens and placed digits, and disappears the moment it does not — evaluated after every change to the grid, including undo and redo. Marking strength is different for placed digits and givens. Candidates are never conflicts. This ticket does not consult the solution, so it can land before import validation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Conflicts are evaluated over givens and placed digits after every change to the grid, including undo and redo
- [ ] #2 A conflict marking appears the moment a duplicate exists and disappears the moment it does not
- [ ] #3 Every cell involved in a conflict is marked, so the digit and what it collides with are both visible
- [ ] #4 Placed digits in a conflict get the strong marking; givens in a conflict get a lighter one
- [ ] #5 Conflict rules live in src/core/ with unit tests; the markings, including the visual difference between the two strengths, are covered by UI tests
<!-- AC:END -->
