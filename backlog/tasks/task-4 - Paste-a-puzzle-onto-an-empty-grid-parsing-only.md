---
id: TASK-4
title: Paste a puzzle onto an empty grid (parsing only)
status: To Do
assignee: []
created_date: 2026-10-24 19:21
updated_date: '2026-10-24T21:42:00Z'
labels:
  - afk
milestone: m-0
dependencies:
  - TASK-1
documentation:
  - docs/spec/import.md
  - docs/spec/milestones.md
  - CONTEXT.md
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let the player load a ◆PUZZLE by pasting its text onto the grid. In M0 this is parsing only: any text that parses is loaded as-is, with no validation and no solve (validation is M1, import §4). Builds on task-1, which provides the app, src/core/, and an empty grid on screen.

Spec: import.md §2 (paste on the grid) and §3 (formats, including parse errors). M0 rules, from docs/spec/milestones.md:
- Paste imports only onto an empty grid. Once a ◆PUZZLE is loaded, pasting is refused and the ◆PUZZLE is left exactly as it was. Reloading the page gives an empty grid again (nothing is saved in M0). Replacing a ◆PUZZLE is M1 (import §5).
- Parse errors, and the refusal above, appear as a toast in the top-right corner. This is interim; M1 may revisit.

Fixtures: this task also generates two fixture ◆PUZZLEs, for use in testing and in UI acceptance (the later tasks need a ◆PUZZLE to load, and Alix needs one to paste when reviewing). Keep them where tests and the UI checks can both reach them, and note their location in the handoff.

Not in this task: the I import field (M1), validation (M1), saving the ◆PUZZLE (M1). Use the terms in CONTEXT.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pasting (Cmd+V on macOS, Ctrl+V elsewhere) while the grid has focus and the grid is empty loads the pasted ◆PUZZLE
- [ ] #2 The parser removes all whitespace (spaces, tabs, line breaks) and commas, expects exactly 81 characters, and reads them left to right, top to bottom
- [ ] #3 1–9 are read as ◆GIVENs; ., 0, and - are read as empty cells
- [ ] #4 An 81-character string, nine lines of nine, and comma- or space-separated variants all load the same ◆PUZZLE
- [ ] #5 import.md §6 Sample A loads identically from both its 0-notation and its --notation forms
- [ ] #6 ◆GIVENs are drawn on the grid and are visibly distinct from an empty cell
- [ ] #7 Text with a character other than those above is rejected with a parse error naming the character and its position
- [ ] #8 Text that leaves other than 81 cells is rejected with a parse error stating the count (e.g. "found 79 cells, expected 81")
- [ ] #9 A rejected paste leaves the grid exactly as it was
- [ ] #10 Pasting while a ◆PUZZLE is already loaded is refused and leaves the ◆PUZZLE exactly as it was
- [ ] #11 Parse errors and the refusal appear as a toast in the top-right corner
- [ ] #12 Parsing lives in src/core/ and is covered by unit tests; the paste handling and toast are covered by UI tests
- [ ] #13 Two fixture ◆PUZZLEs are generated and available to both tests and UI acceptance checks, with their location noted in the handoff
<!-- AC:END -->
