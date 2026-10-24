# Import

Status: **draft, all sections decided** — awaiting Alix's review.
Terms (◆GIVEN, ◆SOLUTION, ◆CONFLICT, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- Every accepted ◆PUZZLE has exactly one ◆SOLUTION, and the app knows it. [`feedback.md`](./feedback.md) relies on this for ◆MISTAKEs (§4) and ◆SOLVED (§5).
- A rejected import explains what is wrong, specifically enough for the player to fix the pasted text.

## 2. Starting an import

- Pasting (Cmd+V on macOS, Ctrl+V elsewhere) while the grid has focus imports the clipboard text.
- `I` opens a visible import text field, for reviewing pasted text or typing a ◆PUZZLE by hand; submitting it imports its contents. The same field is reachable with the mouse.
- Both routes go through the same parsing (§3) and validation (§4).
- The replace-puzzle confirmation (§5) is keyboard-driven: Enter confirms, Escape cancels, and focus starts on cancel.

## 3. Formats

The player pastes one ◆PUZZLE as text. The parser:

1. Removes all whitespace (spaces, tabs, line breaks) and commas.
2. Expects exactly 81 characters to remain, read left to right, top to bottom.
3. Reads `1`–`9` as ◆GIVENs, and `.`, `0`, and `-` as empty cells.

Any other character is a parse error naming the character and its position. This one rule accepts an 81-character string, row-by-row text (nine lines of nine), and comma- or space-separated variants.

### Not in this version

- Bordered grids (using `|`, `+`, and `---` lines): `-` would be ambiguous between an empty cell and a border.
- `.sdm` bundles (many ◆PUZZLEs, one per line): planned for a later milestone, together with a ◆PUZZLE library to hold them.
- Built-in ◆PUZZLEs: planned for M2. A curated set of rated ◆PUZZLEs shipped with the app, so the player can start a new ◆PUZZLE without importing. Source: the [Sudoku Exchange puzzle bank](https://github.com/grantm/sudoku-exchange-puzzle-bank) (stated free of copyright; rated by Sukaku Explainer, "Diabolical" = 5.0+; one ◆PUZZLE per line as hash, 81 digits, rating).

## 4. Validation

Every imported ◆PUZZLE is checked in this order; the first failure rejects it.

| The pasted ◆PUZZLE…                      | Result                                                                                          |
|-----------------------------------------|-------------------------------------------------------------------------------------------------|
| can't be parsed                          | Rejected, saying what was found (e.g. "found 79 cells, expected 81")                            |
| has ◆GIVENs that ◆CONFLICT                 | Rejected, naming the duplicate (e.g. "two 5s in row 3")                                          |
| has no ◆SOLUTION                          | Rejected: "This puzzle has no solution — check for a mistyped digit."                           |
| has more than one ◆SOLUTION               | Rejected: "This puzzle has more than one solution — check for a missing digit."                 |
| has exactly one ◆SOLUTION                 | Accepted; that ◆SOLUTION becomes the ◆PUZZLE's ◆SOLUTION.                                          |

- The solve runs at import time, and the import waits for it to finish.

## 5. Replacing the current puzzle

The app holds one ◆PUZZLE at a time.

- When the current ◆PUZZLE is unfinished (at least one digit or ◆CANDIDATE entered, and not ◆SOLVED), an accepted import first asks the player to confirm replacing it.
- When the current ◆PUZZLE is ◆SOLVED, or nothing has been entered, an accepted import replaces it without asking.
- An accepted import starts the new ◆PUZZLE fresh: its ◆GIVENs, an empty undo history, fill mode, and row 1, column 1 selected.
- A rejected import leaves the current ◆PUZZLE exactly as it was.

## 6. Test samples

- **Sample A** — extremesudoku.info "Evil" tier, 24 ◆GIVENs, verified 2026-08-26:
  `020060080700001009000809000072000600100000007005000930000307000300500004010020060`
  - Same ◆PUZZLE in the site's permalink notation (`-` for empty):
    `-2--6--8-7----1--9---8-9----72---6--1-------7--5---93----3-7---3--5----4-1--2--6-`
  - Exactly one ◆SOLUTION (checked 2026-10-24 by exhaustive search):
    `923765481786241359451839276872493615139652847645178932264317598397586124518924763`
