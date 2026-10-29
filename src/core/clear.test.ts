// Clearing the Selected cell: Delete/Backspace clear one layer chosen by the Entry mode, X clears
// everything, and a Given is never cleared (TASK-8, AC #2-#8; keymap.md §5).
// Pure core logic. Uses Vitest globals so this file imports only from src/core/.
// New core API assumed by these tests (in ./clear):
//   clearLayer(puzzle, position, mode: EntryMode): Puzzle   Delete/Backspace in an Entry mode
//   clearCell(puzzle, position): Puzzle                     X, in any Entry mode
// Both return a new Puzzle and leave the old one untouched, like fillDigit. The UI passes clearLayer the
// active Entry mode (the chord's while a letter is held, else the Sticky mode: activeEntryMode in ./chord).
//
// "Does nothing" tests each first show the same call clearing an ordinary cell, so they cannot pass
// before clearing exists.
import { centerMarksOf, cornerMarksOf, toggleCenterMark, toggleCornerMark } from './candidates';
import { clearCell, clearLayer } from './clear';
import type { EntryMode } from './entry-mode';
import { fillDigit } from './fill';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, isEmptyCell, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

const at = (row: number, column: number): Position => ({ row, column });

const cellOf = (puzzle: Puzzle, position: Position): Cell => {
  const cell = puzzle.cells[position.row]?.[position.column];
  if (cell === undefined) throw new Error(`no cell at ${position.row}, ${position.column}`);
  return cell;
};

const toggleAll = (
  toggle: (puzzle: Puzzle, position: Position, digit: Digit) => Puzzle,
  puzzle: Puzzle,
  position: Position,
  digits: readonly Digit[],
): Puzzle => digits.reduce((current, digit) => toggle(current, position, digit), puzzle);

const P = at(4, 4);
const MODES: readonly EntryMode[] = ['fill', 'center', 'corner'];

/** Center marks 1 4 7 and Corner marks 2 8 at P. */
function withBothMarks(base: Puzzle = createEmptyPuzzle()): Puzzle {
  return toggleAll(toggleCornerMark, toggleAll(toggleCenterMark, base, P, [1, 4, 7]), P, [2, 8]);
}

/** Center marks 1 4 7 and Corner marks 2 8 at P, hidden under Placed digit 5. */
const placedOverBothMarks = (): Puzzle => fillDigit(withBothMarks(), P, 5);

/** Placed digit 5 at P, hiding nothing. */
const placedAlone = (): Puzzle => fillDigit(createEmptyPuzzle(), P, 5);

/** A Puzzle with one Given: 3 at row 1, column 3 (and nothing else). */
function puzzleWithGiven(): Puzzle {
  const result = parsePuzzle('..3'.padEnd(81, '.'));
  if (!result.ok) throw new Error('fixture does not parse');
  return result.puzzle;
}
const GIVEN = at(0, 2);

const otherCells = (puzzle: Puzzle, position: Position): Cell[] =>
  puzzle.cells.flatMap((row, r) => row.filter((_, c) => !(r === position.row && c === position.column)));

describe('Delete in fill mode removes the Placed digit (AC #2)', () => {
  it('removes a Placed digit hiding nothing, leaving the cell empty', () => {
    expect(cellOf(clearLayer(placedAlone(), P, 'fill'), P)).toEqual({ kind: 'empty' });
  });

  it('removing the Placed digit reveals its hidden Center marks and Corner marks unchanged', () => {
    const cell = cellOf(clearLayer(placedOverBothMarks(), P, 'fill'), P);
    expect(cell.kind).toBe('candidates');
    expect(centerMarksOf(cell)).toEqual([1, 4, 7]);
    expect(cornerMarksOf(cell)).toEqual([2, 8]);
  });

  it('the revealed cell is the same as before the digit was placed', () => {
    expect(clearLayer(placedOverBothMarks(), P, 'fill')).toEqual(withBothMarks());
  });

  it('on a cell with only Candidates (no Placed digit), Delete in fill mode does nothing', () => {
    expect(cellOf(clearLayer(placedAlone(), P, 'fill'), P)).toEqual({ kind: 'empty' }); // clearing is live
    const before = withBothMarks();
    expect(clearLayer(before, P, 'fill')).toEqual(before);
  });

  it('on an empty cell, Delete in fill mode does nothing', () => {
    expect(cellOf(clearLayer(placedAlone(), P, 'fill'), P)).toEqual({ kind: 'empty' }); // clearing is live
    expect(clearLayer(createEmptyPuzzle(), P, 'fill')).toEqual(createEmptyPuzzle());
  });
});

describe('Delete in center mode removes all Center marks in the cell and leaves its Corner marks (AC #3)', () => {
  it('removes Center marks 1 4 7 and keeps Corner marks 2 8', () => {
    const cell = cellOf(clearLayer(withBothMarks(), P, 'center'), P);
    expect(centerMarksOf(cell)).toEqual([]);
    expect(cornerMarksOf(cell)).toEqual([2, 8]);
  });

  it('clearing the last Candidates leaves the cell truly empty', () => {
    const onlyCenter = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [3, 6]);
    const cell = cellOf(clearLayer(onlyCenter, P, 'center'), P);
    expect(cell).toEqual({ kind: 'empty' });
    expect(isEmptyCell(cell)).toBe(true);
  });

  it('on a cell with only Corner marks, Delete in center mode leaves them as they were', () => {
    expect(centerMarksOf(cellOf(clearLayer(withBothMarks(), P, 'center'), P))).toEqual([]); // clearing is live
    const onlyCorner = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [2, 8]);
    expect(clearLayer(onlyCorner, P, 'center')).toEqual(onlyCorner);
  });
});

describe('Delete in corner mode removes all Corner marks in the cell and leaves its Center marks (AC #4)', () => {
  it('removes Corner marks 2 8 and keeps Center marks 1 4 7', () => {
    const cell = cellOf(clearLayer(withBothMarks(), P, 'corner'), P);
    expect(cornerMarksOf(cell)).toEqual([]);
    expect(centerMarksOf(cell)).toEqual([1, 4, 7]);
  });

  it('clearing the last Candidates leaves the cell truly empty', () => {
    const onlyCorner = toggleAll(toggleCornerMark, createEmptyPuzzle(), P, [2, 8]);
    const cell = cellOf(clearLayer(onlyCorner, P, 'corner'), P);
    expect(cell).toEqual({ kind: 'empty' });
    expect(isEmptyCell(cell)).toBe(true);
  });

  it('on a cell with only Center marks, Delete in corner mode leaves them as they were', () => {
    expect(cornerMarksOf(cellOf(clearLayer(withBothMarks(), P, 'corner'), P))).toEqual([]); // clearing is live
    const onlyCenter = toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 4, 7]);
    expect(clearLayer(onlyCenter, P, 'corner')).toEqual(onlyCenter);
  });
});

describe('On a cell holding a Placed digit, Delete in center or corner mode does nothing and the hidden Candidates are kept (AC #5)', () => {
  it.each(['center', 'corner'] as const)('in %s mode, the Placed digit and its hidden Candidates stay as they were', (mode) => {
    // Clearing in this mode is live on the same marks once they are not hidden.
    expect(clearLayer(withBothMarks(), P, mode)).not.toEqual(withBothMarks());
    const before = placedOverBothMarks();
    expect(clearLayer(before, P, mode)).toEqual(before);
  });

  it.each(['center', 'corner'] as const)('after Delete in %s mode, removing the Placed digit reveals all its Candidates', (mode) => {
    const afterDelete = clearLayer(placedOverBothMarks(), P, mode);
    const revealed = cellOf(clearLayer(afterDelete, P, 'fill'), P);
    expect(revealed.kind).toBe('candidates'); // the Placed digit is gone, so the marks are showing
    expect(centerMarksOf(revealed)).toEqual([1, 4, 7]);
    expect(cornerMarksOf(revealed)).toEqual([2, 8]);
  });
});

describe('X clears everything from the Selected cell, in any Entry mode (AC #6)', () => {
  it('a Placed digit with hidden Center marks and Corner marks becomes an empty cell', () => {
    expect(cellOf(clearCell(placedOverBothMarks(), P), P)).toEqual({ kind: 'empty' });
  });

  it('a Placed digit hiding nothing becomes an empty cell', () => {
    expect(cellOf(clearCell(placedAlone(), P), P)).toEqual({ kind: 'empty' });
  });

  it('a cell with Center marks and Corner marks becomes an empty cell', () => {
    expect(cellOf(clearCell(withBothMarks(), P), P)).toEqual({ kind: 'empty' });
  });

  it('after X, placing and removing a digit reveals no Candidates (the hidden ones are gone)', () => {
    const cleared = clearCell(placedOverBothMarks(), P);
    expect(cellOf(fillDigit(fillDigit(cleared, P, 5), P, 5), P)).toEqual({ kind: 'empty' });
  });

  it('an empty cell stays empty', () => {
    expect(cellOf(clearCell(placedAlone(), P), P)).toEqual({ kind: 'empty' }); // X is live
    expect(clearCell(createEmptyPuzzle(), P)).toEqual(createEmptyPuzzle());
  });
});

describe('On a Given, neither Delete/Backspace nor X does anything (AC #7)', () => {
  /** The Given puzzle plus, at P, something the mode does clear: a Placed digit for fill, marks otherwise. */
  const clearableAtP = (mode: EntryMode): Puzzle =>
    mode === 'fill' ? fillDigit(withBothMarks(puzzleWithGiven()), P, 5) : withBothMarks(puzzleWithGiven());

  it.each(MODES)('Delete in %s mode leaves the Given as it was', (mode) => {
    const puzzle = clearableAtP(mode);
    expect(clearLayer(puzzle, P, mode)).not.toEqual(puzzle); // clearing in this mode is live
    expect(clearLayer(puzzle, GIVEN, mode)).toEqual(puzzle);
    expect(cellOf(clearLayer(puzzle, GIVEN, mode), GIVEN)).toEqual({ kind: 'given', digit: 3 });
  });

  it('X leaves the Given as it was', () => {
    const puzzle = clearableAtP('fill');
    expect(cellOf(clearCell(puzzle, P), P)).toEqual({ kind: 'empty' }); // X is live
    expect(clearCell(puzzle, GIVEN)).toEqual(puzzle);
    expect(cellOf(clearCell(puzzle, GIVEN), GIVEN)).toEqual({ kind: 'given', digit: 3 });
  });
});

describe('Clearing changes only the Selected cell and leaves the old Puzzle untouched (AC #8)', () => {
  /** P holds a Placed digit over marks; row 1, column 1 holds Placed digit 9; row 9, column 9 Center mark 6. */
  const busy = (): Puzzle => toggleCenterMark(fillDigit(placedOverBothMarks(), at(0, 0), 9), at(8, 8), 6);
  /** As busy, but P's marks are not hidden under a Placed digit. */
  const busyMarks = (): Puzzle => toggleCenterMark(fillDigit(withBothMarks(), at(0, 0), 9), at(8, 8), 6);

  it.each(MODES)('Delete in %s mode changes no other cell', (mode) => {
    const puzzle = mode === 'fill' ? busy() : busyMarks();
    const next = clearLayer(puzzle, P, mode);
    expect(next).not.toEqual(puzzle); // something was cleared
    expect(otherCells(next, P)).toEqual(otherCells(puzzle, P));
  });

  it('X changes no other cell', () => {
    const next = clearCell(busy(), P);
    expect(cellOf(next, P)).toEqual({ kind: 'empty' });
    expect(otherCells(next, P)).toEqual(otherCells(busy(), P));
  });

  it.each(MODES)('Delete in %s mode leaves the Puzzle it was given as it was', (mode) => {
    const before = mode === 'fill' ? placedOverBothMarks() : withBothMarks();
    const copy = structuredClone(before);
    expect(clearLayer(before, P, mode)).not.toEqual(copy);
    expect(before).toEqual(copy);
  });

  it('X leaves the Puzzle it was given as it was', () => {
    const before = placedOverBothMarks();
    const copy = structuredClone(before);
    expect(clearCell(before, P)).not.toEqual(copy);
    expect(before).toEqual(copy);
  });
});
