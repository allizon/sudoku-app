# Feedback

Status: **draft, all sections decided** — awaiting Alix's review. Depends on `import.md` for how a puzzle gets a known Solution.
Terms (Given, Candidate, Conflict, Mistake, Solved, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- Feedback is honest and carries no penalty: nothing the player does is counted, scored, or punished.

## 2. Conflicts

- Conflicts are evaluated over Givens and placed digits, after every change to the grid (including undo and redo). A Conflict marking appears the moment a duplicate exists and disappears the moment it doesn't.
- Every cell involved in a Conflict is marked, so the player can see what the digit collides with.
- Placed digits in a Conflict get the strong marking; Givens in a Conflict get a lighter one.
- A placed digit in a Conflict is shown only as a Conflict, never also as a Mistake.
- Candidates are never Conflicts.

## 3. Elimination

- When the player places a digit and the placement creates no Conflict, every Candidate of that digit — Center marks and Corner marks — is removed from the cell's Peers. This is an Elimination.
- A placement that creates a Conflict causes no Elimination.
- Elimination does not consult the Solution: a conflict-free placement eliminates whether or not it is a Mistake.
- The placement and the Elimination it causes are a single undo step. Undoing the placement restores every Candidate it eliminated.
- Removing or replacing the placed digit by any means other than undo does not restore eliminated Candidates.
- Elimination is always on; there is no setting for it in this version.

## 4. Mistakes

- A placed digit is flagged as a Mistake as soon as it is placed, if the puzzle has a known Solution and the digit doesn't match it.
- Mistakes look clearly different from Conflicts: a Conflict means "this breaks a rule"; a Mistake means "this is legal but not the answer."
- Mistakes are evaluated after every change to the grid (including undo and redo); the flag disappears when the digit is removed, replaced, or undone.
- A Mistake blocks nothing: Elimination still happens (§3), and nothing is counted.
- When a puzzle has no known Solution, no Mistakes are shown for it, and the app states that mistake checking is unavailable for this puzzle — so the absence of flags is never read as "no Mistakes."
- How a puzzle gets a known Solution is specified in [`import.md`](./import.md) §4.

## 5. Solved

- When the grid becomes Solved, the app says so clearly on screen, with a small celebratory flourish — a little pizzazz, short of confetti. The exact treatment is a design decision still to be made; any motion respects the player's reduced-motion setting.
- A Solved grid is locked: digits and Candidates cannot be changed.
- Selection and movement still work, so the player can look over the finished grid.
- Undo still works; undoing out of the Solved state unlocks the grid.
- The Solved state is saved with the puzzle and survives a refresh.
- A Solved grid never contains a Mistake. This relies on every puzzle with a known Solution having exactly one solution, which [`import.md`](./import.md) guarantees (§1, §4).
