// Pasting a Puzzle onto the grid (TASK-4, AC #1, #4, #5, #6, #9, #10, #11, #12,
// #13; import.md §2, §3, §6; milestones.md M0 "Paste import, parsing only").
//
// Cmd+V on macOS and Ctrl+V elsewhere both reach the page as the browser's
// `paste` event on the focused element, carrying the clipboard text; jsdom has
// no clipboard or shortcut handling, so these tests fire that paste event.
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import puzzle2 from '../../fixtures/puzzles/puzzle-2.txt?raw';
import { App } from './App';

/** import.md §6 Sample A, `0` for empty. */
const SAMPLE_A_ZEROS = '020060080700001009000809000072000600100000007005000930000307000300500004010020060';
/** import.md §6 Sample A in the site's permalink notation, `-` for empty. */
const SAMPLE_A_DASHES = '-2--6--8-7----1--9---8-9----72---6--1-------7--5---93----3-7---3--5----4-1--2--6-';

/** The refusal shown when a Puzzle is already loaded (Alix, TASK-4 step 2). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

/** How long a toast stays before dismissing itself (Alix, TASK-4 step 2). */
const TOAST_MS = 10_000;

/** The text of every toast on screen, in document order. */
const toastTexts = () => screen.queryAllByRole('alert').map((toast) => (toast.textContent ?? '').trim());

function renderApp() {
  render(<App />);
  return screen.getByRole('grid');
}

/** The 81 cells of the grid, left to right, top to bottom. */
function cellsOf(grid: HTMLElement): HTMLElement[] {
  return within(grid)
    .getAllByRole('row')
    .flatMap((row) => within(row).getAllByRole('gridcell'));
}

/** The grid as 81 characters: a cell's digit, or `.` for a cell showing nothing. */
function gridText(grid: HTMLElement): string {
  return cellsOf(grid)
    .map((cell) => (cell.textContent ?? '').trim() || '.')
    .join('');
}

/** The Puzzle text with whitespace removed and every empty-cell character as `.`. */
const normalized = (text: string) => text.replace(/[\s,]/g, '').replace(/[0-]/g, '.');

/** Gives the grid focus, as a player tabbing or clicking onto it would. */
function focusGrid(grid: HTMLElement) {
  grid.focus();
  expect(grid.contains(document.activeElement)).toBe(true);
}

/** Pastes text (Cmd+V / Ctrl+V) onto whatever has focus. */
function paste(text: string) {
  const target = document.activeElement ?? document.body;
  fireEvent.paste(target, {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

/** Renders the app, focuses the grid, and pastes text onto it. */
function renderAndPaste(text: string) {
  const grid = renderApp();
  focusGrid(grid);
  paste(text);
  return grid;
}

describe('Paste import: pasting onto an empty grid loads the Puzzle', () => {
  it('the grid can take focus, so a paste can reach it', () => {
    focusGrid(renderApp());
  });

  it('pasting fixture puzzle-1 (nine lines of nine) while the grid has focus loads its Givens', () => {
    const grid = renderAndPaste(puzzle1);
    expect(gridText(grid)).toBe(normalized(puzzle1));
  });

  it('pasting fixture puzzle-2 while the grid has focus loads its Givens', () => {
    const grid = renderAndPaste(puzzle2);
    expect(gridText(grid)).toBe(normalized(puzzle2));
  });

  it('pasting Sample A in 0-notation loads its 24 Givens in place', () => {
    const grid = renderAndPaste(SAMPLE_A_ZEROS);
    expect(gridText(grid)).toBe(normalized(SAMPLE_A_ZEROS));
    expect(cellsOf(grid).filter((cell) => /^[1-9]$/.test((cell.textContent ?? '').trim()))).toHaveLength(24);
  });

  it('Sample A loads identically from its 0-notation and its --notation forms', () => {
    const fromZeros = renderAndPaste(SAMPLE_A_ZEROS).innerHTML;
    cleanup();
    const fromDashes = renderAndPaste(SAMPLE_A_DASHES).innerHTML;
    expect(fromDashes).toBe(fromZeros);
  });

  it('puzzle-1 loads the same Puzzle from nine lines, one 81-character line, and comma-separated text', () => {
    const cells = puzzle1.replace(/\s/g, '');
    const forms = [puzzle1, cells, cells.split('').join(','), cells.split('').join(' ')];
    const grids = forms.map((text) => {
      cleanup();
      return renderAndPaste(text).innerHTML;
    });
    for (const html of grids) expect(html).toBe(grids[0]);
  });

  it('a Puzzle whose Givens conflict still loads as-is, since M0 does no validation', () => {
    const text = '55' + '.'.repeat(79);
    const grid = renderAndPaste(text);
    expect(gridText(grid)).toBe(text);
  });

  it('a Puzzle of 81 empty cells does not count as loaded, so a later paste loads normally', () => {
    const grid = renderAndPaste('.'.repeat(81));
    focusGrid(grid);
    paste(puzzle1);
    expect(gridText(grid)).toBe(normalized(puzzle1));
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('a successful paste shows no toast', () => {
    renderAndPaste(puzzle1);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('pasting while the grid does not have focus loads nothing', () => {
    const grid = renderApp();
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.paste(document.body, {
      clipboardData: { types: ['text/plain'], getData: () => puzzle1 },
    });
    expect(gridText(grid)).toBe('.'.repeat(81));
  });
});

describe('Paste import: Givens are drawn on the grid', () => {
  it('a Given shows its digit in its cell', () => {
    const grid = renderAndPaste('7' + '.'.repeat(80));
    expect(cellsOf(grid)[0]).toHaveTextContent(/^7$/);
  });

  it('a cell holding a Given is visibly distinct from an empty cell', () => {
    const grid = renderAndPaste('7' + '.'.repeat(80));
    const [givenCell, emptyCell] = cellsOf(grid);
    expect(emptyCell).toHaveTextContent(/^$/);
    expect(givenCell).not.toHaveTextContent(/^$/);
  });

  it('empty cells of a loaded Puzzle show nothing', () => {
    const grid = renderAndPaste(SAMPLE_A_DASHES);
    cellsOf(grid).forEach((cell, i) => {
      if (SAMPLE_A_DASHES[i] === '-') expect(cell).toHaveTextContent(/^$/);
    });
  });
});

describe('Paste import: a rejected paste shows a parse error and leaves the grid as it was', () => {
  it("a paste with a bad character shows a toast \"unexpected 'x' at row 5, column 5\"", () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41));
    expect(toastTexts()).toEqual(["unexpected 'x' at row 5, column 5"]);
  });

  it('a paste that leaves 79 cells shows a toast "found 79 cells, expected 81"', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    expect(toastTexts()).toEqual(['found 79 cells, expected 81']);
  });

  it('a paste with the wrong count and a bad character shows two toasts, the wrong-count error first', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    expect(toastTexts()).toEqual(['found 79 cells, expected 81', "unexpected 'x' at row 5, column 5"]);
  });

  it('a paste with several bad characters names only the first', () => {
    renderAndPaste('Z' + SAMPLE_A_ZEROS.slice(1, 40) + 'Q' + SAMPLE_A_ZEROS.slice(41));
    expect(toastTexts()).toEqual(["unexpected 'Z' at row 1, column 1"]);
  });

  it('a paste with a bad character leaves the empty grid exactly as it was', () => {
    const grid = renderApp();
    const before = grid.innerHTML;
    focusGrid(grid);
    paste('Z' + SAMPLE_A_ZEROS.slice(1));
    expect(grid.innerHTML).toBe(before);
    expect(gridText(grid)).toBe('.'.repeat(81));
  });

  it('a paste with the wrong number of cells leaves the empty grid exactly as it was', () => {
    const grid = renderApp();
    const before = grid.innerHTML;
    focusGrid(grid);
    paste(SAMPLE_A_ZEROS.slice(0, 79));
    expect(grid.innerHTML).toBe(before);
  });

  it('after a rejected paste, pasting a valid Puzzle onto the still-empty grid loads it', () => {
    const grid = renderApp();
    focusGrid(grid);
    paste(SAMPLE_A_ZEROS.slice(0, 79));
    focusGrid(grid);
    paste(puzzle1);
    expect(gridText(grid)).toBe(normalized(puzzle1));
  });

  it('the parse error toast is outside the grid', () => {
    const grid = renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    const [toast] = screen.getAllByRole('alert');
    expect(toast).toBeDefined();
    expect(grid.contains(toast ?? null)).toBe(false);
  });
});

describe('Paste import: pasting while a Puzzle is already loaded is refused', () => {
  it('pasting a second Puzzle leaves the loaded Puzzle exactly as it was', () => {
    const grid = renderAndPaste(puzzle1);
    const before = grid.innerHTML;
    focusGrid(grid);
    paste(puzzle2);
    expect(grid.innerHTML).toBe(before);
    expect(gridText(grid)).toBe(normalized(puzzle1));
  });

  it('pasting the same Puzzle again leaves it exactly as it was', () => {
    const grid = renderAndPaste(puzzle1);
    const before = grid.innerHTML;
    focusGrid(grid);
    paste(puzzle1);
    expect(grid.innerHTML).toBe(before);
  });

  it('the refusal appears as a toast: "A puzzle is already loaded — reload the page to start a new one."', () => {
    const grid = renderAndPaste(puzzle1);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    focusGrid(grid);
    paste(puzzle2);
    expect(toastTexts()).toEqual([REFUSAL]);
    expect(grid.contains(screen.getByRole('alert'))).toBe(false);
  });

  it('pasting unparseable text shows only the refusal, not a parse error, and leaves the Puzzle as it was', () => {
    const grid = renderAndPaste(puzzle1);
    const before = grid.innerHTML;
    focusGrid(grid);
    // Wrong count and a bad character: would be two parse errors on an empty grid.
    paste('Z' + SAMPLE_A_ZEROS.slice(1, 79));
    expect(toastTexts()).toEqual([REFUSAL]);
    expect(grid.innerHTML).toBe(before);
  });
});

describe('Paste import: toasts dismiss themselves after 10 seconds or when clicked', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Lets fake time pass, flushing any React updates it causes. */
  const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  it('a parse error toast is still shown just before 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    wait(TOAST_MS - 1);
    expect(toastTexts()).toEqual(['found 79 cells, expected 81']);
  });

  it('a parse error toast is gone at 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    wait(TOAST_MS);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('the refusal toast is still shown just before 10 seconds and gone at 10 seconds', () => {
    const grid = renderAndPaste(puzzle1);
    focusGrid(grid);
    paste(puzzle2);
    wait(TOAST_MS - 1);
    expect(toastTexts()).toEqual([REFUSAL]);
    wait(1);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('clicking a toast dismisses it before 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    fireEvent.click(screen.getByRole('alert'));
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('clicking anywhere on a toast dismisses it, including its text', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    fireEvent.click(screen.getByText('found 79 cells, expected 81', { exact: false }));
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('with two toasts, clicking the first leaves the second', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    const [first] = screen.getAllByRole('alert');
    fireEvent.click(first as HTMLElement);
    expect(toastTexts()).toEqual(["unexpected 'x' at row 5, column 5"]);
  });

  it('a toast shown while another is showing stacks with it, and each keeps its own 10-second timer', () => {
    const grid = renderAndPaste(puzzle1);
    focusGrid(grid);
    paste(puzzle2); // first refusal, at 0 s
    wait(5_000);
    focusGrid(grid);
    paste(puzzle2); // second refusal, at 5 s
    expect(toastTexts()).toEqual([REFUSAL, REFUSAL]);
    const [first, second] = screen.getAllByRole('alert');

    wait(TOAST_MS - 5_000 - 1); // just before 10 s
    expect(screen.queryAllByRole('alert')).toHaveLength(2);

    wait(1); // 10 s: the first is gone, the second remains
    expect(first).not.toBeInTheDocument();
    expect(second).toBeInTheDocument();
    expect(toastTexts()).toEqual([REFUSAL]);

    wait(5_000 - 1); // just before 15 s
    expect(second).toBeInTheDocument();

    wait(1); // 15 s: 10 s after the second appeared
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('with two toasts, both are gone at 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    wait(TOAST_MS - 1);
    expect(screen.queryAllByRole('alert')).toHaveLength(2);
    wait(1);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });
});
