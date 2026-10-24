# Sudoku App

A personal, keyboard-first web app for solving classic 9×9 sudoku ◆PUZZLEs that are mostly imported from elsewhere. This glossary is the canonical language for specs, tests, and code.

## Language

### The puzzle

**Puzzle**:
The 9×9 grid being solved: its ◆GIVENs and everything the player has entered. The app holds one ◆PUZZLE at a time.
_Avoid_: Game

**Given**:
A digit that is part of the ◆PUZZLE as imported. ◆GIVENs are fixed and cannot be changed by the player.
_Avoid_: Clue, starting number, fixed cell

**Placed digit**:
A digit the player has entered in a cell in fill mode. Unlike a ◆GIVEN, it can be removed or replaced.
_Avoid_: Entry, value, guess, answer

**Solution**:
The single completed grid that satisfies the rules and agrees with every ◆GIVEN.
_Avoid_: Answer, answer key

**Peer**:
A cell that shares a row, column, or box with a given cell. Every cell has 20 ◆PEERs.
_Avoid_: Neighbor, buddy, related cell

### Playing

**Selected cell**:
The one cell that key presses act on. Exactly one cell is selected at all times.
_Avoid_: Cursor, active cell, focused cell

**Entry mode**:
What a digit key does to the ◆SELECTED CELL: in fill mode it places a digit, in center mode it toggles a ◆CENTER MARK, and in corner mode it toggles a ◆CORNER MARK. The ◆STICKY MODE is changed with `N`; a letter chord overrides it while held.
_Avoid_: Input mode, note mode, pencil mode

**Sticky mode**:
The ◆ENTRY MODE set with `N`, which stays in effect until `N` changes it again. A letter chord overrides it only while the chord's letter is held; releasing the letter reverts the ◆ENTRY MODE to the ◆STICKY MODE.
_Avoid_: Base mode, default mode, persistent mode

**Entry mode line**:
The small line of text under the grid that names the current ◆ENTRY MODE, colored by mode. It updates instantly whenever the ◆ENTRY MODE changes, including while a chord's letter is held, and reverts to the ◆STICKY MODE when the letter is released.
_Avoid_: Mode indicator, status bar, mode label

### Candidates

**Candidate**:
A digit the player has marked as a possibility, without placing it. Umbrella term for ◆CENTER MARKs and ◆CORNER MARKs.
_Avoid_: Note, pencil mark, small digit

**Center mark**:
A ◆CANDIDATE claiming "this cell could contain this digit." A cell's own list of possibilities, drawn in the center of the cell.
_Avoid_: Cell notation

**Corner mark**:
A ◆CANDIDATE claiming "this digit must go in one of the cells marked with it, within this box" (Snyder notation). Drawn in the corner of the cell.
_Avoid_: Box notation, Snyder mark

**Elimination**:
The automatic removal of a digit's ◆CANDIDATEs from a cell's ◆PEERs when that digit is placed in the cell without a ◆CONFLICT.
_Avoid_: Auto-clean, auto-remove, candidate cleanup

### Feedback

**Conflict**:
A digit that duplicates another digit in the same row, column, or box. Detectable without knowing the ◆SOLUTION.
_Avoid_: Error, collision, duplicate

**Mistake**:
A digit the player has placed (not a ◆GIVEN) that has no ◆CONFLICT but does not match the ◆SOLUTION. Only ◆PLACED DIGITs can be ◆MISTAKEs; ◆CANDIDATEs are never compared to the ◆SOLUTION.
_Avoid_: Error, wrong answer, incorrect

**Solved**:
The state of a ◆PUZZLE in which every cell holds a digit, all ◆GIVENs are intact, and there are no ◆CONFLICTs. Detectable without knowing the ◆SOLUTION.
_Avoid_: Complete, finished, won, "solution checking"
