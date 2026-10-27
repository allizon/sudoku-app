// Candidates: Center marks and Corner marks, and how a Placed digit hides them
// (TASK-6, AC #4, #5, #6, #8, #9, #10, #11, #12; keymap.md §2, §7).
// Pure core logic. New core API assumed by these tests (in ./candidates):
//   toggleCenterMark(puzzle, position, digit): Puzzle   (returns a new Puzzle; never mutates)
//   toggleCornerMark(puzzle, position, digit): Puzzle   (returns a new Puzzle; never mutates)
//   centerMarksOf(cell): readonly Digit[]   the cell's Center marks, ascending
//   cornerMarksOf(cell): readonly Digit[]   the cell's Corner marks, ascending
// Both readers include Candidates hidden under a Placed digit: a cell's Candidates
// are hidden exactly when it holds a Placed digit (kind 'placed').
import { centerMarksOf, cornerMarksOf, toggleCenterMark, toggleCornerMark } from './candidates';
import { fillDigit } from './fill';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, isEmptyCell, isEmptyPuzzle, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

const at = (row: number, column: number): Position => ({ row, column });

const cellOf = (puzzle: Puzzle, position: Position): Cell => {
  const cell = puzzle.cells[position.row]?.[position.column];
  if (cell === undefined) throw new Error(`no cell at ${position.row}, ${position.column}`);
  return cell;
};

const placedDigitOf = (cell: Cell): Digit | undefined => (cell.kind === 'placed' ? cell.digit : undefined);

/** Applies a toggle for each digit in turn. */
function toggleAll(
  toggle: (puzzle: Puzzle, position: Position, digit: Digit) => Puzzle,
  puzzle: Puzzle,
  position: Position,
  digits: readonly Digit[],
): Puzzle {
  return digits.reduce((current, digit) => toggle(current, position, digit), puzzle);
}

/** A Puzzle with one Given: 3 at row 1, column 3 (and nothing else). */
function puzzleWithGiven(): Puzzle {
  const result = parsePuzzle('..3'.padEnd(81, '.'));
  if (!result.ok) throw new Error('fixture does not parse');
  return result.puzzle;
}

/** Every cell other than the one at a position. */
const otherCells = (puzzle: Puzzle, position: Position): Cell[] =>
  puzzle.cells.flatMap((row, r) => row.filter((_, c) => !(r === position.row && c === position.column)));

const P = at(4, 4);

describe('Center mark: toggling a digit as a Center mark in the Selected cell (AC #4)', () => {
  it('an empty cell has no Center marks', () => {
    expect(centerMarksOf(cellOf(createEmptyPuzzle(), P))).toEqual([]);
  });

  it('toggling 5 on an empty cell adds a Center mark 5', () => {
    expect(centerMarksOf(cellOf(toggleCenterMark(createEmptyPuzzle(), P, 5), P))).toEqual([5]);
  });

  it('toggling 5 adds no Placed digit and no Corner mark', () => {
    const cell = cellOf(toggleCenterMark(createEmptyPuzzle(), P, 5), P);
    expect(centerMarksOf(cell)).toEqual([5]);
    expect(placedDigitOf(cell)).toBeUndefined();
    expect(cornerMarksOf(cell)).toEqual([]);
  });

  it('several digits can be Center marks in one cell, read in ascending order', () => {
    const puzzle = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [7, 1, 4]);
    expect(centerMarksOf(cellOf(puzzle, P))).toEqual([1, 4, 7]);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9] as const)('%i can be a Center mark', (digit) => {
    expect(centerMarksOf(cellOf(toggleCenterMark(createEmptyPuzzle(), P, digit), P))).toEqual([digit]);
  });

  it('all nine digits can be Center marks at once', () => {
    const puzzle = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(centerMarksOf(cellOf(puzzle, P))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('toggling a Center mark that is there removes it, leaving the others', () => {
    const puzzle = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 4, 7, 4]);
    expect(centerMarksOf(cellOf(puzzle, P))).toEqual([1, 7]);
  });

  it('toggling the only Center mark off leaves the cell empty again', () => {
    expect(isEmptyCell(cellOf(toggleCenterMark(createEmptyPuzzle(), P, 5), P))).toBe(false);
    const puzzle = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [5, 5]);
    expect(isEmptyCell(cellOf(puzzle, P))).toBe(true);
    expect(isEmptyPuzzle(puzzle)).toBe(true);
  });

  it('changes no other cell', () => {
    const puzzle = toggleCenterMark(createEmptyPuzzle(), P, 5);
    expect(centerMarksOf(cellOf(puzzle, P))).toEqual([5]);
    expect(otherCells(puzzle, P).every(isEmptyCell)).toBe(true);
  });

  it('leaves the Puzzle it was given as it was', () => {
    const before = createEmptyPuzzle();
    expect(toggleCenterMark(before, P, 5)).not.toEqual(createEmptyPuzzle());
    expect(before).toEqual(createEmptyPuzzle());
  });
});

describe('Corner mark: toggling a digit as a Corner mark in the Selected cell (AC #5)', () => {
  it('an empty cell has no Corner marks', () => {
    expect(cornerMarksOf(cellOf(createEmptyPuzzle(), P))).toEqual([]);
  });

  it('toggling 5 on an empty cell adds a Corner mark 5', () => {
    expect(cornerMarksOf(cellOf(toggleCornerMark(createEmptyPuzzle(), P, 5), P))).toEqual([5]);
  });

  it('toggling 5 adds no Placed digit and no Center mark', () => {
    const cell = cellOf(toggleCornerMark(createEmptyPuzzle(), P, 5), P);
    expect(cornerMarksOf(cell)).toEqual([5]);
    expect(placedDigitOf(cell)).toBeUndefined();
    expect(centerMarksOf(cell)).toEqual([]);
  });

  it('several digits can be Corner marks in one cell, read in ascending order', () => {
    const puzzle = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [8, 2, 6]);
    expect(cornerMarksOf(cellOf(puzzle, P))).toEqual([2, 6, 8]);
  });

  it('all nine digits can be Corner marks at once', () => {
    const puzzle = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(cornerMarksOf(cellOf(puzzle, P))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('toggling a Corner mark that is there removes it, leaving the others', () => {
    const puzzle = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [2, 6, 8, 6]);
    expect(cornerMarksOf(cellOf(puzzle, P))).toEqual([2, 8]);
  });

  it('toggling the only Corner mark off leaves the cell empty again', () => {
    expect(isEmptyCell(cellOf(toggleCornerMark(createEmptyPuzzle(), P, 5), P))).toBe(false);
    const puzzle = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [5, 5]);
    expect(isEmptyCell(cellOf(puzzle, P))).toBe(true);
    expect(isEmptyPuzzle(puzzle)).toBe(true);
  });

  it('changes no other cell', () => {
    const puzzle = toggleCornerMark(createEmptyPuzzle(), P, 5);
    expect(cornerMarksOf(cellOf(puzzle, P))).toEqual([5]);
    expect(otherCells(puzzle, P).every(isEmptyCell)).toBe(true);
  });

  it('leaves the Puzzle it was given as it was', () => {
    const before = createEmptyPuzzle();
    expect(toggleCornerMark(before, P, 5)).not.toEqual(createEmptyPuzzle());
    expect(before).toEqual(createEmptyPuzzle());
  });
});

describe('Candidates: a cell can hold Center marks and Corner marks at the same time (AC #6)', () => {
  it('Center marks 1, 2 and Corner marks 3, 9 sit in one cell together', () => {
    const centers = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 2]);
    const both = toggleAll(toggleCornerMark, centers, P, [3, 9]);
    expect(centerMarksOf(cellOf(both, P))).toEqual([1, 2]);
    expect(cornerMarksOf(cellOf(both, P))).toEqual([3, 9]);
  });

  it('the same digit can be both a Center mark and a Corner mark', () => {
    const both = toggleCornerMark(toggleCenterMark(createEmptyPuzzle(), P, 5), P, 5);
    expect(centerMarksOf(cellOf(both, P))).toEqual([5]);
    expect(cornerMarksOf(cellOf(both, P))).toEqual([5]);
  });

  it('toggling a Center mark off leaves the Corner marks alone', () => {
    const both = toggleCornerMark(toggleCenterMark(createEmptyPuzzle(), P, 5), P, 5);
    const after = toggleCenterMark(both, P, 5);
    expect(centerMarksOf(cellOf(after, P))).toEqual([]);
    expect(cornerMarksOf(cellOf(after, P))).toEqual([5]);
  });

  it('toggling a Corner mark off leaves the Center marks alone', () => {
    const both = toggleCornerMark(toggleCenterMark(createEmptyPuzzle(), P, 5), P, 5);
    const after = toggleCornerMark(both, P, 5);
    expect(centerMarksOf(cellOf(after, P))).toEqual([5]);
    expect(cornerMarksOf(cellOf(after, P))).toEqual([]);
  });

  it('a cell holding only Candidates is not empty, so the Puzzle is not empty either', () => {
    const marked = toggleCornerMark(createEmptyPuzzle(), P, 5);
    expect(isEmptyCell(cellOf(marked, P))).toBe(false);
    expect(isEmptyPuzzle(marked)).toBe(false);
  });
});

describe('Candidates: a digit on a Given or a Placed digit adds no Candidate (AC #8)', () => {
  it.each([
    ['toggleCenterMark', toggleCenterMark],
    ['toggleCornerMark', toggleCornerMark],
  ] as const)('%s on a Given leaves the whole Puzzle unchanged', (_name, toggle) => {
    const puzzle = puzzleWithGiven();
    // The same toggle on an empty cell does change the Puzzle, so "unchanged" below means something.
    expect(toggle(puzzle, at(0, 0), 5)).not.toEqual(puzzle);
    expect(toggle(puzzle, at(0, 2), 5)).toEqual(puzzle);
    expect(toggle(puzzle, at(0, 2), 3)).toEqual(puzzle);
  });

  it('a Given has no Candidates', () => {
    const cell = cellOf(puzzleWithGiven(), at(0, 2));
    expect(centerMarksOf(cell)).toEqual([]);
    expect(cornerMarksOf(cell)).toEqual([]);
  });

  it.each([
    ['toggleCenterMark', toggleCenterMark],
    ['toggleCornerMark', toggleCornerMark],
  ] as const)('%s on a Placed digit leaves the whole Puzzle unchanged', (_name, toggle) => {
    const puzzle = fillDigit(createEmptyPuzzle(), P, 6);
    expect(toggle(puzzle, at(0, 0), 2)).not.toEqual(puzzle);
    expect(toggle(puzzle, P, 2)).toEqual(puzzle);
    expect(toggle(puzzle, P, 6)).toEqual(puzzle);
  });

  it.each([
    ['toggleCenterMark', toggleCenterMark],
    ['toggleCornerMark', toggleCornerMark],
  ] as const)('%s on a Placed digit neither adds nor removes hidden Candidates', (_name, toggle) => {
    const marked = toggleCornerMark(toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 2]), P, 3);
    expect(centerMarksOf(cellOf(marked, P))).toEqual([1, 2]);
    const placed = fillDigit(marked, P, 6);
    const after = toggleAll(toggle, placed, P, [1, 3, 4]);
    expect(after).toEqual(placed);
    expect(centerMarksOf(cellOf(after, P))).toEqual([1, 2]);
    expect(cornerMarksOf(cellOf(after, P))).toEqual([3]);
  });
});

/** A cell at P with Center marks 1, 4, 7 and Corner marks 2, 8 (checked, so no test below passes on an empty cell). */
function markedPuzzle(): Puzzle {
  const puzzle = toggleAll(toggleCornerMark, toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 4, 7]), P, [2, 8]);
  expect(centerMarksOf(cellOf(puzzle, P))).toEqual([1, 4, 7]);
  expect(cornerMarksOf(cellOf(puzzle, P))).toEqual([2, 8]);
  return puzzle;
}

describe('Candidates: placing a digit in fill mode hides them without deleting them (AC #9)', () => {
  it('fillDigit on a cell with Candidates places the digit', () => {
    expect(placedDigitOf(cellOf(fillDigit(markedPuzzle(), P, 5), P))).toBe(5);
  });

  it('the Center marks are kept under the Placed digit', () => {
    expect(centerMarksOf(cellOf(fillDigit(markedPuzzle(), P, 5), P))).toEqual([1, 4, 7]);
  });

  it('the Corner marks are kept under the Placed digit', () => {
    expect(cornerMarksOf(cellOf(fillDigit(markedPuzzle(), P, 5), P))).toEqual([2, 8]);
  });

  it('placing a digit that is also one of the Candidates keeps that Candidate too', () => {
    const cell = cellOf(fillDigit(markedPuzzle(), P, 4), P);
    expect(placedDigitOf(cell)).toBe(4);
    expect(centerMarksOf(cell)).toEqual([1, 4, 7]);
  });

  it('leaves the Puzzle it was given as it was', () => {
    const before = markedPuzzle();
    fillDigit(before, P, 5);
    expect(before).toEqual(markedPuzzle());
  });
});

describe('Candidates: removing that Placed digit (toggle) makes the hidden Candidates reappear unchanged (AC #10)', () => {
  it('placing 5 then pressing 5 again leaves no Placed digit', () => {
    const removed = fillDigit(fillDigit(markedPuzzle(), P, 5), P, 5);
    expect(placedDigitOf(cellOf(removed, P))).toBeUndefined();
  });

  it('the Center marks and Corner marks are back exactly as they were', () => {
    const removed = fillDigit(fillDigit(markedPuzzle(), P, 5), P, 5);
    expect(centerMarksOf(cellOf(removed, P))).toEqual([1, 4, 7]);
    expect(cornerMarksOf(cellOf(removed, P))).toEqual([2, 8]);
  });

  it('the whole Puzzle is back as it was before the digit was placed', () => {
    expect(fillDigit(fillDigit(markedPuzzle(), P, 5), P, 5)).toEqual(markedPuzzle());
  });

  it('the reappeared Candidates can be toggled again as usual', () => {
    const removed = fillDigit(fillDigit(markedPuzzle(), P, 5), P, 5);
    expect(centerMarksOf(cellOf(toggleCenterMark(removed, P, 4), P))).toEqual([1, 7]);
    expect(cornerMarksOf(cellOf(toggleCornerMark(removed, P, 5), P))).toEqual([2, 5, 8]);
  });
});

describe('Candidates: replacing that Placed digit with another keeps the Candidates hidden (AC #11)', () => {
  it('after replacing 5 with 6, the cell holds Placed digit 6', () => {
    expect(placedDigitOf(cellOf(fillDigit(fillDigit(markedPuzzle(), P, 5), P, 6), P))).toBe(6);
  });

  it('the Candidates are still kept, hidden under the new Placed digit', () => {
    const cell = cellOf(fillDigit(fillDigit(markedPuzzle(), P, 5), P, 6), P);
    expect(centerMarksOf(cell)).toEqual([1, 4, 7]);
    expect(cornerMarksOf(cell)).toEqual([2, 8]);
  });

  it('removing the replacement digit brings the original Candidates back unchanged', () => {
    const replacedThenRemoved = fillDigit(fillDigit(fillDigit(markedPuzzle(), P, 5), P, 6), P, 6);
    expect(placedDigitOf(cellOf(replacedThenRemoved, P))).toBeUndefined();
    expect(replacedThenRemoved).toEqual(markedPuzzle());
  });
});
