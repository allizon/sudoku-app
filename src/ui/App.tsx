import { boxOf, createEmptyPuzzle } from '../core/puzzle';
import './App.css';

export function App() {
  const puzzle = createEmptyPuzzle();

  return (
    <main className="app">
      <h1 className="visually-hidden">Sudoku</h1>
      <div className="grid" role="grid" aria-label="Sudoku grid">
        {puzzle.cells.map((row, r) => (
          <div className="row" role="row" key={r}>
            {row.map((_cell, c) => (
              // data-box numbers the boxes 1–9 for people reading the markup.
              <div className="cell" role="gridcell" data-box={boxOf(r, c) + 1} key={c} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
