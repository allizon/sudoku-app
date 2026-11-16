// Digit keys before a Puzzle is loaded: ignored in every Entry mode, while N, arrows, clicking,
// and paste keep working (TASK-15; keymap.md §7, import.md §2).
//
// Until a Puzzle is loaded the grid is the empty Puzzle, and a stray digit used to put a mark on
// it, after which the next paste was refused with "A puzzle is already loaded". These tests pin
// the rule that digit keys do nothing before a Puzzle is loaded, in fill, center, and corner
// mode, and that everything else still works and the first paste is accepted.
// Keys are fired as keydown events with both `key` (the character produced) and `code` (the
// physical key), as in fill-mode.test.tsx and entry-mode.test.tsx.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import { App } from './App';

function renderApp() {
  render(<App />);
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

/** Presses a key on whatever has focus; returns false when the app called preventDefault. */
function press(key: string, init: { code?: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; repeat?: boolean } = {}) {
  return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
}

/** Presses a digit by its physical key, producing the plain character. */
const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });

/** Cycles the Sticky mode once with N. */
const pressN = () => press('n', { code: 'KeyN' });

function expectEntryMode(mode: string) {
  const line = document.querySelector('.entry-mode-line');
  expect(line).not.toBeNull();
  expect(line).toHaveAttribute('data-entry-mode', mode);
}

/** Expects every cell still to be empty, so nothing was placed anywhere. */
function expectGridEmpty(grid: HTMLElement) {
  for (const row of cellsByRow(grid)) {
    for (const cell of row) {
      expect(cell).toHaveAccessibleName(/, empty$/);
    }
  }
}

function expectHintVisible() {
  expect(screen.getByText('Paste a puzzle to start')).toBeInTheDocument();
}

function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

function expectLoaded(grid: HTMLElement) {
  expect(within(grid).getAllByRole('gridcell', { name: /, given / }).length).toBeGreaterThan(0);
}

afterEach(cleanup);

describe('Digit keys do nothing before a Puzzle is loaded (AC #1)', () => {
  it('a digit in fill mode places nothing and the hint stays', () => {
    const grid = renderApp();
    pressDigit(5);
    expectGridEmpty(grid);
    expectHintVisible();
  });

  it('a digit in center mode places nothing', () => {
    const grid = renderApp();
    pressN(); // fill → center
    expectEntryMode('center');
    pressDigit(5);
    expectGridEmpty(grid);
    expectHintVisible();
  });

  it('a digit in corner mode places nothing', () => {
    const grid = renderApp();
    pressN(); // fill → center
    pressN(); // center → corner
    expectEntryMode('corner');
    pressDigit(5);
    expectGridEmpty(grid);
    expectHintVisible();
  });
});

describe('Digit keys work as before after an accepted paste (AC #2)', () => {
  it('a digit places a Placed digit in fill mode after the paste', () => {
    const grid = renderApp();
    paste(puzzle1);
    expectLoaded(grid);
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName(/, placed 5$/);
  });

  it('a digit places a Candidate in center mode after the paste', () => {
    const grid = renderApp();
    paste(puzzle1);
    pressN(); // fill → center
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName(/, center 5$/);
  });

  it('a digit places a Candidate in corner mode after the paste', () => {
    const grid = renderApp();
    paste(puzzle1);
    pressN(); // fill → center
    pressN(); // center → corner
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName(/, corner 5$/);
  });
});

describe('Everything else still works before a Puzzle is loaded (AC #3)', () => {
  it('N cycles the Sticky mode', () => {
    renderApp();
    expectEntryMode('fill');
    pressN();
    expectEntryMode('center');
    pressN();
    expectEntryMode('corner');
    pressN();
    expectEntryMode('fill');
  });

  it('arrow keys move the Selection', () => {
    const grid = renderApp();
    press('ArrowDown', { code: 'ArrowDown' });
    expect(cellAt(grid, 1, 0)).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking a cell selects it', () => {
    const grid = renderApp();
    const cell = cellAt(grid, 2, 3);
    fireEvent.mouseDown(cell);
    fireEvent.mouseUp(cell);
    fireEvent.click(cell);
    expect(cell).toHaveAttribute('aria-selected', 'true');
  });
});

describe('The first paste is accepted after digit keys were pressed (AC #4)', () => {
  it('a paste onto the never-loaded grid loads the Puzzle even after digit presses in every mode', () => {
    const grid = renderApp();
    pressDigit(5); // fill
    pressN();
    pressDigit(5); // center
    pressN();
    pressDigit(5); // corner
    paste(puzzle1);
    expectLoaded(grid);
    expect(screen.queryByText('Paste a puzzle to start')).not.toBeInTheDocument();
  });
});
