# Import

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (Given, Solution, Conflict, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- Every accepted puzzle has exactly one solution, and the app knows it. [`feedback.md`](./feedback.md) relies on this for Mistakes (§4) and Solved (§5).
- A rejected import explains what is wrong, specifically enough for the player to fix the pasted text.

## 2. Starting an import

- Pasting (Cmd+V on macOS, Ctrl+V elsewhere) while the grid has focus imports the clipboard text.
- `I` opens a visible import text field, for reviewing pasted text or typing a puzzle by hand; submitting it imports its contents. The same field is reachable with the mouse.
- Both routes go through the same parsing (§3) and validation (§4).
- The replace-puzzle confirmation (§5) is keyboard-driven: Enter confirms, Escape cancels, and focus starts on cancel.

## 3. Formats

The player pastes one puzzle as text. The parser:

1. Removes all whitespace (spaces, tabs, line breaks) and commas.
2. Expects exactly 81 characters to remain, read left to right, top to bottom.
3. Reads `1`–`9` as Givens, and `.`, `0`, and `-` as empty cells.

Any other character is a parse error naming the character and its position. This one rule accepts an 81-character string, row-by-row text (nine lines of nine), and comma- or space-separated variants.

### Not in this version

- Bordered grids (using `|`, `+`, and `---` lines): `-` would be ambiguous between an empty cell and a border.
- `.sdm` bundles (many puzzles, one per line): planned for a later milestone, together with a puzzle library to hold them.
- Built-in puzzles: planned for M2. A curated set of rated puzzles shipped with the app, so the player can start a new puzzle without importing. Source: the [Sudoku Exchange puzzle bank](https://github.com/grantm/sudoku-exchange-puzzle-bank) (stated free of copyright; rated by Sukaku Explainer, "Diabolical" = 5.0+; one puzzle per line as hash, 81 digits, rating).

## 4. Validation

Every imported puzzle is checked in this order; the first failure rejects it.

| The pasted puzzle…                      | Result                                                                                          |
|-----------------------------------------|-------------------------------------------------------------------------------------------------|
| can't be parsed                          | Rejected, saying what was found (e.g. "found 79 cells, expected 81")                            |
| has Givens that Conflict                 | Rejected, naming the duplicate (e.g. "two 5s in row 3")                                          |
| has no solution                          | Rejected: "This puzzle has no solution — check for a mistyped digit."                           |
| has more than one solution               | Rejected: "This puzzle has more than one solution — check for a missing digit."                 |
| has exactly one solution                 | Accepted; that solution becomes the puzzle's Solution.                                          |

- The solve runs at import time, and the import waits for it to finish.

## 5. Replacing the current puzzle

The app holds one puzzle at a time.

- When the current puzzle is unfinished (at least one digit or Candidate entered, and not Solved), an accepted import first asks the player to confirm replacing it.
- When the current puzzle is Solved, or nothing has been entered, an accepted import replaces it without asking.
- An accepted import starts the new puzzle fresh: its Givens, an empty undo history, fill mode, and row 1, column 1 selected.
- A rejected import leaves the current puzzle exactly as it was.

## 6. Test samples

- **Sample A** — extremesudoku.info "Evil" tier, 24 Givens, verified 2026-08-26:
  `020060080700001009000809000072000600100000007005000930000307000300500004010020060`
  - Same puzzle in the site's permalink notation (`-` for empty):
    `-2--6--8-7----1--9---8-9----72---6--1-------7--5---93----3-7---3--5----4-1--2--6-`
  - Exactly one solution (checked 2026-10-24 by exhaustive search):
    `923765481786241359451839276872493615139652847645178932264317598397586124518924763`
