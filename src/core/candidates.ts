// Candidates: Center marks and Corner marks (keymap.md §2, §7).
import { replaceCell, type Candidates, type Cell, type Digit, type Puzzle } from './puzzle';
import type { Position } from './selection';

const NONE: readonly Digit[] = [];

/** The cell's Center marks in ascending order, including any hidden under a Placed digit. */
export function centerMarksOf(cell: Cell): readonly Digit[] {
  return candidatesOf(cell)?.centerMarks ?? NONE;
}

/** The cell's Corner marks in ascending order, including any hidden under a Placed digit. */
export function cornerMarksOf(cell: Cell): readonly Digit[] {
  return candidatesOf(cell)?.cornerMarks ?? NONE;
}

/**
 * Toggles a digit as a Center mark in the cell at a position. On a Given or
 * a Placed digit it does nothing. Returns a new Puzzle; the old one is untouched.
 */
export function toggleCenterMark(puzzle: Puzzle, position: Position, digit: Digit): Puzzle {
  return toggleMark(puzzle, position, (candidates) => ({
    centerMarks: toggled(candidates.centerMarks, digit),
    cornerMarks: candidates.cornerMarks,
  }));
}

/**
 * Toggles a digit as a Corner mark in the cell at a position. On a Given or
 * a Placed digit it does nothing. Returns a new Puzzle; the old one is untouched.
 */
export function toggleCornerMark(puzzle: Puzzle, position: Position, digit: Digit): Puzzle {
  return toggleMark(puzzle, position, (candidates) => ({
    centerMarks: candidates.centerMarks,
    cornerMarks: toggled(candidates.cornerMarks, digit),
  }));
}

function candidatesOf(cell: Cell): Candidates | undefined {
  return cell.kind === 'placed' || cell.kind === 'candidates' ? cell.candidates : undefined;
}

function toggleMark(puzzle: Puzzle, position: Position, change: (candidates: Candidates) => Candidates): Puzzle {
  const current = puzzle.cells[position.row]?.[position.column];
  if (current === undefined) return puzzle;
  if (current.kind !== 'empty' && current.kind !== 'candidates') return puzzle;
  const next = change(current.kind === 'candidates' ? current.candidates : { centerMarks: NONE, cornerMarks: NONE });
  const cell: Cell =
    next.centerMarks.length === 0 && next.cornerMarks.length === 0
      ? { kind: 'empty' }
      : { kind: 'candidates', candidates: next };
  return replaceCell(puzzle, position, cell);
}

/** The marks with the digit removed if present, or added in ascending order if not. */
function toggled(marks: readonly Digit[], digit: Digit): readonly Digit[] {
  return marks.includes(digit) ? marks.filter((mark) => mark !== digit) : [...marks, digit].sort((a, b) => a - b);
}
