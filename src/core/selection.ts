/** A cell's place in the grid: 0-based row and column. */
export type Position = { row: number; column: number };

export type Direction = 'up' | 'down' | 'left' | 'right';

const SIZE = 9;

const wrap = (index: number): number => (index + SIZE) % SIZE;

/** The position one cell in a direction, wrapping within the same row or column (keymap.md §4). */
export function moveSelection(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { row: wrap(position.row - 1), column: position.column };
    case 'down':
      return { row: wrap(position.row + 1), column: position.column };
    case 'left':
      return { row: position.row, column: wrap(position.column - 1) };
    case 'right':
      return { row: position.row, column: wrap(position.column + 1) };
  }
}
