// Parsing pasted text into a Puzzle (TASK-4, AC #2, #3, #4, #5, #7, #8, #12;
// import.md §3, §6). M0 is parsing only: any text that parses becomes a Puzzle
// as-is, with no validation (milestones.md M0).
// A rejected parse carries every error found, in order: the wrong-count error
// first, then the first bad character (Alix, TASK-4 step 2).
// Uses Vitest globals so this file imports only from src/core/. Puzzle text is
// inlined here rather than read from fixtures/, for the same reason.
import { parsePuzzle } from './parse';
import { isEmptyCell, type Puzzle } from './puzzle';

/** import.md §6 Sample A, `0` for empty. */
const SAMPLE_A_ZEROS = '020060080700001009000809000072000600100000007005000930000307000300500004010020060';
/** import.md §6 Sample A in the site's permalink notation, `-` for empty. */
const SAMPLE_A_DASHES = '-2--6--8-7----1--9---8-9----72---6--1-------7--5---93----3-7---3--5----4-1--2--6-';
/** Sample A with `.` for empty. */
const SAMPLE_A_DOTS = SAMPLE_A_ZEROS.replace(/0/g, '.');

/** Splits 81 characters into nine rows of nine. */
const rowsOf = (text: string) => Array.from({ length: 9 }, (_, r) => text.slice(r * 9, r * 9 + 9));

/** Parses text that must parse, and returns its Puzzle. */
function parsed(text: string): Puzzle {
  const result = parsePuzzle(text);
  if (!result.ok) {
    throw new Error(`expected the text to parse, got: ${result.errors.map((e) => e.message).join('; ')}`);
  }
  return result.puzzle;
}

/** Parses text that must be rejected, and returns the messages of its parse errors, in order. */
function parseErrorsFor(text: string): string[] {
  const result = parsePuzzle(text);
  if (result.ok) throw new Error('expected a parse error, but the text parsed');
  return result.errors.map((error) => error.message);
}

/** Parses text that must be rejected with exactly one parse error, and returns its message. */
function parseErrorFor(text: string): string {
  const messages = parseErrorsFor(text);
  expect(messages).toHaveLength(1);
  return messages[0] ?? '';
}

/** Replaces the character at a 0-based index. */
const withCharAt = (text: string, index: number, char: string) =>
  text.slice(0, index) + char + text.slice(index + 1);

/** The Puzzle as 81 characters, a Given as its digit and an empty cell as `.`. */
function asText(puzzle: Puzzle): string {
  return puzzle.cells
    .flat()
    .map((cell) => (isEmptyCell(cell) ? '.' : cell.kind === 'given' ? String(cell.digit) : '?'))
    .join('');
}

describe('parsePuzzle: reading cells', () => {
  it('reads 81 characters left to right, top to bottom, into rows and columns', () => {
    const puzzle = parsed(SAMPLE_A_ZEROS);
    expect(puzzle.cells).toHaveLength(9);
    for (let row = 0; row < 9; row++) {
      expect(puzzle.cells[row]).toHaveLength(9);
      for (let column = 0; column < 9; column++) {
        const char = SAMPLE_A_ZEROS[row * 9 + column];
        const cell = puzzle.cells[row]?.[column];
        if (char === '0') expect(cell && isEmptyCell(cell)).toBe(true);
        else expect(cell).toEqual({ kind: 'given', digit: Number(char) });
      }
    }
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('reads %i as a Given of that digit', (digit) => {
    const puzzle = parsed(String(digit) + '.'.repeat(80));
    expect(puzzle.cells[0]?.[0]).toEqual({ kind: 'given', digit });
  });

  it.each(['.', '0', '-'])('reads %s as an empty cell', (char) => {
    const puzzle = parsed(char.repeat(81));
    expect(puzzle.cells.flat().every((cell) => isEmptyCell(cell))).toBe(true);
  });

  it('., 0, and - give the same empty cell', () => {
    const fromDots = parsed('.'.repeat(81));
    expect(parsed('0'.repeat(81))).toEqual(fromDots);
    expect(parsed('-'.repeat(81))).toEqual(fromDots);
  });

  it('a mix of ., 0, and - for empty cells parses as one Puzzle', () => {
    const mixed = SAMPLE_A_ZEROS.split('')
      .map((char, i) => (char === '0' ? ['.', '0', '-'][i % 3] : char))
      .join('');
    expect(parsed(mixed)).toEqual(parsed(SAMPLE_A_ZEROS));
  });

  it('Sample A has 24 Givens', () => {
    const givens = parsed(SAMPLE_A_ZEROS)
      .cells.flat()
      .filter((cell) => !isEmptyCell(cell));
    expect(givens).toHaveLength(24);
  });

  it('a Puzzle whose Givens conflict still parses, since M0 does no validation', () => {
    const puzzle = parsed('55' + '.'.repeat(79));
    expect(puzzle.cells[0]?.[0]).toEqual({ kind: 'given', digit: 5 });
    expect(puzzle.cells[0]?.[1]).toEqual({ kind: 'given', digit: 5 });
  });

  it('81 empty cells parse as a Puzzle with no Givens', () => {
    expect(asText(parsed('.'.repeat(81)))).toBe('.'.repeat(81));
  });
});

describe('parsePuzzle: formats that load the same Puzzle', () => {
  const expected = SAMPLE_A_DOTS;

  it.each([
    ['an 81-character string', SAMPLE_A_ZEROS],
    ['nine lines of nine', rowsOf(SAMPLE_A_ZEROS).join('\n')],
    ['nine lines of nine with Windows line breaks', rowsOf(SAMPLE_A_ZEROS).join('\r\n')],
    ['nine lines of nine with a trailing line break', rowsOf(SAMPLE_A_ZEROS).join('\n') + '\n'],
    ['comma-separated cells', SAMPLE_A_ZEROS.split('').join(',')],
    ['comma-separated cells with spaces after the commas', SAMPLE_A_ZEROS.split('').join(', ')],
    ['space-separated cells', SAMPLE_A_ZEROS.split('').join(' ')],
    ['tab-separated cells', SAMPLE_A_ZEROS.split('').join('\t')],
    [
      'nine lines of space-separated cells',
      rowsOf(SAMPLE_A_ZEROS)
        .map((row) => row.split('').join(' '))
        .join('\n'),
    ],
    [
      'nine lines of comma-separated cells',
      rowsOf(SAMPLE_A_ZEROS)
        .map((row) => row.split('').join(','))
        .join('\n'),
    ],
    ['text with leading and trailing whitespace', `  \n\t${SAMPLE_A_ZEROS}\t \n`],
    ['cells separated by non-breaking spaces (U+00A0)', SAMPLE_A_ZEROS.split('').join('\u00A0')],
    ['cells separated by em spaces (U+2003)', SAMPLE_A_ZEROS.split('').join('\u2003')],
    [
      'nine lines of cells separated by non-breaking spaces',
      rowsOf(SAMPLE_A_ZEROS)
        .map((row) => row.split('').join('\u00A0'))
        .join('\n'),
    ],
  ])('%s loads the same Puzzle', (_format, text) => {
    expect(asText(parsed(text))).toBe(expected);
    expect(parsed(text)).toEqual(parsed(SAMPLE_A_ZEROS));
  });

  it('Sample A loads identically from its 0-notation and its --notation forms', () => {
    expect(parsed(SAMPLE_A_DASHES)).toEqual(parsed(SAMPLE_A_ZEROS));
  });

  it('Sample A loads identically from its .-notation form', () => {
    expect(parsed(SAMPLE_A_DOTS)).toEqual(parsed(SAMPLE_A_ZEROS));
  });
});

describe('parsePuzzle: parse error for a character other than 1–9, ., 0, -', () => {
  it.each(['x', 'Z', '|', '+', '*', '_', ';', '#'])('rejects %s, naming the character and its row and column', (char) => {
    expect(parseErrorFor(withCharAt(SAMPLE_A_ZEROS, 0, char))).toBe(`unexpected '${char}' at row 1, column 1`);
  });

  it("names a character in the first cell as \"unexpected 'Z' at row 1, column 1\"", () => {
    expect(parseErrorFor(withCharAt(SAMPLE_A_ZEROS, 0, 'Z'))).toBe("unexpected 'Z' at row 1, column 1");
  });

  it("names a character in cell 41 as \"unexpected 'x' at row 5, column 5\"", () => {
    expect(parseErrorFor(withCharAt(SAMPLE_A_ZEROS, 40, 'x'))).toBe("unexpected 'x' at row 5, column 5");
  });

  it('names a character in the last cell as row 9, column 9', () => {
    expect(parseErrorFor(withCharAt(SAMPLE_A_ZEROS, 80, 'x'))).toBe("unexpected 'x' at row 9, column 9");
  });

  it('counts the row and column after removing whitespace and commas, nine cells to a row', () => {
    // Space- and comma-separated, on lines of a different length than nine, so
    // only the cleaned index gives row 2, column 3.
    const cells = withCharAt(SAMPLE_A_ZEROS, 11, 'x').split('');
    const text = Array.from({ length: 27 }, (_, i) => cells.slice(i * 3, i * 3 + 3).join(', ')).join('\n');
    expect(parseErrorFor(text)).toBe("unexpected 'x' at row 2, column 3");
  });

  it('names only the first of several bad characters', () => {
    const text = withCharAt(withCharAt(withCharAt(SAMPLE_A_ZEROS, 3, 'Z'), 40, 'Q'), 70, '#');
    const message = parseErrorFor(text);
    expect(message).toBe("unexpected 'Z' at row 1, column 4");
    expect(message).not.toContain('Q');
    expect(message).not.toContain('#');
  });

  it('rejects a bordered grid, since | and + are not cell characters', () => {
    const bordered = [
      '+-------+-------+-------+',
      '| . 2 . | . 6 . | . 8 . |',
      '| 7 . . | . . 1 | . . 9 |',
      '| . . . | 8 . 9 | . . . |',
      '+-------+-------+-------+',
      '| . 7 2 | . . . | 6 . . |',
      '| 1 . . | . . . | . . 7 |',
      '| . . 5 | . . . | 9 3 . |',
      '+-------+-------+-------+',
      '| . . . | 3 . 7 | . . . |',
      '| 3 . . | 5 . . | . . 4 |',
      '| . 1 . | . 2 . | . 6 . |',
      '+-------+-------+-------+',
    ].join('\n');
    expect(parsePuzzle(bordered).ok).toBe(false);
  });

  it('rejects a letter O in place of a 0', () => {
    expect(parseErrorFor('O' + SAMPLE_A_ZEROS.slice(1))).toBe("unexpected 'O' at row 1, column 1");
  });
});

describe('parsePuzzle: parse error for other than 81 cells', () => {
  it('rejects 79 cells, stating the count: "found 79 cells, expected 81"', () => {
    expect(parseErrorFor(SAMPLE_A_ZEROS.slice(0, 79))).toBe('found 79 cells, expected 81');
  });

  it('rejects 80 cells, stating the count', () => {
    expect(parseErrorFor(SAMPLE_A_ZEROS.slice(0, 80))).toBe('found 80 cells, expected 81');
  });

  it('rejects 82 cells, stating the count', () => {
    expect(parseErrorFor(SAMPLE_A_ZEROS + '.')).toBe('found 82 cells, expected 81');
  });

  it('rejects empty text, stating the count', () => {
    expect(parseErrorFor('')).toBe('found 0 cells, expected 81');
  });

  it('rejects text of only whitespace and commas, stating the count', () => {
    expect(parseErrorFor(' \n\t,, \r\n')).toBe('found 0 cells, expected 81');
  });

  it('counts cells after removing whitespace and commas', () => {
    const text = rowsOf(SAMPLE_A_ZEROS.slice(0, 79) + '  ')
      .map((row) => row.split('').join(','))
      .join('\n');
    expect(parseErrorFor(text)).toBe('found 79 cells, expected 81');
  });
});

describe('parsePuzzle: wrong count and a bad character together', () => {
  it('reports both errors, the wrong-count error first, then the bad-character error', () => {
    const text = withCharAt(SAMPLE_A_ZEROS.slice(0, 79), 40, 'x');
    expect(parseErrorsFor(text)).toEqual(['found 79 cells, expected 81', "unexpected 'x' at row 5, column 5"]);
  });

  it('counts a bad character as a cell', () => {
    // 80 valid characters plus one bad one: 81 cells, so no count error.
    expect(parseErrorsFor(withCharAt(SAMPLE_A_ZEROS, 40, 'x'))).toEqual(["unexpected 'x' at row 5, column 5"]);
    // 78 valid characters plus one bad one: 79 cells.
    const short = withCharAt(SAMPLE_A_ZEROS.slice(0, 79), 0, 'Z');
    expect(parseErrorsFor(short)[0]).toBe('found 79 cells, expected 81');
  });

  it('names only the first of several bad characters after the count error', () => {
    const text = withCharAt(withCharAt(SAMPLE_A_ZEROS.slice(0, 79), 2, 'Z'), 50, 'Q');
    expect(parseErrorsFor(text)).toEqual(['found 79 cells, expected 81', "unexpected 'Z' at row 1, column 3"]);
  });
});
