import type { ChordLetter } from './chord';
import type { Digit } from './puzzle';

const DIGIT_CODE = /^(?:Digit|Numpad)([1-9])$/;

/**
 * The digit a physical key stands for, from `KeyboardEvent.code`: the number
 * row and the numpad, 1–9. Zero and every other key give undefined (keymap.md §1).
 */
export function digitFromCode(code: string): Digit | undefined {
  const match = DIGIT_CODE.exec(code);
  switch (match?.[1]) {
    case '1': return 1;
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
    case '5': return 5;
    case '6': return 6;
    case '7': return 7;
    case '8': return 8;
    case '9': return 9;
    default: return undefined;
  }
}

/**
 * The chord letter a physical key stands for, from `KeyboardEvent.code`:
 * KeyC and KeyS, whatever character the layout makes them type (keymap.md §3, rule 7).
 */
export function chordLetterFromCode(code: string): ChordLetter | undefined {
  switch (code) {
    case 'KeyC': return 'C';
    case 'KeyS': return 'S';
    default: return undefined;
  }
}
