// Entry modes: the Sticky mode, N's cycle, and what a digit does in each Entry mode
// (TASK-6, AC #1, #2, #4, #5, #8, #12; keymap.md §2, §7).
// Pure core logic. New core API assumed by these tests:
//   type EntryMode = 'fill' | 'center' | 'corner'                       in ./entry-mode
//   INITIAL_ENTRY_MODE: EntryMode                                       in ./entry-mode
//   nextEntryMode(mode): EntryMode   (what N does to the Sticky mode)   in ./entry-mode
//   enterDigit(puzzle, position, mode, digit): Puzzle                   in ./entry-mode
//     (a digit key in that Entry mode; returns a new Puzzle, never mutates)
//   centerMarksOf(cell) / cornerMarksOf(cell): readonly Digit[]         in ./candidates
//     (the cell's Center marks / Corner marks in ascending order, hidden ones included)
import { centerMarksOf, cornerMarksOf } from './candidates';
import { enterDigit, INITIAL_ENTRY_MODE, nextEntryMode, type EntryMode } from './entry-mode';
import { fillDigit } from './fill';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, type Cell, type Puzzle } from './puzzle';
import type { Position } from './selection';

const at = (row: number, column: number): Position => ({ row, column });

const cellOf = (puzzle: Puzzle, position: Position): Cell => {
  const cell = puzzle.cells[position.row]?.[position.column];
  if (cell === undefined) throw new Error(`no cell at ${position.row}, ${position.column}`);
  return cell;
};

/** A Puzzle with one Given: 3 at row 1, column 3 (and nothing else). */
function puzzleWithGiven(): Puzzle {
  const result = parsePuzzle('..3'.padEnd(81, '.'));
  if (!result.ok) throw new Error('fixture does not parse');
  return result.puzzle;
}

describe('Entry mode: the app starts in fill mode (AC #1)', () => {
  it('the initial Entry mode is fill', () => {
    expect(INITIAL_ENTRY_MODE).toBe('fill');
  });
});

describe('Sticky mode: N cycles fill → center → corner → fill (AC #2)', () => {
  it('fill is followed by center', () => {
    expect(nextEntryMode('fill')).toBe('center');
  });

  it('center is followed by corner', () => {
    expect(nextEntryMode('center')).toBe('corner');
  });

  it('corner is followed by fill', () => {
    expect(nextEntryMode('corner')).toBe('fill');
  });

  it.each(['fill', 'center', 'corner'] as const)('from %s, one press of N changes the mode and three come back to it', (mode) => {
    expect(nextEntryMode(mode)).not.toBe(mode);
    expect(nextEntryMode(nextEntryMode(nextEntryMode(mode)))).toBe(mode);
  });

  it('the cycle visits all three Entry modes', () => {
    const seen = new Set<EntryMode>();
    let mode: EntryMode = INITIAL_ENTRY_MODE;
    for (let i = 0; i < 3; i += 1) {
      seen.add(mode);
      mode = nextEntryMode(mode);
    }
    expect([...seen].sort()).toEqual(['center', 'corner', 'fill']);
  });
});

describe('Entry mode: in fill mode a digit key places the digit (keymap.md §2)', () => {
  it('enterDigit in fill mode places the digit, as fillDigit does', () => {
    const next = enterDigit(createEmptyPuzzle(), at(4, 5), 'fill', 7);
    expect(next).toEqual(fillDigit(createEmptyPuzzle(), at(4, 5), 7));
    expect(cellOf(next, at(4, 5)).kind).toBe('placed');
  });

  it('enterDigit in fill mode adds no Candidates', () => {
    const cell = cellOf(enterDigit(createEmptyPuzzle(), at(4, 5), 'fill', 7), at(4, 5));
    expect(centerMarksOf(cell)).toEqual([]);
    expect(cornerMarksOf(cell)).toEqual([]);
  });
});

describe('Entry mode: in center mode a digit key toggles a Center mark (AC #4)', () => {
  it('enterDigit in center mode adds that digit as a Center mark', () => {
    const cell = cellOf(enterDigit(createEmptyPuzzle(), at(2, 6), 'center', 4), at(2, 6));
    expect(centerMarksOf(cell)).toEqual([4]);
  });

  it('enterDigit in center mode places no digit and adds no Corner mark', () => {
    const cell = cellOf(enterDigit(createEmptyPuzzle(), at(2, 6), 'center', 4), at(2, 6));
    expect(cell.kind).not.toBe('placed');
    expect(cornerMarksOf(cell)).toEqual([]);
  });

  it('the same digit again in center mode removes the Center mark', () => {
    const once = enterDigit(createEmptyPuzzle(), at(2, 6), 'center', 4);
    expect(centerMarksOf(cellOf(once, at(2, 6)))).toEqual([4]);
    expect(centerMarksOf(cellOf(enterDigit(once, at(2, 6), 'center', 4), at(2, 6)))).toEqual([]);
  });
});

describe('Entry mode: in corner mode a digit key toggles a Corner mark (AC #5)', () => {
  it('enterDigit in corner mode adds that digit as a Corner mark', () => {
    const cell = cellOf(enterDigit(createEmptyPuzzle(), at(7, 1), 'corner', 9), at(7, 1));
    expect(cornerMarksOf(cell)).toEqual([9]);
  });

  it('enterDigit in corner mode places no digit and adds no Center mark', () => {
    const cell = cellOf(enterDigit(createEmptyPuzzle(), at(7, 1), 'corner', 9), at(7, 1));
    expect(cell.kind).not.toBe('placed');
    expect(centerMarksOf(cell)).toEqual([]);
  });

  it('the same digit again in corner mode removes the Corner mark', () => {
    const once = enterDigit(createEmptyPuzzle(), at(7, 1), 'corner', 9);
    expect(cornerMarksOf(cellOf(once, at(7, 1)))).toEqual([9]);
    expect(cornerMarksOf(cellOf(enterDigit(once, at(7, 1), 'corner', 9), at(7, 1)))).toEqual([]);
  });
});

describe('Entry mode: in center or corner mode a digit on a Given or a Placed digit does nothing (AC #8)', () => {
  it.each(['center', 'corner'] as const)('in %s mode, a digit on a Given leaves the whole Puzzle unchanged', (mode) => {
    const puzzle = puzzleWithGiven();
    // The same press on an empty cell does change the Puzzle, so "unchanged" below means something.
    expect(enterDigit(puzzle, at(0, 0), mode, 5)).not.toEqual(puzzle);
    expect(enterDigit(puzzle, at(0, 2), mode, 5)).toEqual(puzzle);
    expect(enterDigit(puzzle, at(0, 2), mode, 3)).toEqual(puzzle);
  });

  it.each(['center', 'corner'] as const)('in %s mode, a digit on a Placed digit leaves the whole Puzzle unchanged', (mode) => {
    const puzzle = fillDigit(createEmptyPuzzle(), at(3, 3), 6);
    expect(enterDigit(puzzle, at(3, 3), mode, 2)).toEqual(puzzle);
    expect(enterDigit(puzzle, at(3, 3), mode, 6)).toEqual(puzzle);
  });

  it.each(['center', 'corner'] as const)(
    'in %s mode, a digit on a Placed digit with hidden Candidates leaves them as they were',
    (mode) => {
      const marked = enterDigit(enterDigit(createEmptyPuzzle(), at(3, 3), 'center', 1), at(3, 3), 'corner', 2);
      expect(centerMarksOf(cellOf(marked, at(3, 3)))).toEqual([1]);
      const placed = fillDigit(marked, at(3, 3), 6);
      const after = enterDigit(enterDigit(placed, at(3, 3), mode, 1), at(3, 3), mode, 2);
      expect(after).toEqual(placed);
      expect(centerMarksOf(cellOf(after, at(3, 3)))).toEqual([1]);
      expect(cornerMarksOf(cellOf(after, at(3, 3)))).toEqual([2]);
    },
  );
});

describe('Entry mode: enterDigit returns a new Puzzle and leaves the old one untouched', () => {
  it.each(['fill', 'center', 'corner'] as const)('in %s mode the Puzzle it was given is unchanged', (mode) => {
    const before = createEmptyPuzzle();
    const after = enterDigit(before, at(1, 1), mode, 3);
    expect(after).not.toEqual(createEmptyPuzzle());
    expect(before).toEqual(createEmptyPuzzle());
  });
});
