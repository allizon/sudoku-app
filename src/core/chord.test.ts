// Letter chords: holding C or S applies center or corner mode to digit presses without changing the
// Sticky mode (TASK-7, AC #1-#9, #11; keymap.md §1, §3, §7).
// Pure core logic. New core API assumed by these tests:
//   type ChordLetter = 'C' | 'S'                                             in ./chord
//   type HeldLetters (opaque: which chord letters are held)                  in ./chord
//   NONE_HELD: HeldLetters               (no chord letter held)              in ./chord
//   holdLetter(held, letter): HeldLetters     (a chord letter goes down)     in ./chord
//   releaseLetter(held, letter): HeldLetters  (a chord letter comes up)      in ./chord
//   activeEntryMode(stickyMode, held): EntryMode | undefined                 in ./chord
//     (the Entry mode a digit press uses: the chord's mode while one letter is held, the Sticky mode
//      when none is, and undefined, meaning digit presses do nothing, while C and S are both held)
//   chordLetterFromCode(code): ChordLetter | undefined                       in ./keys
//     (the chord letter a physical key stands for, from KeyboardEvent.code)
// The functions return new values and never mutate; these tests only look at HeldLetters through
// activeEntryMode, so any representation passes.
import { centerMarksOf, cornerMarksOf } from './candidates';
import { activeEntryMode, holdLetter, NONE_HELD, releaseLetter, type ChordLetter, type HeldLetters } from './chord';
import { enterDigit, type EntryMode } from './entry-mode';
import { fillDigit } from './fill';
import { chordLetterFromCode } from './keys';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, type Cell, type Puzzle } from './puzzle';
import type { Position } from './selection';

const MODES = ['fill', 'center', 'corner'] as const satisfies readonly EntryMode[];

const at = (row: number, column: number): Position => ({ row, column });

const cellOf = (puzzle: Puzzle, position: Position): Cell => {
  const cell = puzzle.cells[position.row]?.[position.column];
  if (cell === undefined) throw new Error(`no cell at ${position.row}, ${position.column}`);
  return cell;
};

/** A Puzzle with one Given: 3 at row 1, column 3 (and nothing else). */
function puzzleWithGiven(): Puzzle {
  const result = parsePuzzle('..3'.padEnd(81, '.'));
  if (!result.ok) throw new Error('fixture does not parse');
  return result.puzzle;
}

/** The letters held after pressing each, in order, starting from none. */
const holding = (...letters: ChordLetter[]): HeldLetters => letters.reduce(holdLetter, NONE_HELD);

/** A digit press with a Sticky mode and held letters, as the app makes it: nothing when no mode applies. */
function pressDigit(puzzle: Puzzle, position: Position, stickyMode: EntryMode, held: HeldLetters, digit: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
  const mode = activeEntryMode(stickyMode, held);
  return mode === undefined ? puzzle : enterDigit(puzzle, position, mode, digit);
}

describe('Letter chords: C and S are identified by physical key (keymap.md §1, §3)', () => {
  it('KeyC is the C chord letter', () => {
    expect(chordLetterFromCode('KeyC')).toBe('C');
  });

  it('KeyS is the S chord letter', () => {
    expect(chordLetterFromCode('KeyS')).toBe('S');
  });

  it.each(['KeyN', 'KeyX', 'KeyI', 'KeyA', 'Digit1', 'Numpad3', 'ShiftLeft', 'Space', ''])('%s is not a chord letter', (code) => {
    expect(chordLetterFromCode(code)).toBeUndefined();
  });
});

describe('Letter chords: no chord applies when no letter is held', () => {
  it.each(MODES)('with nothing held, digit presses use the Sticky mode (%s)', (sticky) => {
    expect(activeEntryMode(sticky, NONE_HELD)).toBe(sticky);
  });
});

describe('Letter chords: while C is held, each digit press toggles that digit as a Center mark (AC #1)', () => {
  it.each(MODES)('holding C, the active Entry mode is center whatever the Sticky mode (%s)', (sticky) => {
    expect(activeEntryMode(sticky, holding('C'))).toBe('center');
  });

  it('a digit pressed while C is held adds a Center mark to the cell, even in fill mode', () => {
    const cell = cellOf(pressDigit(createEmptyPuzzle(), at(2, 6), 'fill', holding('C'), 4), at(2, 6));
    expect(centerMarksOf(cell)).toEqual([4]);
    expect(cell.kind).not.toBe('placed');
    expect(cornerMarksOf(cell)).toEqual([]);
  });

  it('the same digit again while C is held removes the Center mark', () => {
    const held = holding('C');
    const once = pressDigit(createEmptyPuzzle(), at(2, 6), 'fill', held, 4);
    const twice = pressDigit(once, at(2, 6), 'fill', held, 4);
    expect(centerMarksOf(cellOf(twice, at(2, 6)))).toEqual([]);
  });
});

describe('Letter chords: while S is held, each digit press toggles that digit as a Corner mark (AC #2)', () => {
  it.each(MODES)('holding S, the active Entry mode is corner whatever the Sticky mode (%s)', (sticky) => {
    expect(activeEntryMode(sticky, holding('S'))).toBe('corner');
  });

  it('a digit pressed while S is held adds a Corner mark to the cell, even in fill mode', () => {
    const cell = cellOf(pressDigit(createEmptyPuzzle(), at(7, 1), 'fill', holding('S'), 9), at(7, 1));
    expect(cornerMarksOf(cell)).toEqual([9]);
    expect(cell.kind).not.toBe('placed');
    expect(centerMarksOf(cell)).toEqual([]);
  });

  it('the same digit again while S is held removes the Corner mark', () => {
    const held = holding('S');
    const once = pressDigit(createEmptyPuzzle(), at(7, 1), 'fill', held, 9);
    const twice = pressDigit(once, at(7, 1), 'fill', held, 9);
    expect(cornerMarksOf(cellOf(twice, at(7, 1)))).toEqual([]);
  });
});

describe('Letter chords: several digits can be pressed during one chord (AC #3)', () => {
  it('hold C, press 1, 4, 7 → three Center marks toggled', () => {
    const held = holding('C');
    let puzzle = createEmptyPuzzle();
    for (const digit of [1, 4, 7] as const) puzzle = pressDigit(puzzle, at(0, 0), 'fill', held, digit);
    expect(centerMarksOf(cellOf(puzzle, at(0, 0)))).toEqual([1, 4, 7]);
  });

  it('the chord stays active after a digit press: holding a letter is not used up by one digit', () => {
    const held = holding('S');
    const after = pressDigit(createEmptyPuzzle(), at(0, 0), 'fill', held, 2);
    expect(activeEntryMode('fill', held)).toBe('corner');
    expect(cornerMarksOf(cellOf(pressDigit(after, at(0, 0), 'fill', held, 8), at(0, 0)))).toEqual([2, 8]);
  });
});

describe('Letter chords: pressing and releasing C or S with no digit does nothing (AC #4)', () => {
  it.each(['C', 'S'] as const)('after %s is pressed and released, digit presses use the Sticky mode again', (letter) => {
    const released = releaseLetter(holding(letter), letter);
    for (const sticky of MODES) expect(activeEntryMode(sticky, released)).toBe(sticky);
  });

  it('releasing a letter that is not held changes nothing', () => {
    expect(activeEntryMode('fill', releaseLetter(NONE_HELD, 'C'))).toBe('fill');
    expect(activeEntryMode('fill', releaseLetter(holding('S'), 'C'))).toBe('corner');
  });
});

describe('Letter chords: key auto-repeat from a held C or S is ignored (AC #5)', () => {
  it.each(['C', 'S'] as const)('%s pressed again while held is still held once: one release ends the chord', (letter) => {
    const repeated = holding(letter, letter, letter);
    expect(activeEntryMode('fill', repeated)).toBe(letter === 'C' ? 'center' : 'corner');
    expect(activeEntryMode('fill', releaseLetter(repeated, letter))).toBe('fill');
  });
});

describe('Letter chords: a chord overrides the Sticky mode only for its digit presses (AC #7)', () => {
  it.each(MODES)('after the chord letter is released, the Sticky mode (%s) applies again', (sticky) => {
    for (const letter of ['C', 'S'] as const)
      expect(activeEntryMode(sticky, releaseLetter(holding(letter), letter))).toBe(sticky);
  });

  it('a C chord in corner mode marks Center marks, then corner mode marks Corner marks again', () => {
    const held = holding('C');
    const during = pressDigit(createEmptyPuzzle(), at(0, 0), 'corner', held, 1);
    const after = pressDigit(during, at(0, 0), 'corner', releaseLetter(held, 'C'), 2);
    const cell = cellOf(after, at(0, 0));
    expect(centerMarksOf(cell)).toEqual([1]);
    expect(cornerMarksOf(cell)).toEqual([2]);
  });

  it('holdLetter and releaseLetter return new values and leave the old ones as they were', () => {
    const held = holding('C');
    const both = holdLetter(held, 'S');
    const released = releaseLetter(held, 'C');
    expect(activeEntryMode('fill', NONE_HELD)).toBe('fill');
    expect(activeEntryMode('fill', held)).toBe('center');
    expect(activeEntryMode('fill', both)).toBeUndefined();
    expect(activeEntryMode('fill', released)).toBe('fill');
  });
});

describe('Letter chords: while C and S are both held, digit presses do nothing (AC #8)', () => {
  it.each(MODES)('holding C then S, no Entry mode applies, whatever the Sticky mode (%s)', (sticky) => {
    expect(activeEntryMode(sticky, holding('C', 'S'))).toBeUndefined();
  });

  it.each(MODES)('holding S then C, no Entry mode applies, whatever the Sticky mode (%s)', (sticky) => {
    expect(activeEntryMode(sticky, holding('S', 'C'))).toBeUndefined();
  });

  it('a digit pressed with both held leaves the Puzzle unchanged, even in fill mode', () => {
    const puzzle = createEmptyPuzzle();
    for (const sticky of MODES) expect(pressDigit(puzzle, at(0, 0), sticky, holding('C', 'S'), 5)).toEqual(puzzle);
  });

  it('releasing S while C stays held brings back the C chord', () => {
    expect(activeEntryMode('fill', releaseLetter(holding('C', 'S'), 'S'))).toBe('center');
  });

  it('releasing C while S stays held brings back the S chord', () => {
    expect(activeEntryMode('fill', releaseLetter(holding('C', 'S'), 'C'))).toBe('corner');
  });

  it('releasing both brings back the Sticky mode', () => {
    expect(activeEntryMode('corner', releaseLetter(releaseLetter(holding('C', 'S'), 'C'), 'S'))).toBe('corner');
  });
});

describe('Letter chords: during a chord, a digit press on a Given or a Placed digit does nothing (AC #9)', () => {
  it.each(['C', 'S'] as const)('holding %s, a digit on a Given leaves the whole Puzzle unchanged', (letter) => {
    const puzzle = puzzleWithGiven();
    // The same press on an empty cell does change the Puzzle, so "unchanged" below means something.
    expect(pressDigit(puzzle, at(0, 0), 'fill', holding(letter), 5)).not.toEqual(puzzle);
    expect(pressDigit(puzzle, at(0, 2), 'fill', holding(letter), 5)).toEqual(puzzle);
    expect(pressDigit(puzzle, at(0, 2), 'fill', holding(letter), 3)).toEqual(puzzle);
  });

  it.each(['C', 'S'] as const)('holding %s in fill mode, a digit on a Placed digit neither replaces nor removes it', (letter) => {
    const puzzle = fillDigit(createEmptyPuzzle(), at(3, 3), 6);
    expect(pressDigit(puzzle, at(3, 3), 'fill', holding(letter), 2)).toEqual(puzzle);
    expect(pressDigit(puzzle, at(3, 3), 'fill', holding(letter), 6)).toEqual(puzzle);
  });

  it.each(['C', 'S'] as const)('holding %s, a digit on a Placed digit leaves its hidden Candidates as they were', (letter) => {
    const marked = enterDigit(enterDigit(createEmptyPuzzle(), at(3, 3), 'center', 1), at(3, 3), 'corner', 2);
    const placed = fillDigit(marked, at(3, 3), 6);
    const after = pressDigit(pressDigit(placed, at(3, 3), 'fill', holding(letter), 1), at(3, 3), 'fill', holding(letter), 2);
    expect(after).toEqual(placed);
    expect(centerMarksOf(cellOf(after, at(3, 3)))).toEqual([1]);
    expect(cornerMarksOf(cellOf(after, at(3, 3)))).toEqual([2]);
  });
});
