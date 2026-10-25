// Pasting a Puzzle onto the grid (TASK-4, AC #1, #4, #5, #6, #9, #10, #11, #12,
// #13; import.md §2, §3, §6; milestones.md M0 "Paste import, parsing only").
//
// Cmd+V on macOS and Ctrl+V elsewhere both reach the page as the browser's
// `paste` event on the focused element, carrying the clipboard text; jsdom has
// no clipboard or shortcut handling, so these tests fire that paste event.
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import puzzle2 from '../../fixtures/puzzles/puzzle-2.txt?raw';
import { App } from './App';

/**
 * App.css as written. Read from disk because Vitest empties imported CSS, even
 * with ?raw; jsdom does no layout, so some rules can only be checked as text.
 */
const appCss = readFileSync(`${import.meta.dirname}/App.css`, 'utf8');

/** import.md §6 Sample A, `0` for empty. */
const SAMPLE_A_ZEROS = '020060080700001009000809000072000600100000007005000930000307000300500004010020060';
/** import.md §6 Sample A in the site's permalink notation, `-` for empty. */
const SAMPLE_A_DASHES = '-2--6--8-7----1--9---8-9----72---6--1-------7--5---93----3-7---3--5----4-1--2--6-';

/** The refusal shown when a Puzzle is already loaded (Alix, TASK-4 step 2). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

/** How long a toast stays before dismissing itself (Alix, TASK-4 step 2). */
const TOAST_MS = 10_000;

/** The one live region that holds every toast (UX-6, approved by Alix). */
const toastRegion = () => screen.getByRole('alert');

/** Every toast on screen, in document order: the live region's children. */
const toastsOnScreen = () =>
  [...toastRegion().children].filter((toast): toast is HTMLElement => toast instanceof HTMLElement);

/** The single toast on screen; fails when there is not exactly one. */
function onlyToast(): HTMLElement {
  const toasts = toastsOnScreen();
  expect(toasts).toHaveLength(1);
  const [toast] = toasts;
  if (toast === undefined) throw new Error('expected one toast');
  return toast;
}

/** The text of every toast on screen, in document order. */
const toastTexts = () => toastsOnScreen().map((toast) => (toast.textContent ?? '').trim());

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
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('a successful paste shows no toast', () => {
    renderAndPaste(puzzle1);
    expect(toastsOnScreen()).toHaveLength(0);
    expect(toastRegion()).toBeEmptyDOMElement();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
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
    const [toast] = toastsOnScreen();
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
    expect(toastsOnScreen()).toHaveLength(0);
    focusGrid(grid);
    paste(puzzle2);
    expect(toastTexts()).toEqual([REFUSAL]);
    expect(grid.contains(onlyToast())).toBe(false);
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
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('the refusal toast is still shown just before 10 seconds and gone at 10 seconds', () => {
    const grid = renderAndPaste(puzzle1);
    focusGrid(grid);
    paste(puzzle2);
    wait(TOAST_MS - 1);
    expect(toastTexts()).toEqual([REFUSAL]);
    wait(1);
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('clicking a toast dismisses it before 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    fireEvent.click(onlyToast());
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('clicking anywhere on a toast dismisses it, including its text', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    fireEvent.click(screen.getByText('found 79 cells, expected 81', { exact: false }));
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('with two toasts, clicking the first leaves the second', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    const [first] = toastsOnScreen();
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
    const [first, second] = toastsOnScreen();

    wait(TOAST_MS - 5_000 - 1); // just before 10 s
    expect(toastsOnScreen()).toHaveLength(2);

    wait(1); // 10 s: the first is gone, the second remains
    expect(first).not.toBeInTheDocument();
    expect(second).toBeInTheDocument();
    expect(toastTexts()).toEqual([REFUSAL]);

    wait(5_000 - 1); // just before 15 s
    expect(second).toBeInTheDocument();

    wait(1); // 15 s: 10 s after the second appeared
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('with two toasts, both are gone at 10 seconds', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    wait(TOAST_MS - 1);
    expect(toastsOnScreen()).toHaveLength(2);
    wait(1);
    expect(toastsOnScreen()).toHaveLength(0);
  });
});

describe('Paste import: toasts share one live region', () => {
  it('one live region is present before any toast, and empty', () => {
    renderApp();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('two toasts are two plain children of that one region', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(toastsOnScreen()).toHaveLength(2);
    for (const toast of toastsOnScreen()) expect(toast).not.toHaveAttribute('role');
  });

  it('the live region announces each new toast, not the whole stack again', () => {
    renderApp();
    expect(toastRegion()).toHaveAttribute('aria-atomic', 'false');
  });

  it('the live region is outside the grid', () => {
    const grid = renderApp();
    expect(grid.contains(toastRegion())).toBe(false);
  });
});

describe('Paste import: the grid keeps focus, so a paste always lands', () => {
  it('the grid has focus as soon as the app opens', () => {
    const grid = renderApp();
    expect(grid.contains(document.activeElement)).toBe(true);
  });

  it('opening the app and pasting straight away loads the Puzzle', () => {
    const grid = renderApp();
    paste(puzzle1);
    expect(gridText(grid)).toBe(normalized(puzzle1));
  });

  it('pressing the mouse on a toast does not move focus off the grid', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    const [toast] = toastsOnScreen();
    if (toast === undefined) throw new Error('expected a toast');
    // jsdom does not move focus on mousedown, so check that the browser's
    // focus change is cancelled.
    expect(fireEvent.mouseDown(toast)).toBe(false);
  });

  it('pressing and clicking a toast dismisses it, leaves the grid focused, and a later paste lands', () => {
    const grid = renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    const [toast] = toastsOnScreen();
    if (toast === undefined) throw new Error('expected a toast');
    fireEvent.mouseDown(toast);
    fireEvent.click(toast);
    expect(toast).not.toBeInTheDocument();
    expect(grid.contains(document.activeElement)).toBe(true);
    paste(puzzle1);
    expect(gridText(grid)).toBe(normalized(puzzle1));
  });
});

describe('Paste import: pressing the mouse outside the grid keeps focus on it', () => {
  it('pressing the mouse on the toast stack itself, between toasts, does not move focus', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    expect(fireEvent.mouseDown(toastRegion())).toBe(false);
  });

  it('pressing the mouse on the page background does not move focus', () => {
    renderApp();
    expect(fireEvent.mouseDown(screen.getByRole('main'))).toBe(false);
  });

  it('pressing the mouse on a cell is left to the browser, which focuses the grid', () => {
    const grid = renderApp();
    const [cell] = cellsOf(grid);
    if (cell === undefined) throw new Error('expected a cell');
    expect(fireEvent.mouseDown(cell)).toBe(true);
  });
});

describe('Paste import: Escape dismisses every toast', () => {
  it('pressing Escape while the grid has focus dismisses all the toasts', () => {
    const grid = renderAndPaste(SAMPLE_A_ZEROS.slice(0, 40) + 'x' + SAMPLE_A_ZEROS.slice(41, 79));
    expect(toastsOnScreen()).toHaveLength(2);
    fireEvent.keyDown(grid, { key: 'Escape' });
    expect(toastsOnScreen()).toHaveLength(0);
  });

  it('pressing Escape leaves the grid as it was', () => {
    const grid = renderAndPaste(puzzle1);
    paste(puzzle2);
    const before = grid.innerHTML;
    fireEvent.keyDown(grid, { key: 'Escape' });
    expect(grid.innerHTML).toBe(before);
    expect(toastsOnScreen()).toHaveLength(0);
  });
});

describe('Paste import: Givens are marked for styling and for screen readers', () => {
  it('a cell holding a Given has the class given, and an empty cell does not', () => {
    const grid = renderAndPaste('7' + '.'.repeat(80));
    const [givenCell, emptyCell] = cellsOf(grid);
    expect(givenCell).toHaveClass('given');
    expect(emptyCell).not.toHaveClass('given');
  });

  it('each cell is labeled with its row, column, and contents', () => {
    const grid = renderAndPaste('7' + '.'.repeat(80));
    const cells = cellsOf(grid);
    expect(cells[0]).toHaveAccessibleName('Row 1, column 1, given 7');
    expect(cells[1]).toHaveAccessibleName('Row 1, column 2, empty');
    expect(cells[80]).toHaveAccessibleName('Row 9, column 9, empty');
  });

  it('a Given is read-only, and an empty cell is not', () => {
    const grid = renderAndPaste('7' + '.'.repeat(80));
    const [givenCell, emptyCell] = cellsOf(grid);
    expect(givenCell).toHaveAttribute('aria-readonly', 'true');
    expect(emptyCell).not.toHaveAttribute('aria-readonly');
  });

  it('the empty grid is described as "Paste a puzzle to start"', () => {
    expect(renderApp()).toHaveAccessibleDescription('Paste a puzzle to start');
  });

  it('once a Puzzle is loaded, the grid no longer asks for a paste', () => {
    expect(renderAndPaste(puzzle1)).toHaveAccessibleDescription('');
    expect(screen.queryByText('Paste a puzzle to start')).not.toBeInTheDocument();
  });
});

describe('Paste import: refusals and parse errors look different', () => {
  it('a parse error toast is of kind parse-error', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    expect(onlyToast()).toHaveAttribute('data-kind', 'parse-error');
  });

  it('the refusal toast is of kind refusal, unlike a parse error', () => {
    renderAndPaste(SAMPLE_A_ZEROS.slice(0, 79));
    const parseErrorKind = onlyToast().getAttribute('data-kind');
    cleanup();
    const grid = renderAndPaste(puzzle1);
    focusGrid(grid);
    paste(puzzle2);
    const refusalKind = onlyToast().getAttribute('data-kind');
    expect(refusalKind).toBe('refusal');
    expect(refusalKind).not.toBe(parseErrorKind);
  });

  it('the refusal toast takes its background from its own token', () => {
    expect(appCss).toMatch(/\.toast\[data-kind='refusal'\]\s*\{[^}]*background:\s*var\(--toast-refusal-background\)/);
    expect(appCss).toMatch(/--toast-refusal-background:/);
  });
});

describe('Paste import: the empty grid shows a hint', () => {
  it('"Paste a puzzle to start" is shown on screen, not only to screen readers', () => {
    renderApp();
    expect(screen.getByText('Paste a puzzle to start')).not.toHaveClass('visually-hidden');
  });

  it('the hint sits below the grid, outside it', () => {
    const grid = renderApp();
    const hint = screen.getByText('Paste a puzzle to start');
    expect(grid.contains(hint)).toBe(false);
    expect(grid.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the hint takes its color from a token', () => {
    expect(appCss).toMatch(/\.hint\s*\{[^}]*color:\s*var\(--hint-text\)/);
    renderApp();
    expect(screen.getByText('Paste a puzzle to start')).toHaveClass('hint');
  });
});

describe('Paste import: toasts move below the grid when there is no room beside it', () => {
  // jsdom does no layout, so this checks the rule is in App.css; that it
  // actually keeps the stack off the grid is checked only by reasoning.
  it('below 988px wide, the toast stack is placed at the bottom of the window', () => {
    const narrow = /@media \(width < 988px\)\s*\{([\s\S]*?)\n\}/.exec(appCss);
    expect(narrow).not.toBeNull();
    expect(narrow?.[1]).toMatch(/\.toasts\s*\{[^}]*top:\s*auto;[^}]*bottom:/);
  });
});
