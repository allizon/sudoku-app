// Clearing the Selected cell: Delete/Backspace and X (keymap.md §5).
import type { EntryMode } from './entry-mode';
import { replaceCell, withCandidates, type Cell, type Puzzle } from './puzzle';
import type { Position } from './selection';

/**
 * Delete or Backspace in an Entry mode on the cell at a position: fill mode
 * removes a Placed digit, revealing any Candidates it hid; center mode
 * removes all Center marks; corner mode removes all Corner marks. On a
 * Given, and in center or corner mode on a Placed digit, it does nothing.
 * Returns a new Puzzle; the old one is untouched.
 */
export function clearLayer(puzzle: Puzzle, position: Position, mode: EntryMode): Puzzle {
  const current = puzzle.cells[position.row]?.[position.column];
  if (current === undefined) return puzzle;
  const next = clearedLayer(current, mode);
  return next === current ? puzzle : replaceCell(puzzle, position, next);
}

/**
 * X on the cell at a position: removes everything, including Candidates
 * hidden under a Placed digit, leaving the cell empty. On a Given it does
 * nothing. Returns a new Puzzle; the old one is untouched.
 */
export function clearCell(puzzle: Puzzle, position: Position): Puzzle {
  const current = puzzle.cells[position.row]?.[position.column];
  if (current === undefined || current.kind === 'given' || current.kind === 'empty') return puzzle;
  return replaceCell(puzzle, position, { kind: 'empty' });
}

/** The cell with one layer cleared, or the same cell when the mode clears nothing in it. */
function clearedLayer(cell: Cell, mode: EntryMode): Cell {
  switch (mode) {
    case 'fill':
      return cell.kind === 'placed' ? (cell.candidates === undefined ? { kind: 'empty' } : withCandidates(cell.candidates)) : cell;
    case 'center':
      return cell.kind === 'candidates' && cell.candidates.centerMarks.length > 0
        ? withCandidates({ centerMarks: [], cornerMarks: cell.candidates.cornerMarks })
        : cell;
    case 'corner':
      return cell.kind === 'candidates' && cell.candidates.cornerMarks.length > 0
        ? withCandidates({ centerMarks: cell.candidates.centerMarks, cornerMarks: [] })
        : cell;
  }
}
