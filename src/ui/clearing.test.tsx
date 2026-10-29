// Clearing through the keyboard: Delete and Backspace clear one layer of the Selected cell, chosen by
// the Entry mode (the chord's while C or S is held, else the Sticky mode); X clears everything; a
// Given is never cleared (TASK-8, AC #1-#8; keymap.md §1, §2, §3, §5).
//
// Same page assumptions as entry-mode.test.tsx and letter-chords.test.tsx: a Placed digit is the cell's
// text with class "placed", a Given has class "given"; Center marks and Corner marks are drawn in
// ".center-marks" and ".corner-marks"; the Entry mode line carries data-entry-mode. Grid state is read
// from what the cells draw, not from accessible names. Keys are fired with both `key` and `code`:
// Delete/Backspace as key 'Delete'/'Backspace' with the same code; X by physical key (code 'KeyX').
//
// Every "does nothing" test also shows the same key clearing something first, so it cannot pass
// before clearing exists.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import type { Store } from '../core/store';
import { App } from './App';

type KeyInit = { code?: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; repeat?: boolean };

function memoryStore(): Store {
  const saved = new Map<string, unknown>();
  return { get: (key) => saved.get(key), set: (key, value) => void saved.set(key, value) };
}

function cellsByRow(grid: HTMLElement): HTMLElement[][] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('gridcell'));
}

function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = cellsByRow(grid)[row]?.[column];
  if (cell === undefined) throw new Error(`no cell at ${row}, ${column}`);
  return cell;
}

/** What every cell draws, row by row: its classes and its text. */
const gridDrawn = (grid: HTMLElement) =>
  cellsByRow(grid)
    .flat()
    .map((cell) => [cell.className, cell.textContent]);

/** Presses (keydown only) on whatever has focus; returns false when the app called preventDefault. */
function press(key: string, init: KeyInit = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
}

function release(key: string, init: KeyInit = {}) {
  fireEvent.keyUp(document.activeElement ?? document.body, { key, ...init });
}

/** Presses and releases a key; returns false when the app called preventDefault on the press. */
function tap(key: string, code: string, init: KeyInit = {}) {
  const notPrevented = press(key, { code, ...init });
  release(key, { code, ...init });
  return notPrevented;
}

const pressN = () => tap('n', 'KeyN');
const holdC = () => press('c', { code: 'KeyC' });
const releaseC = () => release('c', { code: 'KeyC' });
const holdS = () => press('s', { code: 'KeyS' });
const releaseS = () => release('s', { code: 'KeyS' });
const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });
const pressRight = () => press('ArrowRight', { code: 'ArrowRight' });

const pressDelete = (init: KeyInit = {}) => tap('Delete', 'Delete', init);
const pressBackspace = (init: KeyInit = {}) => tap('Backspace', 'Backspace', init);
const pressX = (init: KeyInit = {}) => tap('x', 'KeyX', init);

/** Delete and Backspace, which behave identically (AC #1). */
const DELETE_KEYS = [
  ['Delete', pressDelete],
  ['Backspace', pressBackspace],
] as const;

function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

type Mode = 'fill' | 'center' | 'corner';

const entryModeLine = () => document.querySelector<HTMLElement>('.entry-mode-line');
const expectEntryMode = (mode: Mode) => expect(entryModeLine()).toHaveAttribute('data-entry-mode', mode);

/** Sets the Sticky mode with N, starting from fill, and checks it took. */
function toSticky(mode: Mode) {
  const presses = { fill: 0, center: 1, corner: 2 }[mode];
  for (let i = 0; i < presses; i += 1) pressN();
  expectEntryMode(mode);
}

/** Cycles N from a Sticky mode back to fill. */
function backToFill(from: Mode) {
  const presses = { fill: 0, center: 2, corner: 1 }[from];
  for (let i = 0; i < presses; i += 1) pressN();
  expectEntryMode('fill');
}

const centerMarksText = (cell: HTMLElement) => cell.querySelector('.center-marks')?.textContent ?? undefined;
const cornerMarksText = (cell: HTMLElement) => cell.querySelector('.corner-marks')?.textContent ?? undefined;

/** Checks the cell draws nothing: no digit, no Candidates. */
function expectEmpty(cell: HTMLElement) {
  expect(cell.textContent).toBe('');
  expect(cell).not.toHaveClass('placed');
  expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
}

/** Checks the cell draws Placed digit 5 and nothing else. */
function expectPlaced5(cell: HTMLElement) {
  expect(cell).toHaveClass('placed');
  expect(cell.textContent).toBe('5');
  expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
}

/** Checks the cell draws Center marks 1 4 7 and Corner marks 2 8, and no Placed digit. */
function expectBothMarks(cell: HTMLElement) {
  expect(cell).not.toHaveClass('placed');
  expect(centerMarksText(cell)).toBe('147');
  expect(cornerMarksText(cell)).toBe('28');
}

/**
 * Renders the app with puzzle-1 pasted (row 1, column 1 is empty; row 1, column 3 holds Given 3),
 * the Selected cell at row 1, column 1, in fill mode.
 */
function renderPuzzle() {
  render(<App store={memoryStore()} />);
  const grid = screen.getByRole('grid');
  paste(puzzle1);
  expect(cellAt(grid, 0, 2)).toHaveClass('given');
  expectEmpty(cellAt(grid, 0, 0));
  expectEntryMode('fill');
  return grid;
}

/** Adds Center marks 1 4 7 and Corner marks 2 8 to the Selected cell, from and back to fill mode. */
function addBothMarks() {
  pressN(); // center
  for (const digit of [1, 4, 7]) pressDigit(digit);
  pressN(); // corner
  for (const digit of [2, 8]) pressDigit(digit);
  pressN(); // fill
  expectEntryMode('fill');
}

/** puzzle-1, with Center marks 1 4 7 and Corner marks 2 8 at row 1, column 1, in fill mode. */
function renderWithBothMarks() {
  const grid = renderPuzzle();
  addBothMarks();
  expectBothMarks(cellAt(grid, 0, 0));
  return grid;
}

/** As renderWithBothMarks, with Placed digit 5 over the marks. */
function renderPlacedOverBothMarks() {
  const grid = renderWithBothMarks();
  pressDigit(5);
  expectPlaced5(cellAt(grid, 0, 0));
  return grid;
}

afterEach(cleanup);

describe('Delete and Backspace behave identically (AC #1)', () => {
  it.each(['fill', 'center', 'corner'] as const)('in %s mode, Delete and Backspace leave the same grid', (mode) => {
    const results = DELETE_KEYS.map(([, pressKey]) => {
      const grid = mode === 'fill' ? renderPlacedOverBothMarks() : renderWithBothMarks();
      toSticky(mode);
      const before = gridDrawn(grid);
      pressKey();
      const after = gridDrawn(grid);
      expect(after).not.toEqual(before); // the key cleared something
      cleanup();
      return after;
    });
    expect(results[0]).toEqual(results[1]);
  });

  it.each(DELETE_KEYS)('%s is handled by the app (its default action is prevented)', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    expect(pressKey()).toBe(false);
    expectBothMarks(cellAt(grid, 0, 0));
  });
});

describe('In fill mode, Delete removes the Placed digit and reveals any hidden Candidates unchanged (AC #2)', () => {
  it.each(DELETE_KEYS)('%s removes a Placed digit hiding nothing, leaving the cell empty', (_name, pressKey) => {
    const grid = renderPuzzle();
    pressDigit(5);
    expectPlaced5(cellAt(grid, 0, 0));
    pressKey();
    expectEmpty(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s reveals the hidden Center marks 1 4 7 and Corner marks 2 8 unchanged', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    pressKey();
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s on a cell with only Candidates (no Placed digit) does nothing', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    pressKey(); // live: removes the Placed digit, revealing the marks
    expectBothMarks(cellAt(grid, 0, 0));
    pressKey(); // now there is no Placed digit
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s on an empty cell does nothing', (_name, pressKey) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressKey(); // live: removes the Placed digit
    expectEmpty(cellAt(grid, 0, 0));
    const before = gridDrawn(grid);
    pressKey();
    expect(gridDrawn(grid)).toEqual(before);
  });

  it.each(DELETE_KEYS)('%s leaves the Sticky mode and the Selected cell as they were', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    pressKey();
    expectBothMarks(cellAt(grid, 0, 0)); // the key acted
    expectEntryMode('fill');
    expect(cellAt(grid, 0, 0)).toHaveAttribute('aria-selected', 'true');
  });
});

describe('In center mode, or with C held, Delete removes all Center marks in the cell and leaves its Corner marks (AC #3)', () => {
  it.each(DELETE_KEYS)('%s in center mode removes Center marks 1 4 7 and keeps Corner marks 2 8', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    toSticky('center');
    pressKey();
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBeUndefined();
    expect(cornerMarksText(cell)).toBe('28');
    expectEntryMode('center');
  });

  it.each(DELETE_KEYS)('%s with C held in corner mode removes the Center marks, not the Corner marks', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    toSticky('corner');
    holdC();
    expectEntryMode('center');
    pressKey();
    releaseC();
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBeUndefined();
    expect(cornerMarksText(cell)).toBe('28');
    expectEntryMode('corner'); // the Sticky mode is unchanged
  });

  it.each(DELETE_KEYS)('%s with C held in fill mode removes the Center marks and keeps the Corner marks', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    holdC();
    pressKey();
    releaseC();
    const cell = cellAt(grid, 0, 0);
    expect(centerMarksText(cell)).toBeUndefined();
    expect(cornerMarksText(cell)).toBe('28');
    expectEntryMode('fill');
  });

  it.each(DELETE_KEYS)('%s in center mode on a cell with only Center marks leaves it empty', (_name, pressKey) => {
    const grid = renderPuzzle();
    toSticky('center');
    pressDigit(3);
    pressDigit(6);
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('36');
    pressKey();
    expectEmpty(cellAt(grid, 0, 0));
  });
});

describe('In corner mode, or with S held, Delete removes all Corner marks in the cell and leaves its Center marks (AC #4)', () => {
  it.each(DELETE_KEYS)('%s in corner mode removes Corner marks 2 8 and keeps Center marks 1 4 7', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    toSticky('corner');
    pressKey();
    const cell = cellAt(grid, 0, 0);
    expect(cornerMarksText(cell)).toBeUndefined();
    expect(centerMarksText(cell)).toBe('147');
    expectEntryMode('corner');
  });

  it.each(DELETE_KEYS)('%s with S held in center mode removes the Corner marks, not the Center marks', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    toSticky('center');
    holdS();
    expectEntryMode('corner');
    pressKey();
    releaseS();
    const cell = cellAt(grid, 0, 0);
    expect(cornerMarksText(cell)).toBeUndefined();
    expect(centerMarksText(cell)).toBe('147');
    expectEntryMode('center'); // the Sticky mode is unchanged
  });

  it.each(DELETE_KEYS)('%s with S held in fill mode removes the Corner marks and keeps the Center marks', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    holdS();
    pressKey();
    releaseS();
    const cell = cellAt(grid, 0, 0);
    expect(cornerMarksText(cell)).toBeUndefined();
    expect(centerMarksText(cell)).toBe('147');
    expectEntryMode('fill');
  });

  it.each(DELETE_KEYS)('%s in corner mode on a cell with only Corner marks leaves it empty', (_name, pressKey) => {
    const grid = renderPuzzle();
    toSticky('corner');
    pressDigit(2);
    pressDigit(8);
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('28');
    pressKey();
    expectEmpty(cellAt(grid, 0, 0));
  });
});

describe('On a cell holding a Placed digit, Delete in center or corner mode (or with C or S held) does nothing, and the hidden Candidates are kept (AC #5)', () => {
  // Each case ends by removing the Placed digit in fill mode with the same key, which must reveal every
  // hidden Candidate: that proves the key is live and that nothing hidden was deleted.
  it.each(DELETE_KEYS)('%s in center mode leaves the Placed digit, and its hidden Candidates are kept', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    toSticky('center');
    pressKey();
    expectPlaced5(cellAt(grid, 0, 0));
    backToFill('center');
    pressKey();
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s in corner mode leaves the Placed digit, and its hidden Candidates are kept', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    toSticky('corner');
    pressKey();
    expectPlaced5(cellAt(grid, 0, 0));
    backToFill('corner');
    pressKey();
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s with C held leaves the Placed digit, and its hidden Candidates are kept', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    holdC();
    expectEntryMode('center');
    pressKey();
    releaseC();
    expectPlaced5(cellAt(grid, 0, 0));
    pressKey(); // fill mode
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it.each(DELETE_KEYS)('%s with S held leaves the Placed digit, and its hidden Candidates are kept', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    holdS();
    expectEntryMode('corner');
    pressKey();
    releaseS();
    expectPlaced5(cellAt(grid, 0, 0));
    pressKey(); // fill mode
    expectBothMarks(cellAt(grid, 0, 0));
  });
});

describe('X clears everything from the Selected cell, including hidden Candidates, in any Entry mode (AC #6)', () => {
  it.each(['fill', 'center', 'corner'] as const)(
    'in %s mode, X on a Placed digit hiding Center marks and Corner marks empties the cell',
    (mode) => {
      const grid = renderPlacedOverBothMarks();
      toSticky(mode);
      pressX();
      expectEmpty(cellAt(grid, 0, 0));
      expectEntryMode(mode);
    },
  );

  it.each(['fill', 'center', 'corner'] as const)('in %s mode, X on a cell with Center marks and Corner marks empties it', (mode) => {
    const grid = renderWithBothMarks();
    toSticky(mode);
    pressX();
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('after X, placing and removing a digit reveals no Candidates (the hidden ones are gone)', () => {
    const grid = renderPlacedOverBothMarks();
    pressX();
    expectEmpty(cellAt(grid, 0, 0));
    pressDigit(5);
    pressDigit(5);
    expectEmpty(cellAt(grid, 0, 0));
  });

  it.each([
    ['C', holdC, releaseC],
    ['S', holdS, releaseS],
  ] as const)('with %s held, X still clears everything', (_letter, hold, letGo) => {
    const grid = renderPlacedOverBothMarks();
    hold();
    pressX();
    letGo();
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('X is handled by the app (its default action is prevented)', () => {
    const grid = renderPlacedOverBothMarks();
    expect(pressX()).toBe(false);
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('X is identified by physical key: the KeyX key clears even on a layout where it types "q"', () => {
    const grid = renderPlacedOverBothMarks();
    tap('q', 'KeyX'); // Dvorak
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('a key that types "x" on another layout (KeyB on Dvorak) does not clear', () => {
    const grid = renderPlacedOverBothMarks();
    tap('x', 'KeyB');
    expectPlaced5(cellAt(grid, 0, 0));
    pressX(); // live: the real X key clears
    expectEmpty(cellAt(grid, 0, 0));
  });
});

describe('On a Given, neither Delete/Backspace nor X does anything (AC #7)', () => {
  // Each case first clears the ordinary cell at row 1, column 1 with the same key in the same mode,
  // then moves right twice to the Given 3 at row 1, column 3.
  const KEYS = [...DELETE_KEYS, ['X', pressX]] as const;

  it.each(KEYS.flatMap(([name, pressKey]) => (['fill', 'center', 'corner'] as const).map((mode) => [name, mode, pressKey] as const)))(
    '%s in %s mode leaves the Given as it was',
    (_name, mode, pressKey) => {
      const grid = mode === 'fill' ? renderPlacedOverBothMarks() : renderWithBothMarks();
      toSticky(mode);
      const before = gridDrawn(grid);
      pressKey();
      expect(gridDrawn(grid)).not.toEqual(before); // live on an ordinary cell
      pressRight();
      pressRight();
      expect(cellAt(grid, 0, 2)).toHaveAttribute('aria-selected', 'true');
      const atGiven = gridDrawn(grid);
      pressKey();
      expect(gridDrawn(grid)).toEqual(atGiven);
      expect(cellAt(grid, 0, 2)).toHaveClass('given');
      expect(cellAt(grid, 0, 2).textContent).toBe('3');
    },
  );
});

describe('Modifiers on Delete, Backspace and X (§5 rule 1)', () => {
  const KEYS = [...DELETE_KEYS, ['X', pressX]] as const;
  const BROWSER_MODIFIERS = [
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
  ] as const;

  it.each(KEYS.flatMap(([name, pressKey]) => BROWSER_MODIFIERS.map(([mod, init]) => [mod, name, init, pressKey] as const)))(
    '%s+%s does nothing and is left to the browser',
    (_mod, _name, init, pressKey) => {
      const grid = renderPlacedOverBothMarks();
      expect(pressKey(init)).toBe(true);
      expectPlaced5(cellAt(grid, 0, 0));
      pressKey(); // live: the same key without the modifier clears
      expect(cellAt(grid, 0, 0)).not.toHaveClass('placed');
    },
  );

  it.each(DELETE_KEYS)('Shift+%s clears as normal', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    pressKey({ shiftKey: true });
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it('Shift+X clears as normal', () => {
    const grid = renderPlacedOverBothMarks();
    tap('X', 'KeyX', { shiftKey: true });
    expectEmpty(cellAt(grid, 0, 0));
  });
});

describe('With C and S both held (§5 rule 2)', () => {
  it.each(DELETE_KEYS)('%s does nothing; releasing S brings back the C chord, and %s then clears Center marks', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    toSticky('center'); // so a fallback to the Sticky mode would show
    holdC();
    holdS();
    pressKey();
    expectBothMarks(cellAt(grid, 0, 0));
    releaseS();
    pressKey(); // live: C's chord now applies
    expect(centerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('28');
    releaseC();
  });

  it('X still clears everything', () => {
    const grid = renderPlacedOverBothMarks();
    holdC();
    holdS();
    pressX();
    releaseS();
    releaseC();
    expectEmpty(cellAt(grid, 0, 0));
  });
});

describe('Clearing while a chord letter is held does not end the chord (§5 rule 3)', () => {
  it.each(DELETE_KEYS)('holding C, %s then 5 toggles Center mark 5', (_name, pressKey) => {
    const grid = renderWithBothMarks();
    holdC();
    pressKey();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBeUndefined(); // the key acted
    pressDigit(5);
    expectEntryMode('center');
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('5');
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('28');
  });

  it('holding S, X then 5 toggles Corner mark 5', () => {
    const grid = renderWithBothMarks();
    holdS();
    pressX();
    expectEmpty(cellAt(grid, 0, 0)); // the key acted
    pressDigit(5);
    releaseS();
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('5');
    expect(centerMarksText(cellAt(grid, 0, 0))).toBeUndefined();
  });
});

describe('Auto-repeat of Delete, Backspace and X still clears (§5 rule 7)', () => {
  it.each(DELETE_KEYS)('an auto-repeated %s clears the Placed digit and is handled by the app', (_name, pressKey) => {
    const grid = renderPlacedOverBothMarks();
    expect(pressKey({ repeat: true })).toBe(false);
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it('an auto-repeated X clears everything and is handled by the app', () => {
    const grid = renderPlacedOverBothMarks();
    expect(pressX({ repeat: true })).toBe(false);
    expectEmpty(cellAt(grid, 0, 0));
  });
});
