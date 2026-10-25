import type { Digit, Puzzle } from './puzzle';
import type { Position } from './selection';

/**
 * Fill mode (keymap.md §7): a digit on an empty cell places it, the same
 * digit on a placed digit removes it, a different digit replaces it, and a
 * digit on a given does nothing. Returns a new Puzzle; the old one is untouched.
 */
export function fillDigit(puzzle: Puzzle, position: Position, digit: Digit): Puzzle {
  const current = puzzle.cells[position.row]?.[position.column];
  if (current === undefined || current.kind === 'given') return puzzle;
  const next =
    current.kind === 'placed' && current.digit === digit
      ? ({ kind: 'empty' } as const)
      : ({ kind: 'placed', digit } as const);
  return {
    cells: puzzle.cells.map((row, r) =>
      r === position.row ? row.map((cell, c) => (c === position.column ? next : cell)) : row,
    ),
  };
}
