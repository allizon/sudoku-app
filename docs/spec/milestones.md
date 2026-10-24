# Milestones

Status: **draft** — M0 and M1 decided; M2 and later partly decided.
Each milestone links to the spec sections it delivers. A milestone is done when every listed section is implemented, tested, and deployed.

## M0 — Walking skeleton

The whole stack, end to end: a deployed board that is fully keyboard-driven, with every input working and nothing checked.

- **Project setup:** TypeScript, React, Vite, Vitest; `src/core/` with the test that keeps UI imports out of it ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").
- **Deployed** to Vercel through its GitHub integration: every push to `main` deploys automatically.
- **Grid rendering:** Givens, placed digits, Center marks, and Corner marks are visibly distinct.
- **Keymap**, all of [`keymap.md`](./keymap.md) except undo/redo: principles (§1), entry modes (§2), letter chords (§3), movement (§4), clearing (§5), interaction with Givens and placed digits (§7), reserved keys (§8).
- **Paste import, parsing only:** [`import.md`](./import.md) §2 (paste on the grid) and §3 (formats, including parse errors). Any puzzle that parses is loaded as-is — no validation.
  - Paste imports only onto an empty grid. Once a puzzle is loaded, pasting is refused and the puzzle is left exactly as it was; reloading the page gives an empty grid again. (Replacing a puzzle is M1, [`import.md`](./import.md) §5.)
  - Parse errors, and the refusal above, appear as a toast in the top-right corner. (Interim; M1 may revisit.)

Not in M0: anything that checks the grid or remembers history.

## M1 — Playable and solvable

Everything needed to solve an imported puzzle in this app instead of elsewhere.

- **Undo/redo:** [`keymap.md`](./keymap.md) §6.
- **Import validation:** [`import.md`](./import.md) §4 — solve at import; exactly one solution; Givens without Conflicts.
- **Import field and puzzle replacement:** [`import.md`](./import.md) §2 (the `I` field) and §5.
- **Feedback:** all of [`feedback.md`](./feedback.md) — Conflicts (§2), Elimination (§3), Mistakes (§4), Solved (§5).
- **Autosave:** the puzzle in progress, its undo history, and its Solved state survive a refresh, through the storage interface ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").

## M2 — More puzzles

- **Built-in puzzles** from the Sudoku Exchange puzzle bank ([`import.md`](./import.md) "Not in this version").
- **Puzzle library** to hold more than one puzzle.
- **`.sdm` bundle import.**
- _Open:_ cell coloring.

## Later

Not yet assigned to a milestone:

- Angular UI on the same `src/core/` (the framework comparison)
- Multi-cell selection ([`keymap.md`](./keymap.md) §9)
- Bordered-grid import
- Sync across devices
- Timer, streaks
