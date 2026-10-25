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
  // Array.from splits by code point, so a character outside the BMP is named whole.
  const chars = Array.from(text.replace(SEPARATORS, ''));
  const errors: ParseError[] = [];
  const cells: Cell[] = [];

  if (chars.length !== CELL_COUNT) {
    errors.push({ message: `found ${chars.length} cells, expected ${CELL_COUNT}` });
  }

  for (const [index, char] of chars.entries()) {
    const cell = cellFor(char);
    if (cell === undefined) {
      const row = Math.floor(index / GRID_SIZE) + 1;
      const column = (index % GRID_SIZE) + 1;
      errors.push({ message: `unexpected '${char}' at row ${row}, column ${column}` });
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
