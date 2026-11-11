---
id: TASK-17
title: Solver for import validation
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - import
milestone: m-1
dependencies: []
references:
  - docs/spec/import.md
  - docs/spec/import.md §6
  - backlog/tasks/task-16 - Undo-and-redo.md
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: import validation (import.md §4) needs to know whether a puzzle set has zero, one, or many solutions — the app must know a puzzle's solution before feedback (feedback.md §4, §5) can work. This ticket is the pure solver; the validation that calls it is its own ticket. Pure src/core/, no UI imports. Exhaustive search, not a heuristic solver: multi-solution detection requires proving there is no second solution. Sample A (import.md §6) is the known one-solution case.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Classifies a puzzle set as having no solution, exactly one solution, or more than one solution
- [ ] #2 For a puzzle with exactly one solution (Sample A), the found solution matches the verified one in import.md §6
- [ ] #3 A valid puzzle with a digit removed is classified as having more than one solution
- [ ] #4 A puzzle with conflicting givens is classified as having no solution
- [ ] #5 Multiple-solution classification is verified by exhaustive search, not a heuristic
- [ ] #6 The solver lives in src/core/ with no imports from outside src/core/
<!-- AC:END -->
