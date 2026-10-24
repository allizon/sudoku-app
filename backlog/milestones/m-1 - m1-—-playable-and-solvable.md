---
id: m-1
title: "M1 — Playable and solvable"
---

## Description

Everything needed to solve an imported puzzle in this app instead of elsewhere. See docs/spec/milestones.md.

- Undo/redo: keymap.md §6.
- Import validation: import.md §4 — solve at import; exactly one solution; Givens without Conflicts.
- Import field and game replacement: import.md §2 (the I field) and §5.
- Feedback: all of feedback.md — Conflicts (§2), Elimination (§3), Mistakes (§4), Solved (§5).
- Autosave: the game, its undo history, and its Solved state survive a refresh, through the storage interface (AGENTS.md "Stack and architecture").
