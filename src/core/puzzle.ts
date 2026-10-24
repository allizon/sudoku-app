// The Puzzle: the 9×9 grid being solved (see CONTEXT.md).

/** Rows and columns in a Puzzle. */
export const GRID_SIZE = 9;

/**
 * One cell of the Puzzle. For now a cell can only be empty; Givens, placed
 * digits, and Candidates will be added as further shapes of this type.
 */
export type Cell = { readonly kind: 'empty' };

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

/** Whether the cell holds nothing at all. */
export function isEmptyCell(cell: Cell): boolean {
  return cell.kind === 'empty';
}
