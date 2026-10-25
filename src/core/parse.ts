// Parsing pasted text into a Puzzle (import.md §3). In M0 any text that
// parses becomes a Puzzle as-is; validation (import.md §4) comes later.
import { GRID_SIZE, type Cell, type Digit, type Puzzle } from './puzzle';

/** One reason the text could not be read as a Puzzle. */
export type ParseError = { readonly message: string };

/**
 * The Puzzle the text describes, or every parse error found, in order: the
 * wrong-count error first, then the first bad character.
 */
export type ParseResult =
  | { readonly ok: true; readonly puzzle: Puzzle }
  | { readonly ok: false; readonly errors: readonly ParseError[] };

const CELL_COUNT = GRID_SIZE * GRID_SIZE;

/** Whitespace (anything `\s` matches) and commas, which only separate cells. */
const SEPARATORS = /[\s,]/g;

const EMPTY_CHARS = new Set(['.', '0', '-']);

const DIGITS: Readonly<Record<string, Digit>> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};

/**
 * Characters a player cannot see in the pasted text: control, format,
 * surrogate, private-use and unassigned characters (C), combining marks (M),
 * default-ignorable characters (such as the Hangul fillers U+3164 and U+115F),
 * and the blank Braille pattern U+2800. Z (separators) is a safeguard only:
 * `\s` already removes every Z character before this is reached.
 */
const INVISIBLE = /^[\p{C}\p{M}\p{Z}\p{Default_Ignorable_Code_Point}\u2800]$/u;

/**
 * Names for the invisible characters a paste most often carries. The byte
 * order mark (U+FEFF) is not here: `\s` matches it, so it is removed with the
 * whitespace and never reaches a parse error.
 */
const INVISIBLE_NAMES: ReadonlyMap<number, string> = new Map([
  [0x200b, 'zero-width space'],
  [0x200c, 'zero-width non-joiner'],
  [0x200d, 'zero-width joiner'],
  [0x2060, 'word joiner'],
  [0x00ad, 'soft hyphen'],
]);

/**
 * A character as a parse error names it: quoted when visible, otherwise by
 * its code point (`U+200B`), with a name when it has one.
 */
function describeChar(char: string): string {
  if (!INVISIBLE.test(char)) return `'${char}'`;
  const codePoint = char.codePointAt(0) ?? 0;
  const code = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
  const name = INVISIBLE_NAMES.get(codePoint);
  return name === undefined ? code : `${code} (${name})`;
}

/**
 * Where a cell is, from its 0-based index in the cleaned text: its row and
 * column within the 81 cells, or past them.
 */
function describePosition(index: number): string {
  if (index >= CELL_COUNT) return `after the ${CELL_COUNT}st cell`;
  const row = Math.floor(index / GRID_SIZE) + 1;
  const column = (index % GRID_SIZE) + 1;
  return `at row ${row}, column ${column}`;
}

/** The cell a character stands for, or undefined when it stands for none. */
function cellFor(char: string): Cell | undefined {
  if (EMPTY_CHARS.has(char)) return { kind: 'empty' };
  const digit = DIGITS[char];
  return digit === undefined ? undefined : { kind: 'given', digit };
}

/**
 * Reads a Puzzle from text: whitespace and commas are removed, and the 81
 * characters left are read left to right, top to bottom, `1`–`9` as Givens
 * and `.`, `0`, `-` as empty cells.
 */
export function parsePuzzle(text: string): ParseResult {
  // Array.from splits by code point, so a character outside the BMP (😀) is
  // one cell and is named whole. A character built from several code points
  // (a flag, an emoji with a skin tone, a letter plus a combining mark) counts
  // as several cells, and only its first code point is named.
  const chars = Array.from(text.replace(SEPARATORS, ''));
  const errors: ParseError[] = [];
  const cells: Cell[] = [];

  if (chars.length !== CELL_COUNT) {
    errors.push({ message: `found ${chars.length} cells, expected ${CELL_COUNT}` });
  }

  for (const [index, char] of chars.entries()) {
    const cell = cellFor(char);
    if (cell === undefined) {
      errors.push({ message: `unexpected ${describeChar(char)} ${describePosition(index)}` });
      break;
    }
    cells.push(cell);
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    puzzle: {
      cells: Array.from({ length: GRID_SIZE }, (_, row) => cells.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE)),
    },
  };
}
