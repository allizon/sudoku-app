// Entry modes: what a digit key does to the Selected cell (keymap.md §2).
import { toggleCenterMark, toggleCornerMark } from './candidates';
import { fillDigit } from './fill';
import type { Digit, Puzzle } from './puzzle';
import type { Position } from './selection';

/** The three Entry modes. */
export type EntryMode = 'fill' | 'center' | 'corner';

/** The app starts in fill mode. */
export const INITIAL_ENTRY_MODE: EntryMode = 'fill';

const NEXT_ENTRY_MODE: Readonly<Record<EntryMode, EntryMode>> = {
  fill: 'center',
  center: 'corner',
  corner: 'fill',
};

/** The Sticky mode after pressing N: fill → center → corner → fill. */
export function nextEntryMode(mode: EntryMode): EntryMode {
  return NEXT_ENTRY_MODE[mode];
}

/**
 * A digit key pressed in an Entry mode on the cell at a position: fill mode
 * places the digit, center mode toggles a Center mark, and corner mode
 * toggles a Corner mark. Returns a new Puzzle; the old one is untouched.
 */
export function enterDigit(puzzle: Puzzle, position: Position, mode: EntryMode, digit: Digit): Puzzle {
  switch (mode) {
    case 'fill':
      return fillDigit(puzzle, position, digit);
    case 'center':
      return toggleCenterMark(puzzle, position, digit);
    case 'corner':
      return toggleCornerMark(puzzle, position, digit);
  }
}
