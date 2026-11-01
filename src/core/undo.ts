// Undo and redo (keymap.md §6): every grid change is one undo step, undo
// restores the changed cell exactly, redo reverses an undo, and a new change
// after undoing discards the redo history while a change that alters nothing
// records nothing at all.
//
// A step is the set of cells the change altered, each with the Cell it
// replaced. Undo swaps those Cells back in; redo swaps in what the cells
// held when they were undone. Cells are immutable, so holding a Cell object
// holds the cell's whole state: a Placed digit's hidden Candidates come back
// with it (keymap.md §6).
//
// The two stacks together are one trail through the cell states. Undo moves
// the top step to the top of the redo side; a new change after undoing cuts
// the undone steps off the redo side and lays them back onto the undo side
// as each cell's current state, so undoing further walks the trail
// underneath the discarded branch without ever bringing it back (keymap.md §6).
import { replaceCell, type Candidates, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

/** One cell a step alters: its position and the Cell the change replaced. */
type Swap = { readonly position: Position; readonly cell: Cell };

/** One undo step: every cell one grid change altered, with their earlier Cells. */
type Step = { readonly changes: readonly Swap[] };

/**
 * The undo and redo stacks, newest last. Each entry is one step: undo pops
 * the last step off `undoStack`, redo pops off `redoStack`, and either appends
 * the reverse step to the other stack.
 */
export type History = {
  readonly undoStack: readonly Step[];
  readonly redoStack: readonly Step[];
};

/** A fresh Puzzle's history: nothing is undoable or redoable. */
export const emptyHistory: History = { undoStack: [], redoStack: [] };

/** What a change, an undo, or a redo leaves: the Puzzle and its History. */
export type Applied = { readonly puzzle: Puzzle; readonly history: History };

/**
 * Runs a change on the Puzzle, recording it as one undo step. A change that
 * alters nothing — a digit on a Given, Delete on an empty cell — records no
 * step and leaves the history as it was, so the redo history survives a
 * no-op (keymap.md §5, §7). A change that alters something discards the redo
 * history (keymap.md §6): its steps come back as one undo step each, holding
 * each cell's state as it stands now, so a discarded undone change neither
 * redoes again nor vanishes from the trail. The placement + Elimination
 * bundling of feedback.md §3 is a later ticket.
 */
export function applyWithUndo(history: History, puzzle: Puzzle, change: (current: Puzzle) => Puzzle): Applied {
  const next = change(puzzle);
  const swaps = cellsChanged(puzzle, next);
  if (swaps.length === 0) return { puzzle: next, history };
  // Each discarded redo step comes back as its cells' current state, oldest
  // undo last so undoing walks back through them in the order they were undone.
  const laidBack = history.redoStack.map((step) => swappedBack(puzzle, step.changes));
  return {
    puzzle: next,
    history: { undoStack: [...history.undoStack, ...laidBack, { changes: swaps }], redoStack: [] },
  };
}

/**
 * The Puzzle with the last change taken back, and its History with that step
 * moved onto the redo stack. Undefined when there is nothing to undo, so the
 * app can leave the page untouched (keymap.md §6). Selection and Sticky mode
 * are not part of a History, so they survive an undo untouched.
 */
export function undo(history: History, puzzle: Puzzle): Applied | undefined {
  const step = history.undoStack[history.undoStack.length - 1];
  if (step === undefined) return undefined;
  return {
    puzzle: swappedIn(puzzle, step.changes),
    history: {
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, swappedBack(puzzle, step.changes)],
    },
  };
}

/** As undo, from the redo stack to the undo stack (keymap.md §6). */
export function redo(history: History, puzzle: Puzzle): Applied | undefined {
  const step = history.redoStack[history.redoStack.length - 1];
  if (step === undefined) return undefined;
  return {
    puzzle: swappedIn(puzzle, step.changes),
    history: {
      undoStack: [...history.undoStack, swappedBack(puzzle, step.changes)],
      redoStack: history.redoStack.slice(0, -1),
    },
  };
}

/** The cells the change altered: those that differ, with what they were before. */
function cellsChanged(before: Puzzle, after: Puzzle): readonly Swap[] {
  const swaps: Swap[] = [];
  for (let row = 0; row < before.cells.length; row += 1) {
    const beforeRow = before.cells[row] ?? [];
    const afterRow = after.cells[row] ?? [];
    for (let column = 0; column < beforeRow.length; column += 1) {
      const cell = beforeRow[column];
      const next = afterRow[column];
      if (cell !== undefined && next !== undefined && !cellsEqual(cell, next)) {
        swaps.push({ position: { row, column }, cell });
      }
    }
  }
  return swaps;
}

/** The Puzzle with each Swap's Cell put back at its position. */
function swappedIn(puzzle: Puzzle, swaps: readonly Swap[]): Puzzle {
  return swaps.reduce((current, swap) => replaceCell(current, swap.position, swap.cell), puzzle);
}

/** The step that takes `swaps` back: each position's Cell as it stands now. */
function swappedBack(puzzle: Puzzle, swaps: readonly Swap[]): Step {
  return {
    changes: swaps.flatMap((swap) => {
      const cell = puzzle.cells[swap.position.row]?.[swap.position.column];
      return cell === undefined ? [] : [{ position: swap.position, cell }];
    }),
  };
}

/** Whether two Cells hold exactly the same thing: the same kind, and the same contents. */
function cellsEqual(a: Cell, b: Cell): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'given' && b.kind === 'given') return a.digit === b.digit;
  if (a.kind === 'placed' && b.kind === 'placed')
    return a.digit === b.digit && candidatesEqual(a.candidates, b.candidates);
  if (a.kind === 'candidates' && b.kind === 'candidates') return candidatesEqual(a.candidates, b.candidates);
  return a.kind === 'empty' && b.kind === 'empty';
}

/** Whether two Candidates hold the same marks, both kinds, hidden or not. */
function candidatesEqual(a: Candidates | undefined, b: Candidates | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return marksEqual(a.centerMarks, b.centerMarks) && marksEqual(a.cornerMarks, b.cornerMarks);
}

/** Whether two lists hold the same digits in the same order. */
function marksEqual(a: readonly Digit[], b: readonly Digit[]): boolean {
  return a.length === b.length && a.every((mark, index) => mark === b[index]);
}
