// The Puzzle: the 9×9 grid being solved (see CONTEXT.md).
import type { Position } from './selection';

/** Rows and columns in a Puzzle. */
export const GRID_SIZE = 9;

/** Rows and columns in each of the nine boxes. */
export const BOX_SIZE = 3;

/** A digit a cell can hold. */
export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * A cell's Candidates: its Center marks and Corner marks, each in ascending
 * order with no repeats. At least one of the two lists is non-empty wherever
 * a Cell holds this.
 */
export type Candidates = {
  readonly centerMarks: readonly Digit[];
  readonly cornerMarks: readonly Digit[];
};

/**
 * One cell of the Puzzle: empty, a Given, a Placed digit, or only
 * Candidates. A Placed digit keeps any Candidates the cell had, hidden, so
 * they reappear when the digit is removed (keymap.md §7); it has no
 * `candidates` field when there are none.
 */
export type Cell =
  | { readonly kind: 'empty' }
  | { readonly kind: 'given'; readonly digit: Digit }
  | { readonly kind: 'placed'; readonly digit: Digit; readonly candidates?: Candidates }
  | { readonly kind: 'candidates'; readonly candidates: Candidates };

/** The Puzzle's grid as `cells[row][column]`, both 0-based. */
export type Puzzle = { readonly cells: readonly (readonly Cell[])[] };

/** A Puzzle with no Givens and nothing entered: 81 empty cells. */
export function createEmptyPuzzle(): Puzzle {
  return {
    cells: Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, (): Cell => ({ kind: 'empty' })),
    ),
  };
}

/** A copy of the Puzzle with the cell at a position replaced. */
export function replaceCell(puzzle: Puzzle, position: Position, next: Cell): Puzzle {
  return {
    cells: puzzle.cells.map((row, r) =>
      r === position.row ? row.map((cell, c) => (c === position.column ? next : cell)) : row,
    ),
  };
}

/** Whether the cell holds nothing at all: no digit and no Candidates. */
export function isEmptyCell(cell: Cell): boolean {
  return cell.kind === 'empty';
}

/** Whether the Puzzle holds nothing at all, so nothing is loaded yet. */
export function isEmptyPuzzle(puzzle: Puzzle): boolean {
  return puzzle.cells.every((row) => row.every(isEmptyCell));
}

/**
 * The box (0–8) holding the cell at a 0-based row and column. Boxes are
 * numbered left to right, top to bottom.
 */
export function boxOf(row: number, column: number): number {
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(column / BOX_SIZE);
}
