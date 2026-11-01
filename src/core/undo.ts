// Undo and redo (keymap.md §6): every grid change is one undo step, undo takes
// the change back exactly, redo puts an undone change back, and a new change
// after undoing discards the redo history — while the undo trail keeps the
// changes made before it: undoing takes each new change back one by one, and
// beyond the last of them each discarded change's result comes back again
// (Alix, TASK-16, text-editor behavior).
//
// A step is the set of cells the change altered, each with the Cell it held on
// both sides of the change. Cells are immutable, so holding a Cell holds the
// cell's whole state: a Placed digit's hidden Candidates come back with it
// (keymap.md §6).
//
// Both stacks hold the same kind of step: undo pops the last step off the
// undo stack and applies each Swap's earlier Cell, redo pops off the redo
// stack and applies its later Cell, and the step moves to the other stack.
// When a change discards a non-empty redo stack, its steps are laid back onto
// the undo stack with the two sides of every Swap exchanged, oldest change
// deepest: the next undo takes the new change back, and further undos bring
// the discarded changes' results back again, newest change first — each pop
// applies the redone side of one laid-back step. That keeps every step
// reversible in both directions — should such a step ever be redone
// again, it would take its result back out.
//
// Why no "the applied side matches the board" guard is needed: every Swap
// stores both sides as absolute Cell snapshots, so applying a side never
// reads the board — it overwrites the recorded positions with the recorded
// Cells. Correctness needs no board state to match anything, only that pops
// line up in the order the trails are built, which the functions below
// construct.
import { replaceCell, type Candidates, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

/** One cell a step alters: its position, and the Cell it held before and after. */
type Swap = { readonly position: Position; readonly before: Cell; readonly after: Cell };

/** One undo step: every cell one grid change altered, with their Cells on both sides. */
type Step = { readonly changes: readonly Swap[] };

/**
 * The undo and redo stacks, newest last. Undo pops the last step off
 * `undoStack` and applies its earlier Cells; redo pops off `redoStack` and
 * applies its later Cells; the step moves to the other stack.
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
 * step and leaves the history as it was, so a no-op never discards redo
 * history (keymap.md §5, §7). A change that alters something discards the
 * redo history (keymap.md §6): its steps come back onto the undo stack with
 * their sides exchanged, so the earlier changes stay reachable by undo.
 * The placement + Elimination bundling of feedback.md §3 is a later ticket.
 */
export function applyWithUndo(history: History, puzzle: Puzzle, change: (current: Puzzle) => Puzzle): Applied {
  const next = change(puzzle);
  const swaps = cellsChanged(puzzle, next);
  if (swaps.length === 0) return { puzzle: next, history };
  // Oldest change deepest (the redo stack grows newest-undone on top, so it
  // lays back reversed): the next undo takes the new change back, and further
  // undos restore the discarded changes' results, newest change first.
  const laidBack = [...history.redoStack].reverse().map(swapSides);
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
    puzzle: swappedTo(puzzle, step.changes, 'before'),
    history: {
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, step],
    },
  };
}

/** As undo, from the redo stack to the undo stack (keymap.md §6). */
export function redo(history: History, puzzle: Puzzle): Applied | undefined {
  const step = history.redoStack[history.redoStack.length - 1];
  if (step === undefined) return undefined;
  return {
    puzzle: swappedTo(puzzle, step.changes, 'after'),
    history: {
      undoStack: [...history.undoStack, step],
      redoStack: history.redoStack.slice(0, -1),
    },
  };
}

/** The cells the change altered: those that differ, with what they held before and after. */
function cellsChanged(before: Puzzle, after: Puzzle): readonly Swap[] {
  const swaps: Swap[] = [];
  for (let row = 0; row < before.cells.length; row += 1) {
    const beforeRow = before.cells[row] ?? [];
    const afterRow = after.cells[row] ?? [];
    for (let column = 0; column < beforeRow.length; column += 1) {
      const cell = beforeRow[column];
      const next = afterRow[column];
      if (cell !== undefined && next !== undefined && !cellsEqual(cell, next)) {
        swaps.push({ position: { row, column }, before: cell, after: next });
      }
    }
  }
  return swaps;
}

/** A step with its two sides exchanged, as a change lays a discarded step back. */
function swapSides(step: Step): Step {
  return {
    changes: step.changes.map((swap) => ({ position: swap.position, before: swap.after, after: swap.before })),
  };
}

/** The Puzzle with each Swap's Cell of that side put back at its position. */
function swappedTo(puzzle: Puzzle, swaps: readonly Swap[], side: 'before' | 'after'): Puzzle {
  return swaps.reduce((current, swap) => replaceCell(current, swap.position, swap[side]), puzzle);
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
