// Opening the app shows an empty 9×9 grid with the nine 3×3 boxes
// visibly distinguished (TASK-1, AC #5).
import { render, screen, within } from '@testing-library/react';
import { App } from './App';

function renderApp() {
  render(<App />);
  return screen.getByRole('grid');
}

/** The cells of the grid as rows[row][column], both 0-based here. */
function cellsByRow(grid: HTMLElement): HTMLElement[][] {
  return within(grid)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('gridcell'));
}

/** Box number 1–9 for a 0-based row and column, numbered left to right, top to bottom. */
const expectedBox = (row: number, column: number) => Math.floor(row / 3) * 3 + Math.floor(column / 3) + 1;

describe('App: the empty grid', () => {
  it('opening the app shows one grid', () => {
    renderApp();
    expect(screen.getAllByRole('grid')).toHaveLength(1);
  });

  it('the grid has 9 rows of 9 cells', () => {
    const rows = cellsByRow(renderApp());
    expect(rows).toHaveLength(9);
    for (const row of rows) expect(row).toHaveLength(9);
  });

  it('every one of the 81 cells is empty', () => {
    const cells = cellsByRow(renderApp()).flat();
    expect(cells).toHaveLength(81);
    for (const cell of cells) expect(cell).toHaveTextContent(/^$/);
  });

  it('every cell belongs to the 3×3 box that contains its row and column', () => {
    const rows = cellsByRow(renderApp());
    rows.forEach((row, r) =>
      row.forEach((cell, c) => {
        expect(cell).toHaveAttribute('data-box', String(expectedBox(r, c)));
      }),
    );
  });

  it('the grid is divided into nine boxes of nine cells each', () => {
    const cells = cellsByRow(renderApp()).flat();
    const counts = new Map<string, number>();
    for (const cell of cells) {
      const box = cell.getAttribute('data-box') ?? 'none';
      counts.set(box, (counts.get(box) ?? 0) + 1);
    }
    expect([...counts.entries()].sort()).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((box) => [box, 9]),
    );
  });
});
