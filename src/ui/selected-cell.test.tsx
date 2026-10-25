// The Selected cell: always exactly one, arrow-key movement, clicking
// (TASK-3, AC #1, #2, #3, #4, #5, #6, #7, #8; keymap.md §1, §4, §8).
//
// The Selected cell is exposed as `aria-selected="true"` on its gridcell; no
// other cell carries it. Keys reach the page as keydown events on the element
// that has focus, so these tests fire them on document.activeElement.
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

/** The cells of the grid as rows[row][column], both 0-based. */
function cellsByRow(grid: HTMLElement): HTMLElement[][] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('gridcell'));
}

/** Every cell that is marked as selected. */
function selectedCells(grid: HTMLElement): HTMLElement[] {
  return cellsByRow(grid)
    .flat()
    .filter((cell) => cell.getAttribute('aria-selected') === 'true');
}

/** The 0-based [row, column] of the Selected cell; fails unless exactly one cell is selected. */
function selectedPosition(grid: HTMLElement): [number, number] {
  expect(selectedCells(grid)).toHaveLength(1);
  for (const [r, row] of cellsByRow(grid).entries()) {
    for (const [c, cell] of row.entries()) {
      if (cell.getAttribute('aria-selected') === 'true') return [r, c];
    }
  }
  throw new Error('no Selected cell');
}

/** The cell at a 0-based row and column. */
function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = cellsByRow(grid)[row]?.[column];
  if (cell === undefined) throw new Error(`no cell at ${row}, ${column}`);
  return cell;
}

/** Presses a key on whatever has focus (the page body when nothing does). */
function press(key: string) {
  fireEvent.keyDown(document.activeElement ?? document.body, { key });
}

/** A mouse click on a cell: press, release, click. */
function click(cell: HTMLElement) {
  fireEvent.mouseDown(cell);
  fireEvent.mouseUp(cell);
  fireEvent.click(cell);
}

/** Pastes text onto the focused grid. */
function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

afterEach(cleanup);

describe('Selected cell: exactly one cell is selected at all times', () => {
  it('when the app opens, exactly one cell is the Selected cell', () => {
    expect(selectedCells(renderApp())).toHaveLength(1);
  });

  it('still exactly one Selected cell after arrow keys, a wrap, and a click', () => {
    const grid = renderApp();
    press('ArrowRight');
    press('ArrowUp');
    expect(selectedCells(grid)).toHaveLength(1);
    click(cellAt(grid, 6, 2));
    expect(selectedCells(grid)).toHaveLength(1);
  });

  it('still exactly one Selected cell after a Puzzle is pasted', () => {
    const grid = renderApp();
    paste(puzzle1);
    expect(selectedCells(grid)).toHaveLength(1);
  });

  it('the Selected cell is clearly visible: App.css styles [aria-selected="true"] with token colors only', () => {
    const rules = [...appCss.matchAll(/[^{}]*\[aria-selected=["']?true["']?\][^{}]*\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    const declarations = rules.map((rule) => rule[1] ?? '').join('\n');
    // Something that actually draws attention, not only a no-op.
    expect(declarations).toMatch(/(outline|box-shadow|background|border)/);
    // Every color comes from a CSS token (display.md §2; AGENTS.md).
    expect(declarations).toMatch(/var\(--[\w-]+\)/);
    expect(declarations).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});

describe('Selected cell: a newly opened Puzzle selects row 1, column 1', () => {
  it('when the app opens, row 1, column 1 is the Selected cell', () => {
    expect(selectedPosition(renderApp())).toEqual([0, 0]);
  });

  it('after a Puzzle is pasted, row 1, column 1 is still the Selected cell', () => {
    const grid = renderApp();
    paste(puzzle1);
    expect(selectedPosition(grid)).toEqual([0, 0]);
  });
});

describe('Selected cell: each arrow key moves the selection one cell in its direction', () => {
  it('ArrowRight moves the Selected cell one column right', () => {
    const grid = renderApp();
    press('ArrowRight');
    expect(selectedPosition(grid)).toEqual([0, 1]);
  });

  it('ArrowDown moves the Selected cell one row down', () => {
    const grid = renderApp();
    press('ArrowDown');
    expect(selectedPosition(grid)).toEqual([1, 0]);
  });

  it('ArrowLeft moves the Selected cell one column left', () => {
    const grid = renderApp();
    click(cellAt(grid, 4, 4));
    press('ArrowLeft');
    expect(selectedPosition(grid)).toEqual([4, 3]);
  });

  it('ArrowUp moves the Selected cell one row up', () => {
    const grid = renderApp();
    click(cellAt(grid, 4, 4));
    press('ArrowUp');
    expect(selectedPosition(grid)).toEqual([3, 4]);
  });

  it('arrow keys move the Selected cell onto and off a Given', () => {
    const grid = renderApp();
    paste(puzzle1); // row 1, column 3 holds a Given
    press('ArrowRight');
    press('ArrowRight');
    expect(selectedPosition(grid)).toEqual([0, 2]);
    press('ArrowRight');
    expect(selectedPosition(grid)).toEqual([0, 3]);
  });
});

describe('Selected cell: movement wraps within the same row or column', () => {
  it('ArrowRight from column 9 goes to column 1 of the same row', () => {
    const grid = renderApp();
    click(cellAt(grid, 2, 8));
    press('ArrowRight');
    expect(selectedPosition(grid)).toEqual([2, 0]);
  });

  it('ArrowLeft from column 1 goes to column 9 of the same row', () => {
    const grid = renderApp();
    click(cellAt(grid, 2, 0));
    press('ArrowLeft');
    expect(selectedPosition(grid)).toEqual([2, 8]);
  });

  it('ArrowDown from row 9 goes to row 1 of the same column', () => {
    const grid = renderApp();
    click(cellAt(grid, 8, 5));
    press('ArrowDown');
    expect(selectedPosition(grid)).toEqual([0, 5]);
  });

  it('ArrowUp from row 1 goes to row 9 of the same column', () => {
    const grid = renderApp();
    click(cellAt(grid, 0, 5));
    press('ArrowUp');
    expect(selectedPosition(grid)).toEqual([8, 5]);
  });

  it('from row 1, column 1 at opening, ArrowLeft wraps to column 9 and ArrowUp to row 9', () => {
    const grid = renderApp();
    press('ArrowLeft');
    expect(selectedPosition(grid)).toEqual([0, 8]);
    press('ArrowRight');
    press('ArrowUp');
    expect(selectedPosition(grid)).toEqual([8, 0]);
  });
});

describe('Selected cell: clicking a cell makes it the Selected cell', () => {
  it('clicking an empty cell makes it the Selected cell', () => {
    const grid = renderApp();
    click(cellAt(grid, 5, 7));
    expect(selectedPosition(grid)).toEqual([5, 7]);
  });

  it('clicking a cell that holds a Given makes it the Selected cell', () => {
    const grid = renderApp();
    paste(puzzle1);
    const given = cellAt(grid, 0, 2);
    expect(given).toHaveTextContent('3');
    click(cellAt(grid, 0, 3));
    click(given);
    expect(selectedPosition(grid)).toEqual([0, 2]);
  });

  it('clicking a different cell moves the selection off the previous one', () => {
    const grid = renderApp();
    click(cellAt(grid, 5, 7));
    click(cellAt(grid, 1, 1));
    expect(selectedPosition(grid)).toEqual([1, 1]);
  });
});

describe('Selected cell: after a click, keys keep working from the clicked cell', () => {
  it('after a click the grid has keyboard focus, even if it had lost it', () => {
    const grid = renderApp();
    (document.activeElement as HTMLElement | null)?.blur();
    click(cellAt(grid, 3, 3));
    expect(grid.contains(document.activeElement)).toBe(true);
  });

  it('an arrow key pressed after a click moves from the clicked cell', () => {
    const grid = renderApp();
    click(cellAt(grid, 3, 3));
    press('ArrowRight');
    expect(selectedPosition(grid)).toEqual([3, 4]);
  });

  it('arrow keys keep working after clicking a Given, with no further click', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 0, 2));
    press('ArrowDown');
    press('ArrowDown');
    expect(selectedPosition(grid)).toEqual([2, 2]);
  });
});

describe('Selected cell: letter keys never move the selection', () => {
  it.each(['n', 'c', 's', 'x', 'i', 'a', 'z', 'N', 'C', 'S', 'X', 'I'])(
    'pressing %s leaves the Selected cell where it was',
    (key) => {
      const grid = renderApp();
      click(cellAt(grid, 4, 4));
      press(key);
      expect(selectedPosition(grid)).toEqual([4, 4]);
    },
  );

  it('every letter A to Z, either case, leaves the Selected cell where it was', () => {
    const grid = renderApp();
    click(cellAt(grid, 4, 4));
    for (let code = 'a'.charCodeAt(0); code <= 'z'.charCodeAt(0); code += 1) {
      const letter = String.fromCharCode(code);
      press(letter);
      press(letter.toUpperCase());
    }
    expect(selectedPosition(grid)).toEqual([4, 4]);
  });
});

describe('Selected cell: letter keys with no meaning in M0 do nothing', () => {
  /** Letters with no meaning in M0: every letter except N, C, S, X (I included). */
  const meaningless = 'abdefghijklmopqrtuvwyz'.split('');

  it('no such letter changes what the grid shows', () => {
    const grid = renderApp();
    paste(puzzle1);
    click(cellAt(grid, 1, 1));
    const before = grid.innerHTML;
    for (const letter of meaningless) {
      press(letter);
      press(letter.toUpperCase());
    }
    expect(grid.innerHTML).toBe(before);
    expect(selectedPosition(grid)).toEqual([1, 1]);
  });

  it('pressing I does nothing: no import field opens and the Selected cell stays', () => {
    const grid = renderApp();
    click(cellAt(grid, 1, 1));
    press('i');
    press('I');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(selectedPosition(grid)).toEqual([1, 1]);
  });

  it('a letter without a meaning does not toast or otherwise change the page', () => {
    renderApp();
    const before = document.body.innerHTML;
    press('q');
    expect(document.body.innerHTML).toBe(before);
  });
});
