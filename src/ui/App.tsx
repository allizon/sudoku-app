import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { fillDigit } from '../core/fill';
import { digitFromCode } from '../core/keys';
import { parsePuzzle } from '../core/parse';
import { boxOf, createEmptyPuzzle, isEmptyPuzzle, type Cell, type Puzzle } from '../core/puzzle';
import { moveSelection, type Direction, type Position } from '../core/selection';
import { Toasts, useToasts } from './Toasts';
import './App.css';

/** Shown when a paste arrives while a Puzzle is loaded (milestones.md M0). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

/** How long the grid's focus flash lasts, matching its animation in App.css. */
const FLASH_MS = 1_000;

/** A cell's accessible name, e.g. "Row 1, column 1, given 7". */
function cellLabel(cell: Cell, row: number, column: number): string {
  const contents = (() => {
    switch (cell.kind) {
      case 'empty':
        return 'empty';
      case 'given':
        return `given ${cell.digit}`;
      case 'placed':
        return `placed ${cell.digit}`;
    }
  })();
  return `Row ${row + 1}, column ${column + 1}, ${contents}`;
}

const ARROW_DIRECTIONS: Partial<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** A cell's stable id, for the grid's aria-activedescendant. */
function cellId(row: number, column: number): string {
  return `cell-${row + 1}-${column + 1}`;
}

export function App() {
  const [puzzle, setPuzzle] = useState<Puzzle>(createEmptyPuzzle);
  const { toasts, showToast, dismissToast, dismissAllToasts } = useToasts();
  // Exactly one cell is always selected; a Puzzle opens at row 1, column 1 (keymap.md §4).
  const [selected, setSelected] = useState<Position>({ row: 0, column: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const empty = isEmptyPuzzle(puzzle);
  // Each focus starts a 1-second flash (import.md §2). focusCount tells one
  // focus from the next, so a focus mid-flash restarts the timer.
  const [focusCount, setFocusCount] = useState(0);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!flashing) return;
    const timer = setTimeout(() => setFlashing(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashing, focusCount]);

  function handleFocus() {
    setFocusCount((count) => count + 1);
    setFlashing(true);
  }

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
    if (result.ok) {
      setPuzzle(result.puzzle);
      // A newly opened Puzzle selects row 1, column 1 (keymap.md §4).
      setSelected({ row: 0, column: 0 });
    } else for (const error of result.errors) showToast('parse-error', error.message);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') dismissAllToasts();
    // Digits go by physical key, so Shift is fine; Cmd, Ctrl and Alt belong to
    // the browser, and auto-repeat must not toggle (keymap.md §1).
    const digit = digitFromCode(event.code);
    if (digit !== undefined) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      event.preventDefault();
      setPuzzle((current) => fillDigit(current, selected, digit));
      return;
    }
    // Modified arrows are left to the browser (and to later features).
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = ARROW_DIRECTIONS[event.key];
    if (direction !== undefined) {
      event.preventDefault();
      setSelected((position) => moveSelection(position, direction));
    }
  }

  // Pressing the mouse anywhere outside the grid would otherwise move focus
  // off it, and a paste would then do nothing (import.md §2).
  function handleMouseDown(event: MouseEvent<HTMLElement>) {
    const grid = gridRef.current;
    if (grid !== null && event.target instanceof Node && !grid.contains(event.target)) event.preventDefault();
  }

  // Clicking a cell selects it and keeps keyboard focus on the grid (keymap.md §1).
  function selectCell(row: number, column: number) {
    setSelected({ row, column });
    gridRef.current?.focus();
  }

  return (
    <main className="app" onMouseDown={handleMouseDown}>
      <h1 className="visually-hidden">Sudoku</h1>
      <div
        className="grid"
        role="grid"
        aria-label="Sudoku grid"
        aria-describedby={empty ? 'grid-help' : undefined}
        aria-activedescendant={cellId(selected.row, selected.column)}
        tabIndex={0}
        ref={gridRef}
        // Alternating a and b swaps the animation, so a focus mid-flash restarts it.
        data-flash={flashing ? (focusCount % 2 === 0 ? 'a' : 'b') : undefined}
        onFocus={handleFocus}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
      >
        {puzzle.cells.map((row, r) => (
          <div className="row" role="row" key={r}>
            {row.map((cell, c) => (
              // data-box numbers the boxes 1–9 for people reading the markup.
              <div
                className={cell.kind === 'empty' ? 'cell' : `cell ${cell.kind}`}
                role="gridcell"
                id={cellId(r, c)}
                data-box={boxOf(r, c) + 1}
                aria-label={cellLabel(cell, r, c)}
                aria-selected={r === selected.row && c === selected.column}
                onClick={() => selectCell(r, c)}
                aria-readonly={cell.kind === 'given' ? true : undefined}
                key={c}
              >
                {cell.kind === 'empty' ? null : cell.digit}
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
