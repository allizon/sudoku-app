// Review round 1 regressions for the Selected cell (TASK-3; keymap.md §4).
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import { App } from './App';

const appCss = readFileSync(`${import.meta.dirname}/App.css`, 'utf8');

function cells(grid: HTMLElement): HTMLElement[][] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('gridcell'));
}

function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = cells(grid)[row]?.[column];
  if (cell === undefined) throw new Error('no cell');
  return cell;
}

function selectedCell(grid: HTMLElement): HTMLElement {
  const found = cells(grid).flat().filter((cell) => cell.getAttribute('aria-selected') === 'true');
  expect(found).toHaveLength(1);
  return found[0] as HTMLElement;
}

function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: { types: ['text/plain'], getData: () => text },
  });
}

function click(cell: HTMLElement) {
  fireEvent.mouseDown(cell);
  fireEvent.click(cell);
}

afterEach(cleanup);

describe('Selected cell: importing a Puzzle', () => {
  it('an accepted paste selects row 1, column 1 even if the selection had moved', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    click(cellAt(grid, 4, 4));
    paste(puzzle1);
    expect(selectedCell(grid)).toBe(cellAt(grid, 0, 0));
  });

  it('a refused paste leaves the selection where it was', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    paste(puzzle1);
    click(cellAt(grid, 4, 4));
    paste(puzzle1);
    expect(selectedCell(grid)).toBe(cellAt(grid, 4, 4));
  });

  it('a paste that fails to parse leaves the selection where it was', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    click(cellAt(grid, 4, 4));
    paste('not a puzzle');
    expect(selectedCell(grid)).toBe(cellAt(grid, 4, 4));
  });
});

describe('Selected cell: announced to assistive technology', () => {
  it('aria-activedescendant on the grid points at the Selected cell, through arrows and clicks', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    const check = () => {
      const id = grid.getAttribute('aria-activedescendant');
      expect(id).toBeTruthy();
      expect(document.getElementById(id ?? '')).toBe(selectedCell(grid));
    };
    check();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    check();
    click(cellAt(grid, 6, 2));
    check();
  });
});

describe('Selected cell: arrows with modifier keys', () => {
  it.each(['shiftKey', 'altKey', 'ctrlKey', 'metaKey'])('%s + Arrow does nothing and is not prevented', (modifier) => {
    render(<App />);
    const grid = screen.getByRole('grid');
    const notCancelled = fireEvent.keyDown(grid, { key: 'ArrowRight', [modifier]: true });
    expect(notCancelled).toBe(true);
    expect(selectedCell(grid)).toBe(cellAt(grid, 0, 0));
  });

  it('a plain arrow moves and is prevented', () => {
    render(<App />);
    const grid = screen.getByRole('grid');
    expect(fireEvent.keyDown(grid, { key: 'ArrowRight' })).toBe(false);
    expect(selectedCell(grid)).toBe(cellAt(grid, 0, 1));
  });
});

describe('Selected cell: styling', () => {
  it('cells are not text-selectable, so double-click does not paint over the ring', () => {
    expect(appCss).toMatch(/\.cell\s*\{[^}]*user-select:\s*none/);
  });

  it('the selection stays visible in forced-colors mode', () => {
    const rule = /\.cell\[aria-selected=['"]?true['"]?\]\s*\{([^}]*)\}/.exec(appCss);
    expect(rule?.[1]).toMatch(/outline:\s*\d+px solid transparent/);
  });

  it('the selected ring has a nonzero spread', () => {
    const rule = /\.cell\[aria-selected=['"]?true['"]?\]\s*\{([^}]*)\}/.exec(appCss);
    expect(rule?.[1]).toMatch(/inset 0 0 0 [1-9]\d*px var\(--/);
  });
});
