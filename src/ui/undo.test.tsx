// Undo and redo through the keyboard (TASK-16, AC #1, #3, #4, #5, #6, #7; keymap.md §6): Cmd+Z and
// Ctrl+Z undo the last step, Shift+Cmd+Z, Shift+Ctrl+Z and Ctrl+Y redo it; each digit in a chord is
// its own step; moving the selection (arrows or a click) and pressing N are not steps; undo restores
// the cell exactly, Candidates hidden under a Placed digit included; and a new change after undoing
// throws the redo history away while the undo trail keeps the earlier steps. The step rules themselves are unit-tested in src/core/undo.test.ts;
// here the same keys are pressed in the real app (AC #7).
//
// Same page assumptions as clearing.test.tsx and letter-chords.test.tsx: a Placed digit is the
// cell's text with class "placed" (a Given has "given"); Center marks and Corner marks are drawn in
// ".center-marks" and ".corner-marks"; the Entry mode line carries data-entry-mode. Keys are fired
// with both `key` (the character produced) and `code` (the physical key), so the redo keys are fired
// as they come from a real keyboard: Shift+Cmd+Z types "Z". History is in-memory this task — refresh
// survival is deferred to TASK-24 — so every test uses an in-memory Store and never reloads.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import type { Store } from '../core/store';
import { App } from './App';

type KeyInit = { code?: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; repeat?: boolean };

/** One press of an undo or redo key: key, physical code, and modifiers. */
type Keypress = { readonly key: string; readonly code: string; readonly init: KeyInit };

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

/** Releases a key. */
function release(key: string, init: KeyInit = {}) {
  fireEvent.keyUp(document.activeElement ?? document.body, { key, ...init });
}

/** Presses and releases a key; returns false when the app called preventDefault on the press. */
function tap(key: string, code: string, init: KeyInit = {}) {
  const notPrevented = press(key, { code, ...init });
  release(key, { code, ...init });
  return notPrevented;
}

const pressKey = (keypress: Keypress) => tap(keypress.key, keypress.code, keypress.init);

const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });
const pressRight = () => tap('ArrowRight', 'ArrowRight');
const pressN = () => tap('n', 'KeyN');
const holdC = () => press('c', { code: 'KeyC' });
const releaseC = () => release('c', { code: 'KeyC' });
const holdS = () => press('s', { code: 'KeyS' });
const releaseS = () => release('s', { code: 'KeyS' });

/** The macOS keys for the rest of this file (keymap.md §6): Cmd+Z undoes, Shift+Cmd+Z redoes. */
const UNDO_KEY: Keypress = { key: 'z', code: 'KeyZ', init: { metaKey: true } };
const REDO_KEY: Keypress = { key: 'Z', code: 'KeyZ', init: { shiftKey: true, metaKey: true } };
/** The other keys a player might reach for: Ctrl+Z to undo, Ctrl+Y to redo. */
const CTRL_Z: Keypress = { key: 'z', code: 'KeyZ', init: { ctrlKey: true } };
const CTRL_Y: Keypress = { key: 'y', code: 'KeyY', init: { ctrlKey: true } };

const pressCmdZ = () => pressKey(UNDO_KEY);
const pressShiftCmdZ = () => pressKey(REDO_KEY);

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

const centerMarksText = (cell: HTMLElement) => cell.querySelector('.center-marks')?.textContent ?? undefined;
const cornerMarksText = (cell: HTMLElement) => cell.querySelector('.corner-marks')?.textContent ?? undefined;

/** Checks the cell draws nothing: no digit, no Candidates. */
function expectEmpty(cell: HTMLElement) {
  expect(cell.textContent).toBe('');
  expect(cell).not.toHaveClass('placed');
  expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
}

/** Checks the cell draws that Placed digit and nothing else. */
function expectPlaced(cell: HTMLElement, digit: string) {
  expect(cell).toHaveClass('placed');
  expect(cell.textContent).toBe(digit);
  expect(cell.querySelector('.center-marks, .corner-marks')).toBeNull();
}

/** Checks the cell draws Center marks 1 4 7 and Corner marks 2 8, and no Placed digit. */
function expectBothMarks(cell: HTMLElement) {
  expect(cell).not.toHaveClass('placed');
  expect(centerMarksText(cell)).toBe('147');
  expect(cornerMarksText(cell)).toBe('28');
}

/**
 * Renders the app with puzzle-1 pasted (row 1, column 1 is empty), the Selected cell at row 1,
 * column 1, in fill mode.
 */
function renderPuzzle() {
  render(<App store={memoryStore()} />);
  const grid = screen.getByRole('grid');
  paste(puzzle1);
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

/** As renderPuzzle, with the marks at row 1, column 1. */
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
  expectPlaced(cellAt(grid, 0, 0), '5');
  return grid;
}

afterEach(cleanup);

describe('The undo keys undo the last change (AC #1)', () => {
  const KEYS = [
    { label: 'Cmd+Z (macOS)', keypress: UNDO_KEY },
    { label: 'Ctrl+Z', keypress: CTRL_Z },
  ];

  it.each(KEYS)('$label undoes the change just made', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    expectPlaced(cellAt(grid, 0, 0), '5');
    pressKey(keypress);
    expectEmpty(cellAt(grid, 0, 0));
  });

  // Each "undoes nothing further" test first undoes one change live, so it cannot pass before
  // undoing exists (the convention of clearing.test.tsx).
  it.each(KEYS)('after everything is undone, $label changes nothing', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ(); // the live undo
    expectEmpty(cellAt(grid, 0, 0));
    const before = gridDrawn(grid);
    pressKey(keypress); // nothing is left to undo
    expect(gridDrawn(grid)).toEqual(before);
  });


  it('undo leaves the Selected cell and the Entry mode as they are (AC #4)', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0)); // the live undo; fails until undoing exists
    expect(cellAt(grid, 0, 0)).toHaveAttribute('aria-selected', 'true');
    expectEntryMode('fill');
  });
});

describe('The redo keys put an undone change back (AC #1)', () => {
  const KEYS = [
    { label: 'Shift+Cmd+Z (macOS)', keypress: REDO_KEY },
    { label: 'Shift+Ctrl+Z', keypress: { key: 'Z', code: 'KeyZ', init: { shiftKey: true, ctrlKey: true } } },
    { label: 'Ctrl+Y', keypress: CTRL_Y },
  ];

  it.each(KEYS)('$label undoes what Cmd+Z undid', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
    pressKey(keypress);
    expectPlaced(cellAt(grid, 0, 0), '5');
  });

  // Each "changes nothing" test undoes and redoes live first, so it cannot pass before undo/redo
  // exists (the convention of clearing.test.tsx).
  it.each(KEYS)('a second $label with nothing more to redo leaves the grid as the first redo left it', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ(); // the live undo
    expectEmpty(cellAt(grid, 0, 0));
    pressKey(keypress); // the live redo
    expectPlaced(cellAt(grid, 0, 0), '5');
    pressKey(keypress); // nothing is left to redo
    expectPlaced(cellAt(grid, 0, 0), '5');
  });
});

describe('The undo and redo keys are handled by the app: their default action is prevented (keymap.md §6; Alix settled this for TASK-16)', () => {
  // Like the clearing keys (keymap.md §5 rule 6, tested in clearing.test.tsx): the app handles the
  // key itself, so the browser's own undo/redo never runs, whether or not history acted.
  const UNDO_VARIANTS = [
    { label: 'Cmd+Z (macOS)', keypress: UNDO_KEY },
    { label: 'Ctrl+Z', keypress: CTRL_Z },
  ];
  const REDO_VARIANTS = [
    { label: 'Shift+Cmd+Z (macOS)', keypress: REDO_KEY },
    { label: 'Shift+Ctrl+Z', keypress: { key: 'Z', code: 'KeyZ', init: { shiftKey: true, ctrlKey: true } } },
    { label: 'Ctrl+Y', keypress: CTRL_Y },
  ];

  it.each(UNDO_VARIANTS)('$label with a change to undo is prevented', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    expectPlaced(cellAt(grid, 0, 0), '5'); // there is something to undo
    expect(pressKey(keypress)).toBe(false);
    expectEmpty(cellAt(grid, 0, 0)); // and the press actually undid it
  });

  it.each(UNDO_VARIANTS)('$label on an empty history is prevented too', ({ keypress }) => {
    const grid = renderPuzzle();
    expect(pressKey(keypress)).toBe(false); // nothing to undo, handled all the same
    expectEmpty(cellAt(grid, 0, 0));
  });

  it.each(REDO_VARIANTS)('$label with an undone change to redo is prevented', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0)); // there is something to redo
    expect(pressKey(keypress)).toBe(false);
    expectPlaced(cellAt(grid, 0, 0), '5'); // and the press actually redid it
  });

  it.each(REDO_VARIANTS)('$label with nothing to redo is prevented too', ({ keypress }) => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ(); // the live undo, per the file's convention for "does nothing" tests
    expectEmpty(cellAt(grid, 0, 0));
    pressKey(keypress); // the live redo; the redo stack is empty again
    expectPlaced(cellAt(grid, 0, 0), '5');
    expect(pressKey(keypress)).toBe(false); // nothing to redo, handled all the same
    expectPlaced(cellAt(grid, 0, 0), '5'); // and the inert press changes nothing
  });
});

describe('Each digit pressed during a chord is its own step (AC #3)', () => {
  it('hold C, press 1, 2, 3: Cmd+Z removes 3, then 2, then 1', () => {
    const grid = renderPuzzle();
    holdC();
    pressDigit(1);
    pressDigit(2);
    pressDigit(3);
    releaseC();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('123');
    pressCmdZ();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('12');
    pressCmdZ();
    expect(centerMarksText(cellAt(grid, 0, 0))).toBe('1');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
    // the chord digits were all the steps there were
    const before = gridDrawn(grid);
    pressCmdZ();
    expect(gridDrawn(grid)).toEqual(before);
  });

  it('an S chord digit is one step too: Cmd+Z removes the Corner mark once', () => {
    const grid = renderPuzzle();
    holdS();
    pressDigit(8);
    releaseS();
    expect(cornerMarksText(cellAt(grid, 0, 0))).toBe('8');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
    const before = gridDrawn(grid);
    pressCmdZ();
    expect(gridDrawn(grid)).toEqual(before);
  });
});

describe('Moving the selection is not an undo step (AC #4)', () => {
  it('an arrow press between two changes does not swallow the last placement', () => {
    const grid = renderPuzzle();
    pressDigit(5); // at row 1, column 1
    pressRight();
    pressDigit(7); // at row 1, column 2
    pressCmdZ();
    // One undo removes the last placement, no selection move standing between:
    expectEmpty(cellAt(grid, 0, 1));
    expectPlaced(cellAt(grid, 0, 0), '5');
  });

  it('undo after a selection move leaves the selection exactly where it was moved to', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressRight();
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
    expect(cellAt(grid, 0, 1)).toHaveAttribute('aria-selected', 'true');
    expect(cellAt(grid, 0, 0)).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking another cell is not an undo step either', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    const cell = cellAt(grid, 6, 3);
    fireEvent.mouseDown(cell);
    fireEvent.mouseUp(cell);
    fireEvent.click(cell);
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
    expect(cellAt(grid, 6, 3)).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Changing the Sticky mode is not an undo step (AC #4)', () => {
  it('an N press after a change leaves the placement the next thing to undo', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    toSticky('center');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('undoing does not disturb the Sticky mode', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    toSticky('center');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0)); // the live undo; fails until undoing exists
    expectEntryMode('center');
  });

  it('undoing goes past N presses and stops at them: further Cmd+Z changes nothing', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressN(); // center
    pressN(); // corner
    pressN(); // fill again
    expectEntryMode('fill');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0)); // the live undo went straight past the Ns
    const before = gridDrawn(grid);
    pressCmdZ(); // nothing is left to undo
    expect(gridDrawn(grid)).toEqual(before);
  });
});

describe('Placing, removing and replacing a digit are each one step (AC #2)', () => {
  it('placing 5, replacing it with 7, removing 7: Cmd+Z restores 7, then 5, then takes it away', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressDigit(7); // replaces 5
    expectPlaced(cellAt(grid, 0, 0), '7');
    pressDigit(7); // removes it again
    expectEmpty(cellAt(grid, 0, 0));
    pressCmdZ();
    expectPlaced(cellAt(grid, 0, 0), '7');
    pressCmdZ();
    expectPlaced(cellAt(grid, 0, 0), '5');
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('a Delete and an X are each their own step', () => {
    const grid = renderPlacedOverBothMarks();
    tap('Delete', 'Delete'); // removes the Placed digit, revealing the marks
    expectBothMarks(cellAt(grid, 0, 0));
    tap('x', 'KeyX'); // clears the marks
    expectEmpty(cellAt(grid, 0, 0));
    pressCmdZ();
    expectBothMarks(cellAt(grid, 0, 0));
    pressCmdZ();
    expectPlaced(cellAt(grid, 0, 0), '5');
  });
});

describe('Undo restores the cell exactly, including Candidates hidden under a Placed digit (AC #5)', () => {
  it('undoing X brings back the Placed digit with its hidden Candidates: removing the digit reveals them', () => {
    const grid = renderPlacedOverBothMarks();
    tap('x', 'KeyX');
    expectEmpty(cellAt(grid, 0, 0));
    pressCmdZ();
    expectPlaced(cellAt(grid, 0, 0), '5');
    pressDigit(5); // removing the Placed digit shows whether its hidden Candidates survived
    expectBothMarks(cellAt(grid, 0, 0));
  });

  it('undoing X on a Candidates-only cell brings both kinds of marks back', () => {
    const grid = renderWithBothMarks();
    tap('x', 'KeyX');
    expectEmpty(cellAt(grid, 0, 0));
    pressCmdZ();
    expectBothMarks(cellAt(grid, 0, 0));
  });
});

describe('A new change after undoing discards the redo history, not the undo trail (AC #6; keymap.md §6, revised for TASK-16 by Alix)', () => {
  it('the redo keys change nothing once a new change was made', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ();
    pressRight();
    pressDigit(3);
    pressShiftCmdZ();
    expectPlaced(cellAt(grid, 0, 1), '3'); // the new change survived; the redo did nothing
    expectEmpty(cellAt(grid, 0, 0));
  });

  it('the undo trail survives that discard: undoing the new change and then again restores the earlier one', () => {
    const grid = renderPuzzle();
    pressDigit(5);
    pressCmdZ();
    pressDigit(3);
    pressCmdZ();
    expectEmpty(cellAt(grid, 0, 1)); // the next undo removes the new change
    pressCmdZ();
    expectPlaced(cellAt(grid, 0, 0), '5'); // a further undo restores the earlier change
    expectEmpty(cellAt(grid, 0, 1));
  });
});
