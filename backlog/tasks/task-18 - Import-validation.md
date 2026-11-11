---
id: TASK-18
title: Import validation
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - import
milestone: m-1
dependencies:
  - TASK-13
  - TASK-17
references:
  - docs/spec/import.md
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: no more importing puzzles the app cannot solve. M0 accepted any puzzle set that parsed; now pasted text is validated before it loads, in the order import.md §4 sets out: parse, then conflict over the givens, then solve. Rejection messages are exact. A rejection leaves the grid exactly as it was. When accepted, the found solution is kept with the puzzle so Mistakes and Solved can use it. Depends on the paste bug (TASK-13) being fixed, and on the solver (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pasted text with conflicting givens is rejected with a message naming the duplicate (e.g. two 5s in row 3)
- [ ] #2 Parsed text with no solution is rejected: This puzzle has no solution — check for a mistyped digit.
- [ ] #3 Parsed text with more than one solution is rejected: This puzzle has more than one solution — check for a missing digit.
- [ ] #4 Validation order per import.md §4: parse error, then conflicting givens, then no solution, then many solutions
- [ ] #5 An accepted puzzle's solution is found at import time and stored with the puzzle as its known solution
- [ ] #6 A rejected import leaves the current puzzle exactly as it was
- [ ] #7 Validation lives in src/core/ with unit tests; the rejection toasts are covered by UI tests
<!-- AC:END -->
