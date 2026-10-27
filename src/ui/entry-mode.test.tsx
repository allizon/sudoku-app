// Entry modes through the keyboard: N cycles the Sticky mode, the Entry mode line shows it, and digit
// keys toggle Center marks and Corner marks (TASK-6, AC #1-#11; keymap.md §1, §2, §7, §8).
//
// What these tests assume of the page:
// - The Entry mode line is the element with class "entry-mode-line", outside the grid and after it.
//   It carries data-entry-mode="fill" | "center" | "corner", and its text names the mode.
// - A cell's Center marks are drawn inside it in an element with class "center-marks", whose text is
//   the digits in ascending order; Corner marks likewise in an element with class "corner-marks".
// - A cell's accessible name lists its Candidates: "Row 1, column 1, center marks 1 4 7",
//   "Row 1, column 1, corner marks 2 8", or both: "Row 1, column 1, center marks 1 2, corner marks 3 9".
//   A cell with a Placed digit is named for the digit only ("placed 5"), as in fill-mode.test.tsx.
// - Hidden Candidates are not drawn at all: a cell with a Placed digit shows only that digit.
// Keys are fired as keydown events with both `key` (the character produced) and `code` (the physical key).
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import type { Store } from '../core/store';
import { App } from './App';

type KeyInit = { code?: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; repeat?: boolean };

function memoryStore(): Store {
  const saved = new Map<string, unknown>();
  return { get: (key) => saved.get(key), set: (key, value) => void saved.set(key, value) };
}

function renderApp(store: Store = memoryStore()) {
  render(<App store={store} />);
  return screen.getByRole('grid');
}

function cellsByRow(grid: HTMLElement): HTMLElement[][] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('gridcell'));
}

/** The cell at a 0-based row and column. */
function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = cellsByRow(grid)[row]?.[column];
  if (cell === undefined) throw new Error(`no cell at ${row}, ${column}`);
  return cell;
}

/** Presses (keydown only) on whatever has focus; returns false when the app called preventDefault. */
function press(key: string, init: KeyInit = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
}

/** Releases a key on whatever has focus. */
function release(key: string, init: KeyInit = {}) {
  fireEvent.keyUp(document.activeElement ?? document.body, { key, ...init });
}

/** Presses and releases a letter key by its physical key, e.g. tap('n', 'KeyN'). */
function tap(key: string, code: string, init: KeyInit = {}) {
  const notPrevented = press(key, { code, ...init });
  release(key, { code, ...init });
  return notPrevented;
}

/** Presses N once: the Sticky mode moves one step along fill → center → corner → fill. */
const pressN = () => tap('n', 'KeyN');

/** Presses a digit by its physical key, producing the plain character. */
const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });

function click(cell: HTMLElement) {
  fireEvent.mouseDown(cell);
  fireEvent.mouseUp(cell);
  fireEvent.click(cell);
}

function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

/** The Entry mode line; fails when there is none, or more than one. */
function entryModeLine(): HTMLElement {
  const lines = document.querySelectorAll<HTMLElement>('.entry-mode-line');
  expect(lines, 'the page has exactly one Entry mode line').toHaveLength(1);
  return lines[0] as HTMLElement;
}

const MODES = ['fill', 'center', 'corner'] as const;

/** Checks the Entry mode line shows exactly this mode, by attribute and by the word it shows. */
function expectEntryMode(mode: (typeof MODES)[number]) {
  const line = entryModeLine();
  expect(line).toHaveAttribute('data-entry-mode', mode);
  const text = (line.textContent ?? '').toLowerCase();
  expect(text).toMatch(new RegExp(`\\b${mode}\\b`));
  for (const other of MODES) if (other !== mode) expect(text).not.toMatch(new RegExp(`\\b${other}\\b`));
}

/** The text of a cell's Center marks, or undefined when none are drawn. */
const centerMarksText = (cell: HTMLElement) => cell.querySelector('.center-marks')?.textContent ?? undefined;
/** The text of a cell's Corner marks, or undefined when none are drawn. */
const cornerMarksText = (cell: HTMLElement) => cell.querySelector('.corner-marks')?.textContent ?? undefined;

/** Switches the Sticky mode from fill to center (one N), checking the switch happened. */
const toCenter = () => {
  pressN();
  expectEntryMode('center');
};
/** Switches the Sticky mode from fill to corner (two Ns), checking the switch happened. */
const toCorner = () => {
  pressN();
  pressN();
  expectEntryMode('corner');
};

afterEach(cleanup);

describe('Entry mode: the app starts in fill mode (AC #1)', () => {
  it('on opening, the Entry mode line shows fill', () => {
    renderApp();
    expectEntryMode('fill');
  });

  it('on opening, a digit key places a Placed digit', () => {
    const grid = renderApp();
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('after a reload, the app starts in fill mode again even if center mode was chosen before', () => {
    const store = memoryStore();
    renderApp(store);
    toCenter();
    expectEntryMode('center');
    cleanup();
    renderApp(store);
    expectEntryMode('fill');
  });
});

describe('Sticky mode: N cycles fill → center → corner → fill (AC #2)', () => {
  it('pressing N once switches to center mode', () => {
    renderApp();
    pressN();
    expectEntryMode('center');
  });

  it('pressing N twice switches to corner mode', () => {
    renderApp();
    pressN();
    pressN();
    expectEntryMode('corner');
  });

  it('pressing N three times comes back to fill mode', () => {
    renderApp();
    pressN();
    pressN();
    pressN();
    expectEntryMode('fill');
  });

  it('pressing N a fourth time starts the cycle again at center mode', () => {
    renderApp();
    for (let i = 0; i < 4; i += 1) pressN();
    expectEntryMode('center');
  });

  it('the Sticky mode stays in effect for every digit until N changes it', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(1);
    click(cellAt(grid, 5, 5));
    pressDigit(2);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1');
    expect(cellAt(grid, 5, 5)).toHaveAccessibleName('Row 6, column 6, center marks 2');
    expectEntryMode('center');
  });

  it('pressing N changes nothing in the grid and does not move the Selected cell', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 4, 4));
    const before = cellsByRow(grid)
      .flat()
      .map((cell) => cell.getAttribute('aria-label'));
    pressN();
    pressN();
    const after = cellsByRow(grid)
      .flat()
      .map((cell) => cell.getAttribute('aria-label'));
    expect(after).toEqual(before);
    expect(cellAt(grid, 4, 4)).toHaveAttribute('aria-selected', 'true');
    expectEntryMode('corner');
  });

  it('Shift+N cycles too, as Shift+digit is still a digit press (keymap.md §1)', () => {
    renderApp();
    tap('N', 'KeyN', { shiftKey: true });
    expectEntryMode('center');
  });

  it('N is identified by physical key: the KeyN key cycles even on a layout where it types "b"', () => {
    renderApp();
    tap('b', 'KeyN');
    expectEntryMode('center');
  });

  it('N is identified by physical key: a different key that types "n" does not cycle', () => {
    renderApp();
    tap('n', 'KeyL'); // where Dvorak puts "n"
    expectEntryMode('fill');
  });

  it('holding N cycles once: key auto-repeat is ignored', () => {
    renderApp();
    press('n', { code: 'KeyN' });
    press('n', { code: 'KeyN', repeat: true });
    press('n', { code: 'KeyN', repeat: true });
    release('n', { code: 'KeyN' });
    expectEntryMode('center');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+N does not cycle the Sticky mode and is left to the browser', (_name, modifier) => {
    renderApp();
    const notPrevented = tap('n', 'KeyN', modifier);
    expect(notPrevented).toBe(true);
    expectEntryMode('fill');
  });

  it.each([
    ['C', 'KeyC'],
    ['S', 'KeyS'],
    ['X', 'KeyX'],
    ['I', 'KeyI'],
    ['M', 'KeyM'],
  ])('pressing and releasing %s does not change the Sticky mode', (letter, code) => {
    renderApp();
    toCenter();
    tap(letter.toLowerCase(), code);
    expectEntryMode('center');
  });
});

describe('Entry mode line: always visible under the grid, naming the current Entry mode (AC #3)', () => {
  it('the Entry mode line is outside the grid', () => {
    const grid = renderApp();
    expect(grid.contains(entryModeLine())).toBe(false);
  });

  it('the Entry mode line comes after the grid on the page', () => {
    const grid = renderApp();
    expect(grid.compareDocumentPosition(entryModeLine()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the Entry mode line is shown both before and after a Puzzle is pasted', () => {
    renderApp();
    expectEntryMode('fill');
    paste(puzzle1);
    expectEntryMode('fill');
  });

  it('the Entry mode line is not hidden from view or from assistive technology', () => {
    renderApp();
    const line = entryModeLine();
    expect(line).not.toHaveAttribute('hidden');
    expect(line.closest('[aria-hidden="true"]')).toBeNull();
    expect(line).not.toHaveClass('visually-hidden');
  });

  it('the Entry mode line updates right away on every N, with no other event needed', () => {
    renderApp();
    press('n', { code: 'KeyN' });
    expectEntryMode('center');
    release('n', { code: 'KeyN' });
    expectEntryMode('center');
  });
});

describe('Center mode: a digit key toggles that digit as a Center mark in the Selected cell (AC #4)', () => {
  it('pressing 1, 4, 7 in center mode draws Center marks 1 4 7 in the Selected cell', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(1);
    pressDigit(4);
    pressDigit(7);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('147');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1 4 7');
  });

  it('Center marks are drawn in ascending order whatever order they were pressed in', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(7);
    pressDigit(1);
    pressDigit(4);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('147');
  });

  it('pressing a Center mark digit again removes it', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(1);
    pressDigit(4);
    pressDigit(4);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('1');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1');
  });

  it('removing the only Center mark leaves the cell empty', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('a digit in center mode places no digit', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).not.toHaveClass('placed');
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
  });

  it('the Center mark goes in the Selected cell, wherever it was moved or clicked', () => {
    const grid = renderApp();
    toCenter();
    click(cellAt(grid, 6, 3));
    pressDigit(8);
    press('ArrowRight');
    pressDigit(2);
    expect(cellAt(grid, 6, 3)).toHaveAccessibleName('Row 7, column 4, center marks 8');
    expect(cellAt(grid, 6, 4)).toHaveAccessibleName('Row 7, column 5, center marks 2');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('no other cell changes', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    const changed = cellsByRow(grid)
      .flat()
      .filter((cell) => cell.textContent !== '');
    expect(changed).toEqual([cellAt(grid, 0, 0)]);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
  });

  it('numpad digits toggle Center marks too', () => {
    const grid = renderApp();
    toCenter();
    press('3', { code: 'Numpad3' });
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('3');
    press('3', { code: 'Numpad3' });
    expect(centerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
  });

  it('Shift+digit toggles a Center mark like a plain digit (physical key)', () => {
    const grid = renderApp();
    toCenter();
    press('!', { code: 'Digit1', shiftKey: true });
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('1');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+digit in center mode adds no Center mark and is left to the browser', (_name, modifier) => {
    const grid = renderApp();
    toCenter();
    const notPrevented = press('5', { code: 'Digit5', ...modifier });
    expect(notPrevented).toBe(true);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('holding a digit in center mode toggles once: key auto-repeat is ignored', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    press('5', { code: 'Digit5', repeat: true });
    press('5', { code: 'Digit5', repeat: true });
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
  });
});

describe('Corner mode: a digit key toggles that digit as a Corner mark in the Selected cell (AC #5)', () => {
  it('pressing 2, 8 in corner mode draws Corner marks 2 8 in the Selected cell', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(2);
    pressDigit(8);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('28');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 2 8');
  });

  it('Corner marks are drawn in ascending order whatever order they were pressed in', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(8);
    pressDigit(2);
    pressDigit(6);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('268');
  });

  it('pressing a Corner mark digit again removes it', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(2);
    pressDigit(8);
    pressDigit(2);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('8');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 8');
  });

  it('removing the only Corner mark leaves the cell empty', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(5);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('5');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('a digit in corner mode places no digit and adds no Center mark', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).not.toHaveClass('placed');
    expect(centerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
  });

  it('the Corner mark goes in the Selected cell, wherever it was clicked', () => {
    const grid = renderApp();
    toCorner();
    click(cellAt(grid, 8, 8));
    pressDigit(9);
    expect(cellAt(grid, 8, 8)).toHaveAccessibleName('Row 9, column 9, corner marks 9');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('numpad digits toggle Corner marks too', () => {
    const grid = renderApp();
    toCorner();
    press('6', { code: 'Numpad6' });
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('6');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+digit in corner mode adds no Corner mark and is left to the browser', (_name, modifier) => {
    const grid = renderApp();
    toCorner();
    const notPrevented = press('5', { code: 'Digit5', ...modifier });
    expect(notPrevented).toBe(true);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('holding a digit in corner mode toggles once: key auto-repeat is ignored', () => {
    const grid = renderApp();
    toCorner();
    pressDigit(5);
    press('5', { code: 'Digit5', repeat: true });
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('5');
  });
});

describe('Candidates: a cell can hold Center marks and Corner marks at the same time (AC #6)', () => {
  it('Center marks 1 2 and Corner marks 3 9 are both drawn in one cell', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(1);
    pressDigit(2);
    pressN(); // corner
    pressDigit(3);
    pressDigit(9);
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBe('12');
    expect(cornerMarksText(cell)).toBe('39');
    expect(cell).toHaveAccessibleName('Row 1, column 1, center marks 1 2, corner marks 3 9');
  });

  it('the same digit can be both a Center mark and a Corner mark', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    pressN(); // corner
    pressDigit(5);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('5');
  });

  it('toggling a Corner mark off leaves the Center marks drawn', () => {
    const grid = renderApp();
    toCenter();
    pressDigit(5);
    pressN(); // corner
    pressDigit(5);
    pressDigit(5);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
  });
});

describe('Candidates: Center marks and Corner marks are drawn apart from each other and from digits (AC #7)', () => {
  /** A Puzzle pasted, with Center marks 1 2 and Corner marks 3 at row 1, column 1, and a Placed 9 at row 1, column 2. */
  function setUp() {
    const grid = renderApp();
    paste(puzzle1); // row 1: columns 1 and 2 empty, column 3 is the Given 3
    toCenter();
    pressDigit(1);
    pressDigit(2);
    pressN(); // corner
    pressDigit(3);
    pressN(); // fill
    expectEntryMode('fill');
    press('ArrowRight');
    pressDigit(9);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1 2, corner marks 3');
    return grid;
  }

  it('Center marks and Corner marks are drawn in separate elements', () => {
    const grid = setUp();
    const center = cellAt(grid, 0, 0).querySelector('.center-marks');
    const corner = cellAt(grid, 0, 0).querySelector('.corner-marks');
    expect(center).not.toBeNull();
    expect(corner).not.toBeNull();
    expect(center?.contains(corner ?? null)).toBe(false);
    expect(corner?.contains(center ?? null)).toBe(false);
  });

  it('a cell holding only Candidates is styled as neither a Placed digit nor a Given', () => {
    const grid = setUp();
    const cell = cellAt(grid, 0, 0);
    expect(cell).not.toHaveClass('placed');
    expect(cell).not.toHaveClass('given');
    expect(cell.querySelector('.placed, .given')).toBeNull();
  });

  it('a cell holding only Candidates is not marked read-only', () => {
    const grid = setUp();
    expect(cellAt(grid, 0, 0)).not.toHaveAttribute('aria-readonly');
  });

  it('a Placed digit and a Given draw no Candidate elements', () => {
    const grid = setUp();
    for (const cell of [cellAt(grid, 0, 1), cellAt(grid, 0, 2)])
      expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
  });
});

describe('Candidates: in center or corner mode, a digit on a Given or a Placed digit does nothing (AC #8)', () => {
  it.each([
    ['center', toCenter],
    ['corner', toCorner],
  ] as const)('in %s mode, a digit on a Given leaves the Given as it was and adds no Candidate', (_mode, toMode) => {
    const grid = renderApp();
    paste(puzzle1); // row 1, column 3 is the Given 3
    click(cellAt(grid, 0, 2));
    toMode();
    pressDigit(5);
    pressDigit(3);
    const cell = cellAt(grid, 0, 2);
    expect(cell).toHaveAccessibleName('Row 1, column 3, given 3');
    expect(cell.textContent).toBe('3');
    expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
  });

  it.each([
    ['center', toCenter],
    ['corner', toCorner],
  ] as const)('in %s mode, a digit on a Placed digit leaves it as it was and adds no Candidate', (_mode, toMode) => {
    const grid = renderApp();
    pressDigit(5);
    toMode();
    pressDigit(2);
    pressDigit(5);
    const cell = cellAt(grid, 0, 0);
    expect(cell).toHaveAccessibleName('Row 1, column 1, placed 5');
    expect(cell.textContent).toBe('5');
    expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
  });

  it.each([
    ['center', toCenter],
    ['corner', toCorner],
  ] as const)('in %s mode, digits pressed on a Placed digit do not change its hidden Candidates', (_mode, toMode) => {
    const grid = renderApp();
    toCenter();
    pressDigit(1);
    pressN(); // corner
    pressDigit(2);
    pressN(); // fill
    pressDigit(5);
    toMode();
    pressDigit(1); // would remove Center mark 1 if it acted
    pressDigit(2); // would remove Corner mark 2 if it acted
    pressDigit(3); // would add a Candidate 3 if it acted
    for (let i = 0; i < (toMode === toCenter ? 2 : 1); i += 1) pressN(); // back to fill
    expectEntryMode('fill');
    pressDigit(5); // remove the Placed digit
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1, corner marks 2');
  });
});

/** Renders the app with Center marks 1 4 7 and Corner marks 2 8 at row 1, column 1, back in fill mode. */
function renderWithCandidates() {
  const grid = renderApp();
  toCenter();
  pressDigit(1);
  pressDigit(4);
  pressDigit(7);
  pressN(); // corner
  pressDigit(2);
  pressDigit(8);
  pressN(); // fill
  expectEntryMode('fill');
  return grid;
}

const WITH_CANDIDATES = 'Row 1, column 1, center marks 1 4 7, corner marks 2 8';

describe('Candidates: placing a digit in fill mode on a cell with Candidates hides them without deleting them (AC #9)', () => {
  it('the cell shows only the Placed digit', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    const cell = cellAt(grid, 0, 0);
    expect(cell.textContent).toBe('5');
    expect(cell).toHaveClass('placed');
  });

  it('no Candidate is drawn under the Placed digit', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    expect(cellAt(grid, 0, 0).querySelector('.center-marks, .corner-marks')).toBeNull();
  });

  it('the cell is named for its Placed digit only', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('placing a digit that is one of the Candidates shows only that digit too', () => {
    const grid = renderWithCandidates();
    pressDigit(4);
    expect(cellAt(grid, 0, 0).textContent).toBe('4');
  });
});

describe('Candidates: removing that Placed digit (toggle) makes the hidden Candidates reappear unchanged (AC #10)', () => {
  it('pressing the same digit again brings back Center marks 1 4 7 and Corner marks 2 8', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    pressDigit(5);
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBe('147');
    expect(cornerMarksText(cell)).toBe('28');
    expect(cell).toHaveAccessibleName(WITH_CANDIDATES);
    expect(cell).not.toHaveClass('placed');
  });

  it('after reappearing, the Candidates can be toggled again', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    pressDigit(5);
    toCenter();
    pressDigit(4);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1 7, corner marks 2 8');
  });
});

describe('Candidates: replacing that Placed digit with another keeps the Candidates hidden (AC #11)', () => {
  it('after replacing 5 with 6, the cell shows only 6', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    pressDigit(6);
    const cell = cellAt(grid, 0, 0);
    expect(cell.textContent).toBe('6');
    expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
    expect(cell).toHaveAccessibleName('Row 1, column 1, placed 6');
  });

  it('removing the replacement digit brings the original Candidates back unchanged', () => {
    const grid = renderWithCandidates();
    pressDigit(5);
    pressDigit(6);
    pressDigit(6);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName(WITH_CANDIDATES);
  });
});
