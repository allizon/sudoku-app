// Fill mode through the keyboard: placing, toggling, replacing, Givens, physical keys, Cmd, and how
// Placed digits look (TASK-5, AC #1-#7; keymap.md §1, §7; display.md §2).
//
// A Placed digit shows as the cell's text, has class "placed" (a Given has "given"), and is named
// "placed N" in the cell's accessible name (a Given's is "given N"). Keys are fired as keydown events
// with both `key` (the character produced) and `code` (the physical key).
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import { App } from './App';

/** App.css as written (see paste-import.test.tsx for why it is read from disk). */
const appCss = readFileSync(`${import.meta.dirname}/App.css`, 'utf8');

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

const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

afterEach(cleanup);

describe('Fill mode: a digit key on an empty Selected cell places that digit', () => {
  it('pressing 5 on the empty Selected cell shows 5 in it', () => {
    const grid = renderApp();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveTextContent('5');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('pressing %i places that digit', (digit) => {
    const grid = renderApp();
    pressDigit(digit);
    expect(cellAt(grid, 0, 0)).toHaveTextContent(String(digit));
  });

  it('the digit goes in the Selected cell, wherever it was moved or clicked', () => {
    const grid = renderApp();
    click(cellAt(grid, 6, 3));
    pressDigit(8);
    expect(cellAt(grid, 6, 3)).toHaveTextContent('8');
    expect(cellAt(grid, 0, 0)).toHaveTextContent('');
  });

  it('no other cell changes', () => {
    const grid = renderApp();
    pressDigit(5);
    const filled = cellsByRow(grid)
      .flat()
      .filter((cell) => cell.textContent !== '');
    expect(filled).toHaveLength(1);
  });

  it('the Selected cell stays where it was', () => {
    const grid = renderApp();
    click(cellAt(grid, 6, 3));
    pressDigit(8);
    expect(cellAt(grid, 6, 3)).toHaveAttribute('aria-selected', 'true');
  });

  it('works on an empty cell of a pasted Puzzle', () => {
    const grid = renderApp();
    paste(puzzle1); // row 1, column 1 is empty
    pressDigit(9);
    expect(cellAt(grid, 0, 0)).toHaveTextContent('9');
  });

  it('the cell is named for its Placed digit', () => {
    const grid = renderApp();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Fill mode: the same digit on a Placed digit removes it (toggle)', () => {
  it('pressing 5 twice leaves the cell empty', () => {
    const grid = renderApp();
    pressDigit(5);
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveTextContent('');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, empty');
  });

  it('pressing 5 three times places it again', () => {
    const grid = renderApp();
    pressDigit(5);
    pressDigit(5);
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveTextContent('5');
  });
});

describe('Fill mode: a different digit on a Placed digit replaces it', () => {
  it('pressing 5 then 6 leaves 6 and not 5', () => {
    const grid = renderApp();
    pressDigit(5);
    pressDigit(6);
    expect(cellAt(grid, 0, 0).textContent).toBe('6');
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 6');
  });
});

describe('Fill mode: a digit key on a Given does nothing', () => {
  it('a different digit leaves the Given as it was', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 0, 2)); // the Given 3
    pressDigit(7);
    expect(cellAt(grid, 0, 2).textContent).toBe('3');
    expect(cellAt(grid, 0, 2)).toHaveAccessibleName('Row 1, column 3, given 3');
  });

  it('the same digit does not remove the Given', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 0, 2));
    pressDigit(3);
    expect(cellAt(grid, 0, 2).textContent).toBe('3');
    expect(cellAt(grid, 0, 2)).toHaveAccessibleName('Row 1, column 3, given 3');
  });

  it('nothing in the grid changes', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 0, 2));
    const before = grid.innerHTML;
    for (let digit = 1; digit <= 9; digit += 1) pressDigit(digit);
    expect(grid.innerHTML).toBe(before);
  });
});

describe('Fill mode: digit keys are identified by physical key (event.code), not by the character produced', () => {
  it('Shift+1 (which types "!") still places 1', () => {
    const grid = renderApp();
    press('!', { code: 'Digit1', shiftKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('1');
  });

  it.each([
    ['!', 'Digit1', '1'],
    ['@', 'Digit2', '2'],
    ['#', 'Digit3', '3'],
    ['$', 'Digit4', '4'],
    ['%', 'Digit5', '5'],
    ['^', 'Digit6', '6'],
    ['&', 'Digit7', '7'],
    ['*', 'Digit8', '8'],
    ['(', 'Digit9', '9'],
  ])('Shift+%s on %s places %s', (key, code, expected) => {
    const grid = renderApp();
    press(key, { code, shiftKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe(expected);
  });

  it('a layout whose number row types symbols (key "&" on Digit1) still places 1', () => {
    const grid = renderApp();
    press('&', { code: 'Digit1' });
    expect(cellAt(grid, 0, 0).textContent).toBe('1');
  });

  it('a character "1" from a key that is not a digit key does nothing', () => {
    const grid = renderApp();
    press('1', { code: 'KeyQ' });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('Digit0 places nothing', () => {
    const grid = renderApp();
    press('0', { code: 'Digit0' });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('a Shift+digit press toggles like a plain one: Shift+1 then 1 removes it', () => {
    const grid = renderApp();
    press('!', { code: 'Digit1', shiftKey: true });
    pressDigit(1);
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });
});

describe('Fill mode: Cmd+digit is never handled by the app', () => {
  it.each([1, 5, 9])('Cmd+%i is not default-prevented, so the browser keeps switching tabs', (digit) => {
    renderApp();
    const notPrevented = press(String(digit), { code: `Digit${digit}`, metaKey: true });
    expect(notPrevented).toBe(true);
  });

  it('Cmd+digit places nothing on an empty cell', () => {
    const grid = renderApp();
    press('5', { code: 'Digit5', metaKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('Cmd+digit does not remove or replace a Placed digit', () => {
    const grid = renderApp();
    pressDigit(5);
    press('5', { code: 'Digit5', metaKey: true });
    press('6', { code: 'Digit6', metaKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });

  it('Cmd+Shift+digit is not handled either', () => {
    const grid = renderApp();
    const notPrevented = press('%', { code: 'Digit5', metaKey: true, shiftKey: true });
    expect(notPrevented).toBe(true);
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });
});

describe('Fill mode: Placed digits are visibly distinct from Givens', () => {
  it('a Placed digit carries the placed class and not the given one; a Given the reverse', () => {
    const grid = renderApp();
    paste(puzzle1);
    pressDigit(9); // row 1, column 1 is empty
    expect(cellAt(grid, 0, 0)).toHaveClass('placed');
    expect(cellAt(grid, 0, 0)).not.toHaveClass('given');
    expect(cellAt(grid, 0, 2)).toHaveClass('given');
    expect(cellAt(grid, 0, 2)).not.toHaveClass('placed');
  });

  it('a Placed digit is not marked read-only; a Given is', () => {
    const grid = renderApp();
    paste(puzzle1);
    pressDigit(9);
    expect(cellAt(grid, 0, 0)).not.toHaveAttribute('aria-readonly');
    expect(cellAt(grid, 0, 2)).toHaveAttribute('aria-readonly', 'true');
  });

  it('App.css styles .placed with token colors only', () => {
    const rule = /\.placed\b[^{}]*\{([^}]*)\}/.exec(appCss);
    expect(rule).not.toBeNull();
    const declarations = rule?.[1] ?? '';
    expect(declarations).toMatch(/color:\s*var\(--[\w-]+\)/);
    expect(declarations).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });

  it('the Placed digit color token differs from the Given digit color token', () => {
    const colorToken = (selector: RegExp) =>
      /(?:^|[;\s])color:\s*var\((--[\w-]+)\)/.exec(selector.exec(appCss)?.[1] ?? '')?.[1];
    const placed = colorToken(/\.placed\b[^{}]*\{([^}]*)\}/);
    const given = colorToken(/\.given\b[^{}]*\{([^}]*)\}/);
    expect(placed).toBeDefined();
    expect(given).toBeDefined();
    expect(placed).not.toBe(given);
  });

  it('the Placed digit color token is defined in :root', () => {
    const match = /\.placed\b[^{}]*\{[^}]*color:\s*var\((--[\w-]+)\)/.exec(appCss);
    const token = match?.[1] ?? '';
    expect(token).not.toBe('');
    expect(appCss).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
  });
});

describe('Fill mode: numpad digit keys count as digits', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('Numpad%i places that digit', (digit) => {
    const grid = renderApp();
    press(String(digit), { code: `Numpad${digit}` });
    expect(cellAt(grid, 0, 0).textContent).toBe(String(digit));
  });

  it('the same numpad digit again removes it (toggle)', () => {
    const grid = renderApp();
    press('5', { code: 'Numpad5' });
    press('5', { code: 'Numpad5' });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('a different numpad digit replaces it', () => {
    const grid = renderApp();
    press('5', { code: 'Numpad5' });
    press('6', { code: 'Numpad6' });
    expect(cellAt(grid, 0, 0).textContent).toBe('6');
  });

  it('Numpad5 toggles a digit placed with Digit5, and the reverse', () => {
    const grid = renderApp();
    pressDigit(5);
    press('5', { code: 'Numpad5' });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('Shift+Numpad digit still places it', () => {
    const grid = renderApp();
    press('End', { code: 'Numpad1', shiftKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('1');
  });

  it('a numpad digit on a Given does nothing', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 0, 2));
    press('7', { code: 'Numpad7' });
    press('3', { code: 'Numpad3' });
    expect(cellAt(grid, 0, 2).textContent).toBe('3');
    expect(cellAt(grid, 0, 2)).toHaveAccessibleName('Row 1, column 3, given 3');
  });

  it('Numpad0 places nothing', () => {
    const grid = renderApp();
    press('0', { code: 'Numpad0' });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });
});

describe('Fill mode: Ctrl+digit and Alt+digit are never handled by the app', () => {
  const cases = [
    ['Ctrl', 'Digit', { ctrlKey: true }],
    ['Alt', 'Digit', { altKey: true }],
    ['Ctrl', 'Numpad', { ctrlKey: true }],
    ['Alt', 'Numpad', { altKey: true }],
  ] as const;

  it.each(cases)('%s+%s5 is not default-prevented', (_name, kind, modifier) => {
    renderApp();
    expect(press('5', { code: `${kind}5`, ...modifier })).toBe(true);
  });

  it.each(cases)('%s+%s5 places nothing on an empty cell', (_name, kind, modifier) => {
    const grid = renderApp();
    press('5', { code: `${kind}5`, ...modifier });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it.each(cases)('%s+%s6 does not remove or replace a Placed digit', (_name, kind, modifier) => {
    const grid = renderApp();
    pressDigit(5);
    press('5', { code: `${kind}5`, ...modifier });
    press('6', { code: `${kind}6`, ...modifier });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });

  it('Shift alone still works: Shift+Digit5 places 5', () => {
    const grid = renderApp();
    press('%', { code: 'Digit5', shiftKey: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });
});

describe('Fill mode: key auto-repeat is ignored', () => {
  it('a keydown then a repeat keydown of the same digit leaves it placed once', () => {
    const grid = renderApp();
    pressDigit(5);
    press('5', { code: 'Digit5', repeat: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });

  it('many repeat events do not toggle the digit off and on', () => {
    const grid = renderApp();
    pressDigit(5);
    for (let i = 0; i < 4; i += 1) press('5', { code: 'Digit5', repeat: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });

  it('a repeat event on its own places nothing', () => {
    const grid = renderApp();
    press('5', { code: 'Digit5', repeat: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });

  it('a repeat of a different digit does not replace the Placed digit', () => {
    const grid = renderApp();
    pressDigit(5);
    press('6', { code: 'Digit6', repeat: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('5');
  });

  it('a numpad repeat on its own places nothing', () => {
    const grid = renderApp();
    press('5', { code: 'Numpad5', repeat: true });
    expect(cellAt(grid, 0, 0).textContent).toBe('');
  });
});

describe('Fill mode: a grid holding only a Placed digit counts as loaded, so a paste is refused', () => {
  it('pasting leaves the grid exactly as it was', () => {
    const grid = renderApp();
    pressDigit(5);
    const before = grid.innerHTML;
    paste(puzzle1);
    expect(grid.innerHTML).toBe(before);
  });

  it('pasting shows the refusal toast', () => {
    renderApp();
    pressDigit(5);
    paste(puzzle1);
    expect(screen.getByRole('alert')).toHaveTextContent(REFUSAL);
  });

  it('the paste hint is gone once a digit is placed', () => {
    renderApp();
    expect(screen.queryByText('Paste a puzzle to start')).toBeInTheDocument();
    pressDigit(5);
    expect(screen.queryByText('Paste a puzzle to start')).not.toBeInTheDocument();
  });

  it('after the only Placed digit is removed, a paste is accepted again', () => {
    const grid = renderApp();
    pressDigit(5);
    pressDigit(5);
    paste(puzzle1);
    expect(cellAt(grid, 0, 2).textContent).toBe('3');
  });
});
