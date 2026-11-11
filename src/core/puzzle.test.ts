// The Puzzle's representation: a 9×9 grid of cells (TASK-1, AC #2).
// Uses Vitest globals (describe/it/expect) so this file imports only from src/core/.
import { createEmptyPuzzle, hasPlayerInput, isEmptyCell, placedOver, replaceCell, withCandidates } from './puzzle';

describe('Puzzle representation', () => {
  it('an empty Puzzle has 9 rows', () => {
    expect(createEmptyPuzzle().cells).toHaveLength(9);
  });

  it('every row of an empty Puzzle has 9 cells', () => {
    for (const row of createEmptyPuzzle().cells) {
      expect(row).toHaveLength(9);
    }
  });

  it('every one of the 81 cells of an empty Puzzle is empty', () => {
    const cells = createEmptyPuzzle().cells.flat();
    expect(cells).toHaveLength(81);
    expect(cells.every((cell) => isEmptyCell(cell))).toBe(true);
  });

  it('each call returns a fresh empty Puzzle', () => {
    expect(createEmptyPuzzle()).not.toBe(createEmptyPuzzle());
    expect(createEmptyPuzzle()).toEqual(createEmptyPuzzle());
  });
});

describe('hasPlayerInput: whether the player has entered anything beyond the Givens', () => {
  it('an empty Puzzle has no player input', () => {
    expect(hasPlayerInput(createEmptyPuzzle())).toBe(false);
  });

  it('a Puzzle with only Givens has no player input', () => {
    const puzzle = replaceCell(createEmptyPuzzle(), { row: 0, column: 0 }, { kind: 'given', digit: 7 });
    expect(hasPlayerInput(puzzle)).toBe(false);
  });

  it('a Puzzle with one Placed digit has player input', () => {
    const puzzle = replaceCell(createEmptyPuzzle(), { row: 0, column: 0 }, placedOver(7, undefined));
    expect(hasPlayerInput(puzzle)).toBe(true);
  });

  it('a Puzzle with only Center marks has player input', () => {
    const puzzle = replaceCell(
      createEmptyPuzzle(),
      { row: 4, column: 4 },
      withCandidates({ centerMarks: [1, 2], cornerMarks: [] }),
    );
    expect(hasPlayerInput(puzzle)).toBe(true);
  });

  it('a Puzzle with only Corner marks has player input', () => {
    const puzzle = replaceCell(
      createEmptyPuzzle(),
      { row: 4, column: 4 },
      withCandidates({ centerMarks: [], cornerMarks: [3, 9] }),
    );
    expect(hasPlayerInput(puzzle)).toBe(true);
  });

  it('a Placed digit hiding Candidates still counts as player input', () => {
    const puzzle = replaceCell(
      createEmptyPuzzle(),
      { row: 0, column: 0 },
      placedOver(7, { centerMarks: [1, 2], cornerMarks: [3] }),
    );
    expect(hasPlayerInput(puzzle)).toBe(true);
  });
});
