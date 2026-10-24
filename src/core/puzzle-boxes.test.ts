// Boxes of the Puzzle, and independence of fresh Puzzles (review round 1 of TASK-1).
import { boxOf, createEmptyPuzzle } from './puzzle';

describe('boxOf', () => {
  it.each([
    [0, 0, 0],
    [0, 8, 2],
    [2, 2, 0],
    [3, 3, 4],
    [4, 5, 4],
    [5, 6, 5],
    [6, 0, 6],
    [8, 4, 7],
    [8, 8, 8],
  ])('row %i, column %i is in box %i', (row, column, box) => {
    expect(boxOf(row, column)).toBe(box);
  });

  it('every box holds exactly nine cells', () => {
    const counts = new Array<number>(9).fill(0);
    for (let row = 0; row < 9; row++) {
      for (let column = 0; column < 9; column++) {
        const box = boxOf(row, column);
        counts[box] = (counts[box] ?? 0) + 1;
      }
    }
    expect(counts).toEqual([9, 9, 9, 9, 9, 9, 9, 9, 9]);
  });
});

describe('createEmptyPuzzle', () => {
  it('two Puzzles share no rows or cells', () => {
    const a = createEmptyPuzzle();
    const b = createEmptyPuzzle();
    a.cells.forEach((row, r) => {
      expect(row).not.toBe(b.cells[r]);
      row.forEach((cell, c) => expect(cell).not.toBe(b.cells[r]?.[c]));
    });
  });
});
