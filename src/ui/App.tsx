import { createEmptyPuzzle } from '../core/puzzle';
import './App.css';

/** Box number 1–9 for a 0-based row and column, numbered left to right, top to bottom. */
const boxOf = (row: number, column: number) => Math.floor(row / 3) * 3 + Math.floor(column / 3) + 1;

export function App() {
  const puzzle = createEmptyPuzzle();

  return (
    <main className="app">
      <div className="grid" role="grid" aria-label="Sudoku grid">
        {puzzle.cells.map((row, r) => (
          <div className="row" role="row" key={r}>
            {row.map((_cell, c) => (
              <div className="cell" role="gridcell" data-box={boxOf(r, c)} key={c} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
