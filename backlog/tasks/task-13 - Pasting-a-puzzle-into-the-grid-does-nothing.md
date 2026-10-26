---
id: TASK-13
title: Pasting a puzzle into the grid does nothing
status: To Do
assignee: []
created_date: '2026-10-26T01:31:00Z'
labels:
  - import
dependencies: []
references:
  - src/ui/App.tsx
documentation:
  - docs/spec/import.md
priority: high
type: bug
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Since the latest pushes to main (task-5, fill mode: bf57df0..46f49f1), pasting a ◆PUZZLE into the empty grid on the deployed app does nothing: the grid stays empty, and no parse-error or refusal toast appears. Paste worked after task-4 and task-3. The full Vitest suite (440 tests) still passes on main at 46f49f1, so the tests do not catch this, and the cause is not yet known. Task-5 changed the grid's keydown handler (src/ui/App.tsx: digit keys now call preventDefault, with Cmd, Ctrl and Alt left to the browser), the Cell type (added placed), and cell rendering. Those are the first places to look, but none has been confirmed as the cause.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pasting a valid ◆PUZZLE into the empty grid with Cmd+V or Ctrl+V loads its ◆GIVENs, as in task-4 (import.md)
- [ ] #2 Pasting invalid text into the empty grid shows the parse-error toasts again
- [ ] #3 The bug is reproduced in a real browser before the fix, and the cause is written in the task notes
- [ ] #4 A test that fails on 46f49f1 covers the cause, so the suite would catch it next time
<!-- AC:END -->
