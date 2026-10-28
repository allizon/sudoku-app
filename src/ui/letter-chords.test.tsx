// Letter chords through the keyboard: holding C or S toggles Center marks or Corner marks without
// changing the Sticky mode, the Entry mode line follows the chord while its letter is held, and a
// window blur releases it (TASK-7, AC #1-#10; keymap.md §1, §2, §3, §7).
//
// Same page assumptions as entry-mode.test.tsx: the Entry mode line is the element with class
// "entry-mode-line" carrying data-entry-mode; Center marks and Corner marks are drawn in ".center-marks"
// and ".corner-marks"; a cell's accessible name lists what it holds ("center marks 1 4 7").
// A chord letter is held from its keydown until its keyup (or until the window loses focus, fired here as
// a blur event on window). Keys are fired with both `key` (the character produced) and `code` (the
// physical key).
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

/** Every cell's accessible name, row by row: a snapshot of what the grid holds. */
const gridNames = (grid: HTMLElement) =>
  cellsByRow(grid)
    .flat()
    .map((cell) => cell.getAttribute('aria-label'));

/** Presses (keydown only) on whatever has focus; returns false when the app called preventDefault. */
function press(key: string, init: KeyInit = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
}

/** Releases a key on whatever has focus. */
function release(key: string, init: KeyInit = {}) {
  fireEvent.keyUp(document.activeElement ?? document.body, { key, ...init });
}

/** Presses and releases a letter key by its physical key. */
function tap(key: string, code: string, init: KeyInit = {}) {
  const notPrevented = press(key, { code, ...init });
  release(key, { code, ...init });
  return notPrevented;
}

const pressN = () => tap('n', 'KeyN');

/** Holds C down (keydown only). */
const holdC = (init: KeyInit = {}) => press('c', { code: 'KeyC', ...init });
/** Releases C. */
const releaseC = (init: KeyInit = {}) => release('c', { code: 'KeyC', ...init });
/** Holds S down (keydown only). */
const holdS = (init: KeyInit = {}) => press('s', { code: 'KeyS', ...init });
/** Releases S. */
const releaseS = (init: KeyInit = {}) => release('s', { code: 'KeyS', ...init });

/** Presses a digit by its physical key, producing the plain character. */
const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });

/** The window loses focus (e.g. the player switches to another app). */
const blurWindow = () => act(() => void fireEvent.blur(window));

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
type Mode = (typeof MODES)[number];

/** Checks the Entry mode line shows exactly this mode, by attribute and by the word it shows. */
function expectEntryMode(mode: Mode) {
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

/** Sets the Sticky mode with N from fill, checking it took. */
function toSticky(mode: Mode) {
  const presses = { fill: 0, center: 1, corner: 2 }[mode];
  for (let i = 0; i < presses; i += 1) pressN();
  expectEntryMode(mode);
}

afterEach(cleanup);

describe('Letter chords: while C is held, each digit press toggles that digit as a Center mark in the Selected cell (AC #1)', () => {
  it('in fill mode, holding C and pressing 5 draws Center mark 5 and places no digit', () => {
    const grid = renderApp();
    holdC();
    pressDigit(5);
    releaseC();
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBe('5');
    expect(cell).toHaveAccessibleName('Row 1, column 1, center marks 5');
    expect(cell).not.toHaveClass('placed');
    expect(cornerMarksText(cell)).toBeUndefined();
  });

  it('pressing the same digit again during the chord removes the Center mark', () => {
    const grid = renderApp();
    holdC();
    pressDigit(5);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    pressDigit(5);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('a C chord removes a Center mark made earlier in center mode', () => {
    const grid = renderApp();
    toSticky('center');
    pressDigit(5);
    pressN();
    pressN(); // back to fill
    holdC();
    pressDigit(5);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('the Center mark goes in the Selected cell, wherever it was clicked', () => {
    const grid = renderApp();
    click(cellAt(grid, 6, 3));
    holdC();
    pressDigit(8);
    releaseC();
    expect(cellAt(grid, 6, 3)).toHaveAccessibleName('Row 7, column 4, center marks 8');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('no other cell changes', () => {
    const grid = renderApp();
    holdC();
    pressDigit(5);
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    const changed = cellsByRow(grid)
      .flat()
      .filter((cell) => cell.textContent !== '');
    expect(changed).toEqual([cellAt(grid, 0, 0)]);
  });

  it('numpad digits toggle Center marks during a C chord too', () => {
    const grid = renderApp();
    holdC();
    press('3', { code: 'Numpad3' });
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('3');
  });

  it('C is identified by physical key: KeyC starts a chord even on a layout where it types "j"', () => {
    const grid = renderApp();
    press('j', { code: 'KeyC' });
    pressDigit(5);
    release('j', { code: 'KeyC' });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 5');
  });

  it('C is identified by physical key: a different key that types "c" starts no chord, while KeyC does', () => {
    const grid = renderApp();
    press('c', { code: 'KeyJ' });
    pressDigit(5);
    release('c', { code: 'KeyJ' });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    press('ArrowRight');
    holdC();
    pressDigit(5);
    releaseC();
    expect(cellAt(grid, 0, 1)).toHaveAccessibleName('Row 1, column 2, center marks 5');
  });

  it('Shift+C starts a chord too, and Shift+digit during it toggles a Center mark', () => {
    const grid = renderApp();
    holdC({ shiftKey: true });
    press('!', { code: 'Digit1', shiftKey: true });
    releaseC({ shiftKey: true });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+C starts no chord and is left to the browser (so Cmd+C still copies); a plain C after it does', (_name, modifier) => {
    const grid = renderApp();
    const notPrevented = holdC(modifier);
    expect(notPrevented).toBe(true);
    expectEntryMode('fill');
    pressDigit(5); // C is still physically down, but no chord started
    releaseC(modifier);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    holdC();
    expectEntryMode('center');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+digit during a C chord adds no Center mark and is left to the browser', (_name, modifier) => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    const notPrevented = press('5', { code: 'Digit5', ...modifier });
    releaseC();
    expect(notPrevented).toBe(true);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('holding a digit during a C chord toggles once: the digit key auto-repeat is ignored', () => {
    const grid = renderApp();
    holdC();
    pressDigit(5);
    press('5', { code: 'Digit5', repeat: true });
    press('5', { code: 'Digit5', repeat: true });
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
  });
});

describe('Letter chords: while S is held, each digit press toggles that digit as a Corner mark in the Selected cell (AC #2)', () => {
  it('in fill mode, holding S and pressing 2 draws Corner mark 2 and places no digit', () => {
    const grid = renderApp();
    holdS();
    pressDigit(2);
    releaseS();
    const cell = cellAt(grid, 0, 0);
    expect(cornerMarksText(cell)).toBe('2');
    expect(cell).toHaveAccessibleName('Row 1, column 1, corner marks 2');
    expect(cell).not.toHaveClass('placed');
    expect(centerMarksText(cell)).toBeUndefined();
  });

  it('pressing the same digit again during the chord removes the Corner mark', () => {
    const grid = renderApp();
    holdS();
    pressDigit(2);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('2');
    pressDigit(2);
    releaseS();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('the Corner mark goes in the Selected cell, wherever it was clicked', () => {
    const grid = renderApp();
    click(cellAt(grid, 8, 8));
    holdS();
    pressDigit(9);
    releaseS();
    expect(cellAt(grid, 8, 8)).toHaveAccessibleName('Row 9, column 9, corner marks 9');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('numpad digits toggle Corner marks during an S chord too', () => {
    const grid = renderApp();
    holdS();
    press('6', { code: 'Numpad6' });
    releaseS();
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('6');
  });

  it('S is identified by physical key: KeyS starts a chord even on a layout where it types "o"', () => {
    const grid = renderApp();
    press('o', { code: 'KeyS' });
    pressDigit(5);
    release('o', { code: 'KeyS' });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 5');
  });

  it('S is identified by physical key: a different key that types "s" starts no chord, while KeyS does', () => {
    const grid = renderApp();
    press('s', { code: 'Semicolon' }); // where Dvorak puts "s"
    pressDigit(5);
    release('s', { code: 'Semicolon' });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    press('ArrowRight');
    holdS();
    pressDigit(5);
    releaseS();
    expect(cellAt(grid, 0, 1)).toHaveAccessibleName('Row 1, column 2, corner marks 5');
  });

  it('Shift+S starts a chord too, and Shift+digit during it toggles a Corner mark', () => {
    const grid = renderApp();
    holdS({ shiftKey: true });
    press('@', { code: 'Digit2', shiftKey: true });
    releaseS({ shiftKey: true });
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 2');
  });

  it.each([
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const)('%s+S starts no chord and is left to the browser (so Cmd+S still saves); a plain S after it does', (_name, modifier) => {
    const grid = renderApp();
    const notPrevented = holdS(modifier);
    expect(notPrevented).toBe(true);
    expectEntryMode('fill');
    pressDigit(5);
    releaseS(modifier);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    holdS();
    expectEntryMode('corner');
  });
});

describe('Letter chords: several digits can be pressed during one chord (AC #3)', () => {
  it('hold C, press 1, 4, 7 → three Center marks toggled', () => {
    const grid = renderApp();
    holdC();
    pressDigit(1);
    pressDigit(4);
    pressDigit(7);
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('147');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1 4 7');
  });

  it('hold S, press 8, 2, 6 → three Corner marks toggled, drawn in ascending order', () => {
    const grid = renderApp();
    holdS();
    pressDigit(8);
    pressDigit(2);
    pressDigit(6);
    releaseS();
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('268');
  });

  it('digits pressed during one chord can go in different cells as the Selected cell moves', () => {
    const grid = renderApp();
    holdC();
    pressDigit(1);
    press('ArrowRight');
    pressDigit(2);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1');
    expect(cellAt(grid, 0, 1)).toHaveAccessibleName('Row 1, column 2, center marks 2');
  });

  it('a second chord after releasing the first works the same way', () => {
    const grid = renderApp();
    holdC();
    pressDigit(1);
    releaseC();
    holdC();
    pressDigit(4);
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('14');
  });
});

describe('Letter chords: pressing and releasing C or S with no digit does nothing (AC #4)', () => {
  // Each test checks the chord was live between press and release, so "nothing" is about the chord.
  const LETTERS = [
    ['C', holdC, releaseC, 'center'],
    ['S', holdS, releaseS, 'corner'],
  ] as const;

  it.each(LETTERS)('pressing and releasing %s on a pasted Puzzle leaves every cell as it was', (_letter, hold, letGo, chordMode) => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 4, 4));
    const before = gridNames(grid);
    hold();
    expectEntryMode(chordMode);
    letGo();
    expect(gridNames(grid)).toEqual(before);
  });

  it.each(LETTERS)('pressing and releasing %s does not move the Selected cell', (_letter, hold, letGo, chordMode) => {
    const grid = renderApp();
    click(cellAt(grid, 4, 4));
    hold();
    expectEntryMode(chordMode);
    letGo();
    expect(cellAt(grid, 4, 4)).toHaveAttribute('aria-selected', 'true');
  });

  it.each(LETTERS)('after pressing and releasing %s in fill mode, the next digit places a digit', (_letter, hold, letGo, chordMode) => {
    const grid = renderApp();
    hold();
    expectEntryMode(chordMode);
    letGo();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it.each(LETTERS)('after pressing and releasing %s, the Entry mode line shows the Sticky mode again', (_letter, hold, letGo, chordMode) => {
    renderApp();
    toSticky(chordMode === 'center' ? 'corner' : 'center');
    hold();
    expectEntryMode(chordMode);
    letGo();
    expectEntryMode(chordMode === 'center' ? 'corner' : 'center');
  });
});

describe('Letter chords: key auto-repeat from a held C or S is ignored (AC #5)', () => {
  it('auto-repeat from a held C keeps the chord going: a digit after repeats still toggles a Center mark', () => {
    const grid = renderApp();
    holdC();
    for (let i = 0; i < 3; i += 1) holdC({ repeat: true });
    pressDigit(5);
    expectEntryMode('center');
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 5');
  });

  it('auto-repeat from a held S keeps the chord going: a digit after repeats still toggles a Corner mark', () => {
    const grid = renderApp();
    holdS();
    for (let i = 0; i < 3; i += 1) holdS({ repeat: true });
    pressDigit(5);
    expectEntryMode('corner');
    releaseS();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 5');
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('after holding %s with auto-repeat, one release ends the chord', (letter, hold, letGo) => {
    const grid = renderApp();
    hold();
    hold({ repeat: true });
    hold({ repeat: true });
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
    letGo();
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('holding %s with auto-repeat and no digit changes nothing in the grid', (letter, hold, letGo) => {
    const grid = renderApp();
    paste(puzzle1);
    const before = gridNames(grid);
    hold();
    for (let i = 0; i < 5; i += 1) hold({ repeat: true });
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
    letGo();
    expect(gridNames(grid)).toEqual(before);
    expectEntryMode('fill');
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('a repeat keydown of %s on its own starts no chord; a first press afterwards does', (letter, hold, letGo) => {
    const grid = renderApp();
    hold({ repeat: true });
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    letGo();
    hold();
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
  });
});

describe('Letter chords: when the window loses focus, any held chord is released (AC #6)', () => {
  it('holding C, then the window loses focus: the next digit uses the Sticky mode', () => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    blurWindow();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('holding S, then the window loses focus: the next digit uses the Sticky mode', () => {
    const grid = renderApp();
    toSticky('center');
    holdS();
    expectEntryMode('corner');
    blurWindow();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 5');
  });

  it.each([
    ['C', holdC],
    ['S', holdS],
  ] as const)('holding %s, the Entry mode line reverts to the Sticky mode when the window loses focus', (letter, hold) => {
    renderApp();
    hold();
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
    blurWindow();
    expectEntryMode('fill');
  });

  it('holding C and S, the window losing focus releases both: digits work in the Sticky mode again', () => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    holdS();
    blurWindow();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
    expectEntryMode('fill');
  });

  it('after the window loses focus, a fresh press of C starts a new chord', () => {
    const grid = renderApp();
    holdC();
    blurWindow();
    releaseC(); // a late release, e.g. on coming back, does no harm
    holdC();
    pressDigit(5);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 5');
  });

  it('after the window loses focus, auto-repeat from a C still held does not restart the chord', () => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    blurWindow();
    holdC({ repeat: true });
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Letter chords: a chord overrides the Sticky mode only for its digit presses; the Sticky mode is unchanged afterwards (AC #7)', () => {
  it('in center mode, an S chord toggles a Corner mark, and after release digits toggle Center marks again', () => {
    const grid = renderApp();
    toSticky('center');
    holdS();
    pressDigit(2);
    releaseS();
    pressDigit(1);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1, corner marks 2');
    expectEntryMode('center');
  });

  it('in corner mode, a C chord toggles a Center mark, and after release digits toggle Corner marks again', () => {
    const grid = renderApp();
    toSticky('corner');
    holdC();
    pressDigit(1);
    releaseC();
    pressDigit(2);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1, corner marks 2');
    expectEntryMode('corner');
  });

  it('in fill mode, a C chord toggles a Center mark, and after release a digit places a digit again', () => {
    const grid = renderApp();
    holdC();
    pressDigit(1);
    releaseC();
    press('ArrowRight');
    pressDigit(2);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1');
    expect(cellAt(grid, 0, 1)).toHaveAccessibleName('Row 1, column 2, placed 2');
  });

  it.each(MODES)('one N after a chord moves the Sticky mode one step on from %s, as if no chord had happened', (sticky) => {
    renderApp();
    toSticky(sticky);
    holdC();
    pressDigit(1);
    expectEntryMode('center');
    releaseC();
    holdS();
    pressDigit(2);
    expectEntryMode('corner');
    releaseS();
    pressN();
    expectEntryMode({ fill: 'center', center: 'corner', corner: 'fill' }[sticky] as Mode);
  });
});

describe('Letter chords: while C and S are both held, digit presses do nothing (AC #8)', () => {
  it.each(MODES)('in %s mode, holding C then S, digits change nothing in the grid', (sticky) => {
    const grid = renderApp();
    toSticky(sticky);
    const before = gridNames(grid);
    holdC();
    holdS();
    pressDigit(1);
    pressDigit(5);
    expect(gridNames(grid)).toEqual(before);
  });

  it.each(MODES)('in %s mode, holding S then C, digits change nothing in the grid', (sticky) => {
    const grid = renderApp();
    toSticky(sticky);
    const before = gridNames(grid);
    holdS();
    holdC();
    pressDigit(1);
    pressDigit(5);
    expect(gridNames(grid)).toEqual(before);
  });

  it('with both held, a digit does not remove a Placed digit (fill mode does not apply either)', () => {
    const grid = renderApp();
    pressDigit(5);
    holdC();
    holdS();
    pressDigit(5);
    pressDigit(6);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('releasing S while C stays held: digits toggle Center marks again', () => {
    const grid = renderApp();
    holdC();
    holdS();
    pressDigit(1);
    releaseS();
    pressDigit(4);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 4');
  });

  it('releasing C while S stays held: digits toggle Corner marks again', () => {
    const grid = renderApp();
    holdC();
    holdS();
    pressDigit(1);
    releaseC();
    pressDigit(4);
    releaseS();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, corner marks 4');
  });

  it('releasing both: digits use the Sticky mode again', () => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    holdS();
    releaseS();
    releaseC();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Letter chords: during a chord, a digit press on a Given or a Placed digit does nothing (AC #9)', () => {
  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('holding %s, a digit on a Given leaves it as it was and adds no Candidate', (letter, hold, letGo) => {
    const grid = renderApp();
    paste(puzzle1); // row 1, column 3 is the Given 3
    click(cellAt(grid, 0, 2));
    hold();
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
    pressDigit(5);
    pressDigit(3);
    letGo();
    const cell = cellAt(grid, 0, 2);
    expect(cell).toHaveAccessibleName('Row 1, column 3, given 3');
    expect(cell.textContent).toBe('3');
    expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('holding %s in fill mode, a digit on a Placed digit neither replaces nor removes it', (letter, hold, letGo) => {
    const grid = renderApp();
    pressDigit(5);
    hold();
    expectEntryMode(letter === 'C' ? 'center' : 'corner');
    pressDigit(2); // would replace it in fill mode
    pressDigit(5); // would remove it in fill mode
    letGo();
    const cell = cellAt(grid, 0, 0);
    expect(cell).toHaveAccessibleName('Row 1, column 1, placed 5');
    expect(cell.textContent).toBe('5');
    expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('holding %s, digits on a Placed digit do not change its hidden Candidates', (_letter, hold, letGo) => {
    const grid = renderApp();
    holdC();
    pressDigit(1);
    releaseC();
    holdS();
    pressDigit(2);
    releaseS();
    pressDigit(5); // fill mode: places 5 over Center mark 1 and Corner mark 2
    hold();
    pressDigit(1); // would remove Center mark 1 if it acted
    pressDigit(2); // would remove Corner mark 2 if it acted
    pressDigit(3); // would add a Candidate 3 if it acted
    letGo();
    pressDigit(5); // remove the Placed digit
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 1, corner marks 2');
  });
});

describe('Entry mode line: while C or S is held it shows the chord\'s mode, and on release it reverts to the Sticky mode (AC #10)', () => {
  it.each(['fill', 'corner'] as const)('in %s mode, the line shows center as soon as C goes down, before any digit', (sticky) => {
    renderApp();
    toSticky(sticky);
    holdC();
    expectEntryMode('center');
  });

  it.each(['fill', 'center'] as const)('in %s mode, the line shows corner as soon as S goes down, before any digit', (sticky) => {
    renderApp();
    toSticky(sticky);
    holdS();
    expectEntryMode('corner');
  });

  it.each(['fill', 'corner'] as const)('in %s mode, the line reverts to the Sticky mode as soon as C is released', (sticky) => {
    renderApp();
    toSticky(sticky);
    holdC();
    expectEntryMode('center');
    releaseC();
    expectEntryMode(sticky);
  });

  it.each(['fill', 'center'] as const)('in %s mode, the line reverts to the Sticky mode as soon as S is released', (sticky) => {
    renderApp();
    toSticky(sticky);
    holdS();
    expectEntryMode('corner');
    releaseS();
    expectEntryMode(sticky);
  });

  it('the line keeps showing the chord\'s mode through digit presses during the chord', () => {
    renderApp();
    holdC();
    pressDigit(1);
    expectEntryMode('center');
    pressDigit(4);
    expectEntryMode('center');
    releaseC();
    expectEntryMode('fill');
  });

  it('releasing C with Shift now held still ends the chord and reverts the line', () => {
    const grid = renderApp();
    holdC();
    expectEntryMode('center');
    releaseC({ shiftKey: true });
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('releasing C on a layout where KeyC types another letter still ends the chord', () => {
    renderApp();
    press('j', { code: 'KeyC' });
    expectEntryMode('center');
    release('j', { code: 'KeyC' });
    expectEntryMode('fill');
  });

  it('after C and S are both released, the line shows the Sticky mode', () => {
    renderApp();
    toSticky('corner');
    holdC();
    expectEntryMode('center');
    holdS();
    releaseC();
    releaseS();
    expectEntryMode('corner');
  });

  it('after S is released while C stays held, the line shows center', () => {
    renderApp();
    holdC();
    holdS();
    releaseS();
    expectEntryMode('center');
  });

  it('after C is released while S stays held, the line shows corner', () => {
    renderApp();
    holdS();
    holdC();
    releaseC();
    expectEntryMode('corner');
  });
});
