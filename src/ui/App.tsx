import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { parsePuzzle } from '../core/parse';
import { boxOf, createEmptyPuzzle, isEmptyPuzzle, type Puzzle } from '../core/puzzle';
import { Toasts, useToasts } from './Toasts';
import './App.css';

/** Shown when a paste arrives while a Puzzle is loaded (milestones.md M0). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

export function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(createEmptyPuzzle);
  const { toasts, showToast, dismissToast, dismissAllToasts } = useToasts();
  const gridRef = useRef<HTMLDivElement>(null);

  // The grid has focus from the start, so a paste works without a click first.
  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  // Paste imports only onto an empty grid; a loaded Puzzle is never replaced
  // in M0, and a rejected paste leaves the grid as it was.
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!isEmptyPuzzle(puzzle)) {
      showToast(REFUSAL);
      return;
    }
    const result = parsePuzzle(event.clipboardData.getData('text/plain'));
    if (result.ok) setPuzzle(result.puzzle);
    else for (const error of result.errors) showToast(error.message);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') dismissAllToasts();
  }

  return (
    <main className="app">
      <h1 className="visually-hidden">Sudoku</h1>
      <div
        className="grid"
        role="grid"
        aria-label="Sudoku grid"
        tabIndex={0}
        ref={gridRef}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
      >
        {puzzle.cells.map((row, r) => (
          <div className="row" role="row" key={r}>
            {row.map((cell, c) => (
              // data-box numbers the boxes 1–9 for people reading the markup.
              <div
                className={cell.kind === 'given' ? 'cell given' : 'cell'}
                role="gridcell"
                data-box={boxOf(r, c) + 1}
                key={c}
              >
                {cell.kind === 'given' ? cell.digit : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
