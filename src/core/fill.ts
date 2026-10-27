import { placedOver, replaceCell, withCandidates, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

/**
 * Fill mode (keymap.md §7): a digit on an empty cell places it, the same
 * digit on a Placed digit removes it, a different digit replaces it, and a
 * digit on a Given does nothing. Placing a digit hides the cell's Candidates
 * without deleting them; replacing it keeps them hidden, and removing it
 * brings them back. Returns a new Puzzle; the old one is untouched.
 */
export function fillDigit(puzzle: Puzzle, position: Position, digit: Digit): Puzzle {
  const current = puzzle.cells[position.row]?.[position.column];
  if (current === undefined || current.kind === 'given') return puzzle;
  return replaceCell(puzzle, position, filled(current, digit));
}

function filled(current: Exclude<Cell, { kind: 'given' }>, digit: Digit): Cell {
  switch (current.kind) {
    case 'empty':
      return placedOver(digit, undefined);
    case 'candidates':
      return placedOver(digit, current.candidates);
    case 'placed':
      if (current.digit !== digit) return placedOver(digit, current.candidates);
      return current.candidates === undefined ? { kind: 'empty' } : withCandidates(current.candidates);
  }
}
