// The Puzzle's representation: a 9×9 grid of cells (TASK-1, AC #2).
// Uses Vitest globals (describe/it/expect) so this file imports only from src/core/.
import { createEmptyPuzzle, isEmptyCell } from './puzzle';

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
