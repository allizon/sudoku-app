// Fill mode: what a digit key does to the Selected cell (TASK-5, AC #1, #2, #3, #4, #5, #8; keymap.md §1, §7).
// Pure core logic. New core API assumed by these tests:
//   fillDigit(puzzle, position, digit): Puzzle   in ./fill  (returns a new Puzzle; never mutates)
//   digitFromCode(code): Digit | undefined       in ./keys  (physical key `event.code` -> digit)
// A Placed digit is the cell shape { kind: 'placed', digit }.
import { fillDigit } from './fill';
import { digitFromCode } from './keys';
import { parsePuzzle } from './parse';
import { createEmptyPuzzle, isEmptyPuzzle, type Puzzle } from './puzzle';
import type { Position } from './selection';

/** A 0-based position, row then column. */
const at = (row: number, column: number): Position => ({ row, column });

/** A Puzzle with one Given: 3 at row 1, column 3 (and nothing else). */
function puzzleWithGiven(): Puzzle {
  const text = '..3'.padEnd(81, '.');
  const result = parsePuzzle(text);
  if (!result.ok) throw new Error('fixture does not parse');
  return result.puzzle;
}

describe('Fill mode: a digit on an empty Selected cell places that digit', () => {
  it('places the digit in the Selected cell', () => {
    const next = fillDigit(createEmptyPuzzle(), at(4, 5), 7);
    expect(next.cells[4]?.[5]).toEqual({ kind: 'placed', digit: 7 });
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9] as const)('places %i', (digit) => {
    expect(fillDigit(createEmptyPuzzle(), at(0, 0), digit).cells[0]?.[0]).toEqual({ kind: 'placed', digit });
  });

  it('changes no other cell', () => {
    const next = fillDigit(createEmptyPuzzle(), at(4, 5), 7);
    const others = next.cells.flatMap((row, r) => row.filter((_, c) => !(r === 4 && c === 5)));
    expect(others).toHaveLength(80);
    expect(others.every((cell) => cell.kind === 'empty')).toBe(true);
  });

  it('leaves the Puzzle it was given as it was', () => {
    const before = createEmptyPuzzle();
    fillDigit(before, at(4, 5), 7);
    expect(before).toEqual(createEmptyPuzzle());
  });
});

describe('Fill mode: the same digit on a Placed digit removes it (toggle)', () => {
  it('removes the Placed digit, leaving the cell empty', () => {
    const placed = fillDigit(createEmptyPuzzle(), at(2, 2), 5);
    expect(fillDigit(placed, at(2, 2), 5).cells[2]?.[2]).toEqual({ kind: 'empty' });
  });

  it('placing then pressing again restores the original Puzzle', () => {
    const original = createEmptyPuzzle();
    expect(fillDigit(fillDigit(original, at(2, 2), 5), at(2, 2), 5)).toEqual(original);
  });
});

describe('Fill mode: a different digit on a Placed digit replaces it', () => {
  it('the new digit replaces the old one', () => {
    const placed = fillDigit(createEmptyPuzzle(), at(2, 2), 5);
    expect(fillDigit(placed, at(2, 2), 6).cells[2]?.[2]).toEqual({ kind: 'placed', digit: 6 });
  });

  it('replacing leaves the Placed digits in other cells alone', () => {
    const two = fillDigit(fillDigit(createEmptyPuzzle(), at(0, 0), 1), at(2, 2), 5);
    const next = fillDigit(two, at(2, 2), 6);
    expect(next.cells[0]?.[0]).toEqual({ kind: 'placed', digit: 1 });
  });
});

describe('Fill mode: a digit on a Given does nothing', () => {
  it('a different digit leaves the Given as it was', () => {
    expect(fillDigit(puzzleWithGiven(), at(0, 2), 4).cells[0]?.[2]).toEqual({ kind: 'given', digit: 3 });
  });

  it('the same digit leaves the Given as it was (no toggle)', () => {
    expect(fillDigit(puzzleWithGiven(), at(0, 2), 3).cells[0]?.[2]).toEqual({ kind: 'given', digit: 3 });
  });

  it('the whole Puzzle is unchanged', () => {
    const puzzle = puzzleWithGiven();
    expect(fillDigit(puzzle, at(0, 2), 4)).toEqual(puzzle);
  });
});

describe('Digit keys are identified by physical key, not by the character produced', () => {
  it.each([
    ['Digit1', 1],
    ['Digit2', 2],
    ['Digit3', 3],
    ['Digit4', 4],
    ['Digit5', 5],
    ['Digit6', 6],
    ['Digit7', 7],
    ['Digit8', 8],
    ['Digit9', 9],
  ])('the physical key %s is the digit %i', (code, digit) => {
    expect(digitFromCode(code)).toBe(digit);
  });

  it('Digit0 is not a digit the app uses', () => {
    expect(digitFromCode('Digit0')).toBeUndefined();
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('the numpad key Numpad%i is the digit %i', (digit) => {
    expect(digitFromCode(`Numpad${digit}`)).toBe(digit);
  });

  it('Numpad0 is not a digit the app uses', () => {
    expect(digitFromCode('Numpad0')).toBeUndefined();
  });

  it.each(['NumpadAdd', 'NumpadEnter', 'NumpadDecimal'])('%s is not a digit', (code) => {
    expect(digitFromCode(code)).toBeUndefined();
  });

  it.each(['KeyA', 'KeyN', 'ArrowUp', 'Enter', 'Space', 'Minus', ''])('%j is not a digit', (code) => {
    expect(digitFromCode(code)).toBeUndefined();
  });
});

describe('A Puzzle holding only a Placed digit is not empty', () => {
  it('isEmptyPuzzle is false once a digit is placed, so a paste is refused', () => {
    expect(isEmptyPuzzle(createEmptyPuzzle())).toBe(true);
    expect(isEmptyPuzzle(fillDigit(createEmptyPuzzle(), at(3, 3), 4))).toBe(false);
  });

  it('isEmptyPuzzle is true again after the only Placed digit is removed', () => {
    const placed = fillDigit(createEmptyPuzzle(), at(3, 3), 4);
    expect(isEmptyPuzzle(fillDigit(placed, at(3, 3), 4))).toBe(true);
  });
});
