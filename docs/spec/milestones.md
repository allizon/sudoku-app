# Milestones

Status: **draft** — M0 and M1 decided; M2 and later partly decided.
Each milestone links to the spec sections it delivers. A milestone is done when every listed section is implemented, tested, and deployed.

## M0 — Walking skeleton

The whole stack, end to end: a deployed board that is fully keyboard-driven, with every input working and nothing checked.

- **Project setup:** TypeScript, React, Vite, Vitest; `src/core/` with the test that keeps UI imports out of it ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").
- **Deployed** to Vercel through its GitHub integration: every push to `main` deploys automatically.
- **Grid rendering:** ◆GIVENs, ◆PLACED DIGITs, ◆CENTER MARKs, and ◆CORNER MARKs are visibly distinct.
- **Display:** [`display.md`](./display.md) §1 (grid size) and §2 (light and dark color schemes, with the toggle).
- **Keymap**, all of [`keymap.md`](./keymap.md) except undo/redo: principles (§1), ◆ENTRY MODEs (§2), letter chords (§3), movement (§4), clearing (§5), interaction with ◆GIVENs and ◆PLACED DIGITs (§7), reserved keys (§8).
- **Paste import, parsing only:** [`import.md`](./import.md) §2 (paste on the grid) and §3 (formats, including parse errors). Any ◆PUZZLE that parses is loaded as-is — no validation.
  - Paste imports only onto an empty grid. Once a ◆PUZZLE is loaded, pasting is refused and the ◆PUZZLE is left exactly as it was; reloading the page gives an empty grid again. (Replacing a ◆PUZZLE is M1, [`import.md`](./import.md) §5.)
  - Parse errors, and the refusal above, appear as a toast in the top-right corner. (Interim; M1 may revisit.)
    - The refusal reads "A puzzle is already loaded — reload the page to start a new one." It is shown alone, even when the pasted text also has parse errors. Its toast is a less-saturated red than a parse error's.
    - A successful paste shows no toast.
    - A ◆PUZZLE of 81 empty cells does not count as loaded.
    - Each toast lasts 10 seconds, or until the player clicks anywhere on it. Escape dismisses every toast.
    - Toasts stack, each with its own 10 seconds. When there's no room for them beside the grid, they sit at the bottom of the window, below the grid, so they never cover it. There they may cover what sits under the grid (the "Paste a puzzle to start" hint, the ◆ENTRY MODE LINE) while they show; they stay clear of the color scheme toggle.

Not in M0: anything that checks the grid or remembers history.

## M1 — Playable and solvable

Everything needed to solve an imported ◆PUZZLE in this app instead of elsewhere.

- **Undo/redo:** [`keymap.md`](./keymap.md) §6.
- **Import validation:** [`import.md`](./import.md) §4 — solve at import; exactly one ◆SOLUTION; ◆GIVENs without ◆CONFLICTs.
- **Import field and ◆PUZZLE replacement:** [`import.md`](./import.md) §2 (the `I` field) and §5.
- **Feedback:** all of [`feedback.md`](./feedback.md) — ◆CONFLICTs (§2), ◆ELIMINATION (§3), ◆MISTAKEs (§4), ◆SOLVED (§5).
- **Autosave:** the ◆PUZZLE in progress, its undo history, and its ◆SOLVED state survive a refresh, through the storage interface ([`AGENTS.md`](../../AGENTS.md) "Stack and architecture").

## M2 — More puzzles

- **Built-in ◆PUZZLEs** from the Sudoku Exchange puzzle bank ([`import.md`](./import.md) "Not in this version").
- **◆PUZZLE library** to hold more than one ◆PUZZLE.
- **`.sdm` bundle import.**
- _Open:_ cell coloring.

## Later

Not yet assigned to a milestone:

- Angular UI on the same `src/core/` (the framework comparison)
- Multi-cell selection ([`keymap.md`](./keymap.md) §9)
- Bordered-grid import
- Sync across devices
- Timer, streaks
- Skins: player-selectable visual themes beyond light and dark ([`display.md`](./display.md) §4)
