# Feedback

Status: **draft, all sections decided** — awaiting Alix's review. Depends on `import.md` for how a ◆PUZZLE gets a known ◆SOLUTION.
Terms (◆GIVEN, ◆CANDIDATE, ◆CONFLICT, ◆MISTAKE, ◆SOLVED, …) are defined in [`CONTEXT.md`](../../CONTEXT.md).

## 1. Principles

- Feedback is honest and carries no penalty: nothing the player does is counted, scored, or punished.

## 2. Conflicts

- ◆CONFLICTs are evaluated over ◆GIVENs and ◆PLACED DIGITs, after every change to the grid (including undo and redo). A ◆CONFLICT marking appears the moment a duplicate exists and disappears the moment it doesn't.
- Every cell involved in a ◆CONFLICT is marked, so the player can see what the digit collides with.
- ◆PLACED DIGITs in a ◆CONFLICT get the strong marking; ◆GIVENs in a ◆CONFLICT get a lighter one.
- A ◆PLACED DIGIT in a ◆CONFLICT is shown only as a ◆CONFLICT, never also as a ◆MISTAKE.
- ◆CANDIDATEs are never ◆CONFLICTs.

## 3. Elimination

- When the player places a digit and the placement creates no ◆CONFLICT, every ◆CANDIDATE of that digit — ◆CENTER MARKs and ◆CORNER MARKs — is removed from the cell's ◆PEERs. This is an ◆ELIMINATION.
- A placement that creates a ◆CONFLICT causes no ◆ELIMINATION.
- ◆ELIMINATION does not consult the ◆SOLUTION: a conflict-free placement eliminates whether or not it is a ◆MISTAKE.
- The placement and the ◆ELIMINATION it causes are a single undo step. Undoing the placement restores every ◆CANDIDATE it eliminated.
- Removing or replacing the ◆PLACED DIGIT by any means other than undo does not restore eliminated ◆CANDIDATEs.
- ◆ELIMINATION is always on; there is no setting for it in this version.

## 4. Mistakes

- A ◆PLACED DIGIT is flagged as a ◆MISTAKE as soon as it is placed, if the ◆PUZZLE has a known ◆SOLUTION and the digit doesn't match it.
- ◆MISTAKEs look clearly different from ◆CONFLICTs: a ◆CONFLICT means "this breaks a rule"; a ◆MISTAKE means "this is legal but not the answer."
- ◆MISTAKEs are evaluated after every change to the grid (including undo and redo); the flag disappears when the digit is removed, replaced, or undone.
- A ◆MISTAKE blocks nothing: ◆ELIMINATION still happens (§3), and nothing is counted.
- When a ◆PUZZLE has no known ◆SOLUTION, no ◆MISTAKEs are shown for it, and the app states that ◆MISTAKE checking is unavailable for this ◆PUZZLE — so the absence of flags is never read as "no Mistakes."
- How a ◆PUZZLE gets a known ◆SOLUTION is specified in [`import.md`](./import.md) §4.

## 5. Solved

- When the grid becomes ◆SOLVED, the app says so clearly on screen, with a small celebratory flourish — a little pizzazz, short of confetti. The exact treatment is a design decision still to be made; any motion respects the player's reduced-motion setting.
- A ◆SOLVED grid is locked: digits and ◆CANDIDATEs cannot be changed.
- Selection and movement still work, so the player can look over the finished grid.
- Undo still works; undoing out of the ◆SOLVED state unlocks the grid.
- The ◆SOLVED state is saved with the ◆PUZZLE and survives a refresh.
- A ◆SOLVED grid never contains a ◆MISTAKE. This relies on every ◆PUZZLE with a known ◆SOLUTION having exactly one ◆SOLUTION, which [`import.md`](./import.md) guarantees (§1, §4).
