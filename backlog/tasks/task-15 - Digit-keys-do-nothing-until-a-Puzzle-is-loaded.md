---
id: TASK-15
title: Digit keys do nothing until a Puzzle is loaded
status: To Do
assignee: []
created_date: '2026-10-28T02:08:00Z'
labels:
  - keymap
milestone: m-0
dependencies: []
references:
  - src/ui/App.tsx
documentation:
  - docs/spec/keymap.md
  - docs/spec/import.md
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before any ◆PUZZLE is loaded, a stray digit press puts a ◆PLACED DIGIT or a ◆CANDIDATE on the empty grid. The grid then no longer counts as empty, so the next paste is refused with "A puzzle is already loaded — reload the page to start a new one", which isn't true, and the "Paste a puzzle to start" hint disappears. The only way out is a reload. Found in task-6 review (finding CR-4); Candidates made it more likely, since nothing visibly looks loaded.

Alix (2026-10-27): "ignore any marks before the puzzle loads", then chose: until a ◆PUZZLE is loaded, digit keys do nothing in every ◆ENTRY MODE, placed digits included. Write this into the spec (keymap §7 or §2) on the task branch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Before a ◆PUZZLE is loaded, a digit key does nothing in fill, center, or corner mode: no ◆PLACED DIGIT or ◆CANDIDATE appears and the hint stays
- [ ] #2 After an accepted paste, digit keys work as before in every ◆ENTRY MODE
- [ ] #3 N, arrow keys, and clicking still work before a ◆PUZZLE is loaded
- [ ] #4 A paste onto the never-loaded grid is accepted even after digit keys were pressed
- [ ] #5 The rule is recorded in docs/spec/keymap.md
<!-- AC:END -->
