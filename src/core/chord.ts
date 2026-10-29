// Letter chords: holding C or S applies center or corner mode to digit presses
// without changing the Sticky mode (keymap.md §3).
import type { EntryMode } from './entry-mode';

/** The letters that start a chord: C for center mode, S for corner mode. */
export type ChordLetter = 'C' | 'S';

/** Which chord letters are held down. */
export type HeldLetters = Readonly<Record<ChordLetter, boolean>>;

/** No chord letter is held. */
export const NONE_HELD: HeldLetters = { C: false, S: false };

/**
 * A chord letter goes down. Holding a letter already held changes nothing, so
 * key auto-repeat cannot stack (keymap.md §3, rule 3).
 */
export function holdLetter(held: HeldLetters, letter: ChordLetter): HeldLetters {
  return { ...held, [letter]: true };
}

/** A chord letter comes up. Releasing a letter not held changes nothing. */
export function releaseLetter(held: HeldLetters, letter: ChordLetter): HeldLetters {
  return { ...held, [letter]: false };
}

/**
 * The Entry mode a digit press uses: the chord's mode while one letter is
 * held, the Sticky mode when none is, and undefined (digit presses do
 * nothing) while C and S are both held (keymap.md §3, rules 5 and 6).
 */
export function activeEntryMode(stickyMode: EntryMode, held: HeldLetters): EntryMode | undefined {
  if (held.C && held.S) return undefined;
  if (held.C) return 'center';
  if (held.S) return 'corner';
  return stickyMode;
}
