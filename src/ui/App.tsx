import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { parsePuzzle } from '../core/parse';
import { boxOf, createEmptyPuzzle, isEmptyPuzzle, type Cell, type Puzzle } from '../core/puzzle';
import { Toasts, useToasts } from './Toasts';
import './App.css';

/** Shown when a paste arrives while a Puzzle is loaded (milestones.md M0). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

/** A cell's accessible name, e.g. "Row 1, column 1, given 7". */
function cellLabel(cell: Cell, row: number, column: number): string {
  const contents = cell.kind === 'given' ? `given ${cell.digit}` : 'empty';
  return `Row ${row + 1}, column ${column + 1}, ${contents}`;
}

export function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(createEmptyPuzzle);
  const { toasts, showToast, dismissToast, dismissAllToasts } = useToasts();
  const gridRef = useRef<HTMLDivElement>(null);
  const empty = isEmptyPuzzle(puzzle);

  // The grid has focus from the start, so a paste works without a click first.
  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  // Paste imports only onto an empty grid; a loaded Puzzle is never replaced
  // in M0, and a rejected paste leaves the grid as it was.
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!empty) {
      showToast('refusal', REFUSAL);
      return;
    }
    const result = parsePuzzle(event.clipboardData.getData('text/plain'));
    if (result.ok) setPuzzle(result.puzzle);
    else for (const error of result.errors) showToast('parse-error', error.message);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') dismissAllToasts();
  }

  // Pressing the mouse anywhere outside the grid would otherwise move focus
  // off it, and a paste would then do nothing (import.md §2).
  function handleMouseDown(event: MouseEvent<HTMLElement>) {
    const grid = gridRef.current;
    if (grid !== null && event.target instanceof Node && !grid.contains(event.target)) event.preventDefault();
  }

  return (
    <main className="app" onMouseDown={handleMouseDown}>
      <h1 className="visually-hidden">Sudoku</h1>
      <div
        className="grid"
        role="grid"
        aria-label="Sudoku grid"
        aria-describedby={empty ? 'grid-help' : undefined}
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
                aria-label={cellLabel(cell, r, c)}
                aria-readonly={cell.kind === 'given' ? true : undefined}
                key={c}
              >
                {cell.kind === 'given' ? cell.digit : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      {empty && (
        <p className="hint" id="grid-help">
          Paste a puzzle to start
        </p>
      )}
      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
