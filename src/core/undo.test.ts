// Undo and redo: each change to the grid is one undo step, undo restores the changed cell exactly
// (including Candidates hidden under a Placed digit), each digit pressed during a chord is its own
// step, and a new change after undoing discards the redo history (TASK-16, AC #2, #3, #5, #6;
// keymap.md §6). Selection moves and Sticky-mode changes bypass the history entirely (AC #4) —
// they are never passed through here, which the keys are shown to do in src/ui/undo.test.tsx.
//
// Pure core logic. Uses Vitest globals so this file imports only from src/core/ (AC #7).
// New core API assumed by these tests (in ./undo — red until TASK-16 implements it):
//   History                          the undo and redo stacks, immutable; tests assume nothing
//                                    inside them but their length, so the entries' shape stays
//                                    the implementation's business
//   emptyHistory: History            a fresh Puzzle's history: nothing is undoable or redoable
//   applyWithUndo(history, puzzle, change): { puzzle: Puzzle; history: History }
//       runs change on the Puzzle; when the change alters a cell, records one step for it (onto
//       the undo stack, and the redo stack is cleared); when the change alters nothing — a digit
//       on a Given, Delete on an empty cell — it records no step at all
//   undo(history, puzzle) / redo(history, puzzle): { puzzle, history } | undefined
//       swap the recorded cell out of and into the Puzzle; undefined when the stack is empty,
//       which the app treats as "nothing to undo (or redo)" and leaves the page untouched
// Every grid change in this milestone alters exactly one cell (the 'placement + Elimination is
// one step' bundling of feedback.md §3 is a later ticket), so applyWithUndo is always called on
// a one-cell change and records one step { position, before }.
import { centerMarksOf, cornerMarksOf, toggleCenterMark, toggleCornerMark } from './candidates';
import { clearCell, clearLayer } from './clear';
import { fillDigit } from './fill';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, isEmptyCell, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';
import { applyWithUndo, emptyHistory, redo, undo, type History } from './undo';

const at = (row: number, column: number): Position => ({ row, column });

const P = at(4, 4);
const A = at(0, 0);
const B = at(1, 3);

const cellOf = (puzzle: Puzzle, position: Position): Cell => {
  const cell = puzzle.cells[position.row]?.[position.column];
  if (cell === undefined) throw new Error(`no cell at ${position.row}, ${position.column}`);
  return cell;
};

/** The Placed digit at a position, or undefined when the cell holds none. */
const placedAt = (puzzle: Puzzle, position: Position): Digit | undefined => {
  const cell = cellOf(puzzle, position);
  return cell.kind === 'placed' ? cell.digit : undefined;
};

/** Runs change with undo recording from an empty history. */
const apply = (puzzle: Puzzle, change: (current: Puzzle) => Puzzle) => applyWithUndo(emptyHistory, puzzle, change);

const requireUndo = (history: History, puzzle: Puzzle) => {
  const undone = undo(history, puzzle);
  if (undone === undefined) throw new Error('nothing to undo, but the history holds a step');
  return undone;
};

const requireRedo = (history: History, puzzle: Puzzle) => {
  const redone = redo(history, puzzle);
  if (redone === undefined) throw new Error('nothing to redo, but a step was undone');
  return redone;
};

const toggleAll = (
  toggle: (puzzle: Puzzle, position: Position, digit: Digit) => Puzzle,
  puzzle: Puzzle,
  position: Position,
  digits: readonly Digit[],
): Puzzle => digits.reduce((current, digit) => toggle(current, position, digit), puzzle);

/** Center marks 1 4 7 and Corner marks 2 8 at P. */
const withBothMarks = (): Puzzle =>
  toggleAll(toggleCornerMark, toggleAll(toggleCenterMark, createEmptyPuzzle(), P, [1, 4, 7]), P, [2, 8]);

/** As withBothMarks, with Placed digit 5 over the marks. */
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

describe('Every change to the grid records one undo step (AC #2)', () => {
  const CHANGES = [
    ['placing a digit', createEmptyPuzzle, (p: Puzzle) => fillDigit(p, P, 5)],
    ['removing a Placed digit (the same digit again)', placedAlone, (p: Puzzle) => fillDigit(p, P, 5)],
    ['replacing a Placed digit', placedAlone, (p: Puzzle) => fillDigit(p, P, 2)],
    ['toggling a Center mark on', createEmptyPuzzle, (p: Puzzle) => toggleCenterMark(p, P, 7)],
    ['toggling a Center mark off', withBothMarks, (p: Puzzle) => toggleCenterMark(p, P, 1)],
    ['toggling a Corner mark on', createEmptyPuzzle, (p: Puzzle) => toggleCornerMark(p, P, 2)],
    ['toggling a Corner mark off', withBothMarks, (p: Puzzle) => toggleCornerMark(p, P, 2)],
    ['one Delete in fill mode', placedOverBothMarks, (p: Puzzle) => clearLayer(p, P, 'fill')],
    ['one Delete in center mode', withBothMarks, (p: Puzzle) => clearLayer(p, P, 'center')],
    ['one Delete in corner mode', withBothMarks, (p: Puzzle) => clearLayer(p, P, 'corner')],
    ['one X', placedOverBothMarks, (p: Puzzle) => clearCell(p, P)],
  ] as const;

  it.each(CHANGES)('%s records one undo step', (_name, puzzle, change) => {
    expect(apply(puzzle(), change).history.undoStack).toHaveLength(1);
  });
});

describe('A change that alters nothing records no step (AC #2; keymap.md §5, §7)', () => {
  const NO_OPS = [
    ['a digit in fill mode on a Given', puzzleWithGiven, (p: Puzzle) => fillDigit(p, GIVEN, 4)],
    ['a digit in fill mode on the Given it already shows', puzzleWithGiven, (p: Puzzle) => fillDigit(p, GIVEN, 3)],
    ['Delete in fill mode on an empty cell', createEmptyPuzzle, (p: Puzzle) => clearLayer(p, P, 'fill')],
    ['Delete in fill mode on a cell with only Candidates', withBothMarks, (p: Puzzle) => clearLayer(p, P, 'fill')],
    ['Delete in center mode on a cell holding a Placed digit', placedOverBothMarks, (p: Puzzle) => clearLayer(p, P, 'center')],
    ['Delete in corner mode on a cell holding a Placed digit', placedOverBothMarks, (p: Puzzle) => clearLayer(p, P, 'corner')],
    ['X on a Given', puzzleWithGiven, (p: Puzzle) => clearCell(p, GIVEN)],
    ['X on an empty cell', createEmptyPuzzle, (p: Puzzle) => clearCell(p, P)],
    ['a digit in center mode on a cell holding a Placed digit', placedOverBothMarks, (p: Puzzle) => toggleCenterMark(p, P, 2)],
    ['a digit in corner mode on a cell holding a Placed digit', placedOverBothMarks, (p: Puzzle) => toggleCornerMark(p, P, 1)],
  ] as const;

  it.each(NO_OPS)('%s records no step and leaves the Puzzle as it was', (_name, puzzle, change) => {
    const before = puzzle();
    const applied = apply(before, change);
    expect(applied.puzzle).toEqual(before);
    expect(applied.history.undoStack).toHaveLength(0);
  });
});

describe('Undo restores the changed cell exactly, including hidden Candidates and Corner marks (AC #5)', () => {
  it('undoing a placement restores the Candidates hidden under the Placed digit', () => {
    const placed = apply(withBothMarks(), (p) => fillDigit(p, P, 5));
    const undone = requireUndo(placed.history, placed.puzzle);
    expect(undone.puzzle).toEqual(withBothMarks());
    expect(placed.history.undoStack).toHaveLength(1); // one placement, one step
  });

  it('undoing a replacement restores the earlier Placed digit with its hidden Candidates', () => {
    const replaced = apply(placedOverBothMarks(), (p) => fillDigit(p, P, 2));
    expect(cellOf(replaced.puzzle, P)).toEqual({
      kind: 'placed',
      digit: 2,
      candidates: { centerMarks: [1, 4, 7], cornerMarks: [2, 8] }, // the Candidates changed hands, unchanged
    });
    const undone = requireUndo(replaced.history, replaced.puzzle);
    expect(undone.puzzle).toEqual(placedOverBothMarks());
  });

  it('undoing X brings everything back (keymap.md §6)', () => {
    const cleared = apply(placedOverBothMarks(), (p) => clearCell(p, P));
    expect(isEmptyCell(cellOf(cleared.puzzle, P))).toBe(true);
    const undone = requireUndo(cleared.history, cleared.puzzle);
    expect(undone.puzzle).toEqual(placedOverBothMarks());
  });

  it('undoing Delete in fill mode re-hides the Candidates under the Placed digit', () => {
    const cleared = apply(placedOverBothMarks(), (p) => clearLayer(p, P, 'fill'));
    expect(placedAt(cleared.puzzle, P)).toBeUndefined();
    const undone = requireUndo(cleared.history, cleared.puzzle);
    expect(undone.puzzle).toEqual(placedOverBothMarks());
  });

  it('undoing a mark toggle restores the Center and Corner marks exactly', () => {
    const toggled = apply(withBothMarks(), (p) => toggleCornerMark(p, P, 2));
    expect(cornerMarksOf(cellOf(toggled.puzzle, P))).toEqual([8]);
    expect(centerMarksOf(cellOf(toggled.puzzle, P))).toEqual([1, 4, 7]);
    const undone = requireUndo(toggled.history, toggled.puzzle);
    expect(undone.puzzle).toEqual(withBothMarks());
  });

  it('undo restores the whole Puzzle, changing no other cell', () => {
    const busy = toggleCenterMark(fillDigit(placedOverBothMarks(), A, 9), at(8, 8), 6);
    const changed = apply(busy, (p) => fillDigit(p, P, 2));
    const undone = requireUndo(changed.history, changed.puzzle);
    expect(undone.puzzle).toEqual(busy);
  });
});

describe('Undo and redo swap the changed cell out of and into the Puzzle (AC #1 at the engine level; the keys are in src/ui/undo.test.tsx)', () => {
  it('undo takes the change back, redo puts it back, and the cycle repeats', () => {
    const placed = apply(createEmptyPuzzle(), (p) => fillDigit(p, P, 5));
    const undone = requireUndo(placed.history, placed.puzzle);
    expect(placedAt(undone.puzzle, P)).toBeUndefined();
    const redone = requireRedo(undone.history, undone.puzzle);
    expect(redone.puzzle).toEqual(placed.puzzle);
    const undoneAgain = requireUndo(redone.history, redone.puzzle);
    expect(undoneAgain.puzzle).toEqual(undone.puzzle);
  });

  it('undo with an empty history is undefined: nothing for the app to do', () => {
    expect(undo(emptyHistory, placedOverBothMarks())).toBeUndefined();
  });

  it('redo with nothing undone is undefined', () => {
    const placed = apply(placedOverBothMarks(), (p) => clearCell(p, P));
    expect(redo(placed.history, placed.puzzle)).toBeUndefined();
  });

  it('the redo stack keeps every undone change until it is used or discarded', () => {
    const first = apply(createEmptyPuzzle(), (p) => fillDigit(p, A, 5));
    const second = applyWithUndo(first.history, first.puzzle, (p) => fillDigit(p, B, 3));
    const undone = requireUndo(second.history, second.puzzle);
    expect(placedAt(undone.puzzle, B)).toBeUndefined();
    const undoneTwice = requireUndo(undone.history, undone.puzzle);
    expect(placedAt(undoneTwice.puzzle, A)).toBeUndefined();
    const redone = requireRedo(undoneTwice.history, undoneTwice.puzzle);
    expect(placedAt(redone.puzzle, A)).toBe(5); // redo returns them in the order they were undone
    const redoneTwice = requireRedo(redone.history, redone.puzzle);
    expect(placedAt(redoneTwice.puzzle, B)).toBe(3);
  });
});

describe('Each digit pressed during a chord is its own step (AC #3)', () => {
  it('three marks toggled in a row undo in reverse: the third, then the second, then the first', () => {
    // Holding C makes each digit press one Center toggle (keymap.md §3), a step each.
    const chorded = ([1, 2, 3] as const).reduce(
      (current, digit) => applyWithUndo(current.history, current.puzzle, (p) => toggleCenterMark(p, P, digit)),
      { puzzle: createEmptyPuzzle(), history: emptyHistory },
    );
    expect(centerMarksOf(cellOf(chorded.puzzle, P))).toEqual([1, 2, 3]);
    expect(chorded.history.undoStack).toHaveLength(3);

    const undoneOnce = requireUndo(chorded.history, chorded.puzzle);
    expect(centerMarksOf(cellOf(undoneOnce.puzzle, P))).toEqual([1, 2]);
    const undoneTwice = requireUndo(undoneOnce.history, undoneOnce.puzzle);
    expect(centerMarksOf(cellOf(undoneTwice.puzzle, P))).toEqual([1]);
    const undoneThrice = requireUndo(undoneTwice.history, undoneTwice.puzzle);
    expect(isEmptyCell(cellOf(undoneThrice.puzzle, P))).toBe(true);
    expect(undo(undoneThrice.history, undoneThrice.puzzle)).toBeUndefined();
  });
});

describe('A new change after undoing discards the redo history (AC #6; keymap.md §6)', () => {
  it('redo is undefined once a new change was made after undoing', () => {
    const placed = apply(createEmptyPuzzle(), (p) => fillDigit(p, A, 5));
    const undone = requireUndo(placed.history, placed.puzzle);
    const changed = applyWithUndo(undone.history, undone.puzzle, (p) => fillDigit(p, B, 3));
    expect(redo(changed.history, changed.puzzle)).toBeUndefined();
    // The discarded change is gone for good: undoing thrice never brings the first digit back.
    const undoneOnce = requireUndo(changed.history, changed.puzzle);
    const undoneTwice = requireUndo(undoneOnce.history, undoneOnce.puzzle);
    expect(placedAt(undoneTwice.puzzle, B)).toBeUndefined();
    expect(placedAt(undoneTwice.puzzle, A)).toBeUndefined();
    expect(undo(undoneTwice.history, undoneTwice.puzzle)).toBeUndefined();
  });

  it('a no-op change after undoing does not discard the redo history, having changed nothing', () => {
    const placed = apply(createEmptyPuzzle(), (p) => fillDigit(p, A, 5));
    const undone = requireUndo(placed.history, placed.puzzle);
    const noOp = applyWithUndo(undone.history, undone.puzzle, (p) => clearLayer(p, B, 'fill'));
    const redone = requireRedo(noOp.history, noOp.puzzle);
    expect(redone.puzzle).toEqual(placed.puzzle);
  });
});
