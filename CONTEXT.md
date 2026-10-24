# Sudoku App

A personal, keyboard-first web app for solving classic 9×9 sudoku puzzles that are mostly imported from elsewhere. This glossary is the canonical language for specs, tests, and code.

## Language

### The puzzle

**Given**:
A digit that is part of the puzzle as imported. Givens are fixed and cannot be changed by the player.
_Avoid_: Clue, starting number, fixed cell

**Solution**:
The single completed grid that satisfies the rules and agrees with every Given.
_Avoid_: Answer, answer key

**Peer**:
A cell that shares a row, column, or box with a given cell. Every cell has 20 Peers.
_Avoid_: Neighbor, buddy, related cell

### Candidates

**Candidate**:
A digit the player has marked as a possibility, without placing it. Umbrella term for Center marks and Corner marks.
_Avoid_: Note, pencil mark, small digit

**Center mark**:
A Candidate claiming "this cell could contain this digit." A cell's own list of possibilities, drawn in the center of the cell.
_Avoid_: Cell notation

**Corner mark**:
A Candidate claiming "this digit must go in one of the cells marked with it, within this box" (Snyder notation). Drawn in the corner of the cell.
_Avoid_: Box notation, Snyder mark

**Elimination**:
The automatic removal of a digit's Candidates from a cell's Peers when that digit is placed in the cell without a Conflict.
_Avoid_: Auto-clean, auto-remove, candidate cleanup

### Feedback

**Conflict**:
A digit that duplicates another digit in the same row, column, or box. Detectable without knowing the Solution.
_Avoid_: Error, collision, duplicate

**Mistake**:
A digit the player has placed (not a Given) that has no Conflict but does not match the Solution. Only placed digits can be Mistakes; candidates are never compared to the Solution.
_Avoid_: Error, wrong answer, incorrect

**Solved**:
The state of a puzzle in which every cell holds a digit, all Givens are intact, and there are no Conflicts. Detectable without knowing the Solution.
_Avoid_: Complete, finished, won, "solution checking"
