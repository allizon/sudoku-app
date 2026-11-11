---
id: TASK-19
title: Import field on I
status: To Do
assignee: []
created_date: '2026-11-01T16:25:00Z'
labels:
  - import
milestone: m-1
dependencies:
  - TASK-13
  - TASK-18
references:
  - docs/spec/import.md
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1: the player should not have to dig for the clipboard to enter or fix a puzzle. Adds the visible import text field on I (import.md §2): reviewing pasted text, or typing a set by hand. Same parsing (§3) and validation (§4) as paste. Reachable with the mouse too. From task-12 notes: the field must not sit inside the grid element, or typing Backspace/X there would be caught and cancelled by the grid's keydown handler.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 I opens a visible import text field with focus in it
- [ ] #2 Submitting the field imports its contents through the same parsing and validation as paste
- [ ] #3 The field is reachable and usable with the mouse alone
- [ ] #4 Typing Backspace, X, digits, and letters in the field edits its text; the grid does not react to those keys while the field has focus
- [ ] #5 Escape or otherwise leaving the field returns focus to the grid
- [ ] #6 The field flow is covered by UI tests; any shared rules added are covered by core unit tests
<!-- AC:END -->
