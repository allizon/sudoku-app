// Replace-puzzle confirmation (TASK-12; import.md §5).
//
// Once a Puzzle has player input, pasting a new Puzzle asks before replacing
// it. Enter confirms, Escape cancels, and focus starts on cancel. Confirming
// starts the new Puzzle fresh; cancelling leaves the old one untouched.
import { fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import puzzle2 from '../../fixtures/puzzles/puzzle-2.txt?raw';
import { App } from './App';

/** The grid as 81 characters: a cell's digit, or `.` for a cell showing nothing. */
function gridText(grid: HTMLElement): string {
  return cellsOf(grid)
    .map((cell) => (cell.textContent ?? '').trim() || '.')
    .join('');
}

/** The 81 cells of the grid, left to right, top to bottom. */
function cellsOf(grid: HTMLElement): HTMLElement[] {
  return within(grid)
    .getAllByRole('row')
    .flatMap((row) => within(row).getAllByRole('gridcell'));
}

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
  render(<App />);
  const grid = screen.getByRole('grid');
  focusGrid(grid);
  paste(text);
  return grid;
}

/** Presses a key on the currently focused element (usually the grid). */
function pressKey(key: string, options?: Omit<KeyboardEventInit, 'key'>) {
  const target = document.activeElement ?? document.body;
  fireEvent.keyDown(target, { key, ...options });
  fireEvent.keyUp(target, { key, ...options });
}

/** The confirmation dialog, or throws if it is not on screen. */
function confirmationDialog(): HTMLElement {
  return screen.getByRole('alertdialog');
}

/** Whether a confirmation dialog is currently shown. */
function hasConfirmationDialog(): boolean {
  return screen.queryByRole('alertdialog') !== null;
}

/** The normalized text of the loaded Puzzle: `.` for empty cells. */
const normalized = (text: string) => text.replace(/[\s,]/g, '').replace(/[0-]/g, '.');

/** puzzle1 after placing a 7 in row 1, column 1. */
const PUZZLE1_WITH_7_PLACED = '7' + normalized(puzzle1).slice(1);

describe('Replace-puzzle confirmation: asking', () => {
  it('pasting a valid Puzzle when the current Puzzle has a Placed digit asks to confirm replacing it', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' }); // place a digit in row 1, column 1
    paste(puzzle2);
    expect(hasConfirmationDialog()).toBe(true);
    expect(confirmationDialog()).toHaveTextContent(/replace/i);
  });

  it('pasting a valid Puzzle when the current Puzzle has a Center mark asks to confirm replacing it', () => {
    renderAndPaste(puzzle1);
    pressKey('n', { code: 'KeyN' }); // switch to center mode
    pressKey('3', { code: 'Digit3' }); // add a center mark
    paste(puzzle2);
    expect(hasConfirmationDialog()).toBe(true);
  });

  it('pasting a valid Puzzle when the current Puzzle has a Corner mark asks to confirm replacing it', () => {
    renderAndPaste(puzzle1);
    pressKey('n', { code: 'KeyN' }); // center
    pressKey('n', { code: 'KeyN' }); // corner
    pressKey('4', { code: 'Digit4' }); // add a corner mark
    paste(puzzle2);
    expect(hasConfirmationDialog()).toBe(true);
  });

  it('pasting a valid Puzzle when the current Puzzle has only Givens replaces it without asking', () => {
    const grid = renderAndPaste(puzzle1);
    paste(puzzle2);
    expect(hasConfirmationDialog()).toBe(false);
    expect(gridText(grid)).toBe(normalized(puzzle2));
  });

  it('pasting a valid Puzzle onto an empty grid loads it without asking', () => {
    const grid = renderAndPaste(puzzle2);
    expect(hasConfirmationDialog()).toBe(false);
    expect(gridText(grid)).toBe(normalized(puzzle2));
  });

  it('a rejected paste with player input in progress shows the parse error and does not show the confirmation', () => {
    const grid = renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste('not a puzzle');
    expect(hasConfirmationDialog()).toBe(false);
    expect(gridText(grid)).toBe(PUZZLE1_WITH_7_PLACED);
    expect(screen.getByRole('alert')).not.toBeEmptyDOMElement();
  });
});

describe('Replace-puzzle confirmation: keyboard', () => {
  it('focus starts on the cancel button', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    const cancel = screen.getByRole('button', { name: /cancel/i });
    expect(document.activeElement).toBe(cancel);
  });

  it('the confirm button is labelled Import', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    expect(screen.getByRole('button', { name: /^import$/i })).toBeInTheDocument();
  });

  it('Enter confirms the replacement', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Enter');
    expect(hasConfirmationDialog()).toBe(false);
    expect(gridText(screen.getByRole('grid'))).toBe(normalized(puzzle2));
  });

  it('Escape cancels the replacement', () => {
    const grid = renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    expect(hasConfirmationDialog()).toBe(false);
    expect(gridText(grid)).toBe(PUZZLE1_WITH_7_PLACED);
  });
});

describe('Replace-puzzle confirmation: confirming', () => {
  it('confirming loads the new Givens', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Enter');
    expect(gridText(screen.getByRole('grid'))).toBe(normalized(puzzle2));
  });

  it('confirming resets the undo history so the old Puzzle cannot be undone back to', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    pressKey('z', { code: 'KeyZ', metaKey: true }); // undo the placed digit
    paste(puzzle2);
    pressKey('Enter');
    // After replacement, undo should do nothing (history is empty).
    pressKey('z', { code: 'KeyZ', metaKey: true });
    expect(gridText(screen.getByRole('grid'))).toBe(normalized(puzzle2));
  });

  it('confirming returns to fill mode', () => {
    renderAndPaste(puzzle1);
    pressKey('n', { code: 'KeyN' }); // center mode
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Enter');
    pressKey('3', { code: 'Digit3' });
    // In fill mode, 3 is placed at row 1, column 1 of the new Puzzle.
    const grid = screen.getByRole('grid');
    expect(cellsOf(grid)[0]).toHaveTextContent(/^3$/);
  });

  it('confirming selects row 1, column 1', () => {
    renderAndPaste(puzzle1);
    pressKey('ArrowDown');
    pressKey('ArrowRight');
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Enter');
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-activedescendant', 'cell-1-1');
  });
});

describe('Replace-puzzle confirmation: cancelling', () => {
  it('cancelling leaves the current Givens in place', () => {
    const grid = renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    expect(gridText(grid)).toBe(PUZZLE1_WITH_7_PLACED);
  });

  it('cancelling leaves the current Placed digits in place', () => {
    const grid = renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    expect(cellsOf(grid)[0]).toHaveTextContent(/^7$/);
  });

  it('cancelling leaves the undo history intact', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    pressKey('z', { code: 'KeyZ', metaKey: true }); // undo the placed digit
    const grid = screen.getByRole('grid');
    expect(cellsOf(grid)[0]).not.toHaveTextContent(/^7$/);
  });

  it('cancelling leaves the selection in place', () => {
    renderAndPaste(puzzle1);
    pressKey('ArrowRight');
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-activedescendant', 'cell-1-2');
  });

  it('cancelling leaves the Entry mode in place', () => {
    renderAndPaste(puzzle1);
    pressKey('n', { code: 'KeyN' }); // center mode
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    pressKey('Escape');
    const line = screen.getByText(/mode$/i);
    expect(line).toHaveTextContent('Center mode');
  });
});

describe('Replace-puzzle confirmation: layout safety', () => {
  it('the confirmation dialog is not inside the grid element, so grid key handlers do not intercept typing', () => {
    renderAndPaste(puzzle1);
    pressKey('7', { code: 'Digit7' });
    paste(puzzle2);
    const grid = screen.getByRole('grid');
    const dialog = confirmationDialog();
    expect(grid.contains(dialog)).toBe(false);
  });
});
