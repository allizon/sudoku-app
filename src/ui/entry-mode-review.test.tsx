// Entry mode on import (TASK-6 review round 1, UX-3; import.md §5): an accepted import
// starts the new Puzzle in fill mode, whatever the Sticky mode was before the paste.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import type { Store } from '../core/store';
import { App } from './App';

function memoryStore(): Store {
  const saved = new Map<string, unknown>();
  return { get: (key) => saved.get(key), set: (key, value) => void saved.set(key, value) };
}

function renderApp() {
  render(<App store={memoryStore()} />);
  return screen.getByRole('grid');
}

function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = within(grid).getAllByRole('row')[row]?.querySelectorAll<HTMLElement>('[role="gridcell"]')[column];
  if (cell === undefined) throw new Error(`no cell at ${row}, ${column}`);
  return cell;
}

const target = () => document.activeElement ?? document.body;

function pressN() {
  fireEvent.keyDown(target(), { key: 'n', code: 'KeyN' });
  fireEvent.keyUp(target(), { key: 'n', code: 'KeyN' });
}

const pressDigit = (digit: number) => fireEvent.keyDown(target(), { key: String(digit), code: `Digit${digit}` });

function paste(text: string) {
  fireEvent.paste(target(), {
    clipboardData: {
      types: ['text/plain'],
      getData: (format: string) => (format === 'text/plain' || format === 'text' ? text : ''),
    },
  });
}

function entryModeLine(): HTMLElement {
  const line = document.querySelector<HTMLElement>('.entry-mode-line');
  if (line === null) throw new Error('no Entry mode line');
  return line;
}

afterEach(cleanup);

describe('Entry mode: an accepted import starts in fill mode (import.md §5)', () => {
  it.each([
    ['center', 1],
    ['corner', 2],
  ] as const)('after switching to %s mode, pasting a Puzzle shows fill mode and a digit places', (mode, presses) => {
    const grid = renderApp();
    for (let i = 0; i < presses; i += 1) pressN();
    expect(entryModeLine()).toHaveAttribute('data-entry-mode', mode);
    paste(puzzle1); // row 1, column 1 is empty
    expect(entryModeLine()).toHaveAttribute('data-entry-mode', 'fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('a rejected paste leaves the Sticky mode as it was', () => {
    renderApp();
    pressN();
    paste('not a puzzle');
    expect(entryModeLine()).toHaveAttribute('data-entry-mode', 'center');
  });
});
