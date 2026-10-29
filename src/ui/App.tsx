import { useEffect, useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { loadColorScheme, saveColorScheme, type ColorScheme } from '../core/color-scheme';
import { centerMarksOf, cornerMarksOf } from '../core/candidates';
import { activeEntryMode, holdLetter, NONE_HELD, releaseLetter, type HeldLetters } from '../core/chord';
import { enterDigit, INITIAL_ENTRY_MODE, nextEntryMode, type EntryMode } from '../core/entry-mode';
import { chordLetterFromCode, digitFromCode } from '../core/keys';
import { parsePuzzle } from '../core/parse';
import { boxOf, createEmptyPuzzle, isEmptyPuzzle, type Cell, type Puzzle } from '../core/puzzle';
import { moveSelection, type Direction, type Position } from '../core/selection';
import type { Store } from '../core/store';
import { createBrowserStore } from '../storage/browser-store';
import { useToastPlacement } from './toast-placement';
import { Toasts, useToasts } from './Toasts';
import './App.css';

/** Shown when a paste arrives while a Puzzle is loaded (milestones.md M0). */
const REFUSAL = 'A puzzle is already loaded — reload the page to start a new one.';

/** How long the grid's focus flash lasts, matching its animation in App.css. */
const FLASH_MS = 1_000;

/** What the Entry mode line says in each Entry mode (keymap.md §2). */
const ENTRY_MODE_NAMES: Readonly<Record<EntryMode, string>> = {
  fill: 'Fill mode',
  center: 'Center mode',
  corner: 'Corner mode',
};

/**
 * What a cell's accessible name says it holds, e.g. "given 7", or
 * "center marks 1 2, corner marks 3 9". Candidates hidden under a Placed
 * digit are not named.
 */
function cellContents(cell: Cell): string {
  switch (cell.kind) {
    case 'empty':
      return 'empty';
    case 'given':
      return `given ${cell.digit}`;
    case 'placed':
      return `placed ${cell.digit}`;
    case 'candidates': {
      const parts: string[] = [];
      const centerMarks = centerMarksOf(cell);
      const cornerMarks = cornerMarksOf(cell);
      if (centerMarks.length > 0) parts.push(`center marks ${centerMarks.join(' ')}`);
      if (cornerMarks.length > 0) parts.push(`corner marks ${cornerMarks.join(' ')}`);
      return parts.join(', ');
    }
  }
}

/** A cell's accessible name, e.g. "Row 1, column 1, given 7". */
function cellLabel(cell: Cell, row: number, column: number): string {
  return `Row ${row + 1}, column ${column + 1}, ${cellContents(cell)}`;
}

/**
 * What a cell draws: its digit, or its Candidates (Center marks small in the
 * middle, Corner marks in the corners). Candidates hidden under a Placed
 * digit are left out of the page.
 */
function CellContents({ cell }: { readonly cell: Cell }) {
  switch (cell.kind) {
    case 'empty':
      return null;
    case 'given':
    case 'placed':
      return cell.digit;
    case 'candidates': {
      const centerMarks = centerMarksOf(cell);
      const cornerMarks = cornerMarksOf(cell);
      return (
        <>
          {centerMarks.length > 0 && <span className="center-marks">{centerMarks.join('')}</span>}
          {cornerMarks.length > 0 && (
            <span className="corner-marks">
              {cornerMarks.map((mark) => (
                <span className="corner-mark" key={mark}>
                  {mark}
                </span>
              ))}
            </span>
          )}
        </>
      );
    }
  }
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

type AppProps = {
  /** Where saved state is kept; browser storage when not given. */
  readonly store?: Store;
};

export function App({ store: givenStore }: AppProps) {
  const [store] = useState<Store>(() => givenStore ?? createBrowserStore());
  // The app starts light unless dark was chosen; the system setting is not used (display.md §2).
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => loadColorScheme(store));
  const [puzzle, setPuzzle] = useState<Puzzle>(createEmptyPuzzle);
  const { toasts, showToast, dismissToast, dismissAllToasts } = useToasts();
  // Exactly one cell is always selected; a Puzzle opens at row 1, column 1 (keymap.md §4).
  const [selected, setSelected] = useState<Position>({ row: 0, column: 0 });
  // The Sticky mode: fill on every start, not saved across reloads (keymap.md §2).
  const [entryMode, setEntryMode] = useState<EntryMode>(INITIAL_ENTRY_MODE);
  // The chord letters held down, which override the Sticky mode (keymap.md §3).
  const [held, setHeld] = useState<HeldLetters>(NONE_HELD);
  // undefined while C and S are both held: digit presses then do nothing.
  const activeMode = activeEntryMode(entryMode, held);
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

  const toastPlacement = useToastPlacement(gridRef);

  // A chord ends when its letter comes up, wherever focus is in the page and
  // whatever modifiers are down, and every chord ends when the window loses
  // focus, so a chord cannot get stuck (keymap.md §3, rules 4 and 7).
  useEffect(() => {
    function handleKeyUp(event: globalThis.KeyboardEvent) {
      // macOS reports no keyup for a letter let go while Cmd is down, so
      // letting go of Cmd ends every chord; a letter still held is pressed
      // again to resume (keymap.md §3, rule 7).
      if (event.key === 'Meta' || event.code === 'MetaLeft' || event.code === 'MetaRight') {
        setHeld(NONE_HELD);
        return;
      }
      const letter = chordLetterFromCode(event.code);
      if (letter !== undefined) setHeld((current) => releaseLetter(current, letter));
    }
    function handleBlur() {
      setHeld(NONE_HELD);
    }
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // App.css keys each scheme's tokens on the root element, and color-scheme
  // tells the browser to draw its own parts (scrollbars) to match. A layout
  // effect applies both before the browser paints.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-scheme', colorScheme);
    root.style.setProperty('color-scheme', colorScheme);
    return () => {
      root.removeAttribute('data-color-scheme');
      root.style.removeProperty('color-scheme');
    };
  }, [colorScheme]);

  // The toggle is a mouse control, so it hands keyboard focus back to the
  // grid even when the grid had lost it (keymap.md §1).
  function toggleColorScheme() {
    const next = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(next);
    saveColorScheme(store, next);
    gridRef.current?.focus();
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
      // A newly opened Puzzle selects row 1, column 1 (keymap.md §4) and
      // starts in fill mode (import.md §5).
      setSelected({ row: 0, column: 0 });
      setEntryMode(INITIAL_ENTRY_MODE);
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
      if (activeMode !== undefined) setPuzzle((current) => enterDigit(current, selected, activeMode, digit));
      return;
    }
    // C and S start a chord, by physical key and with or without Shift; a
    // repeat starts none, since only a first press holds the letter (keymap.md §3).
    const letter = chordLetterFromCode(event.code);
    if (letter !== undefined) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      event.preventDefault();
      setHeld((current) => holdLetter(current, letter));
      return;
    }
    // N cycles the Sticky mode, by physical key and with or without Shift,
    // like a digit (keymap.md §1, §2).
    if (event.code === 'KeyN') {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      event.preventDefault();
      setEntryMode(nextEntryMode);
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
                <CellContents cell={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/*
       * Always shown, so the player can see what a digit key will do: the
       * chord's mode while its letter is held, else the Sticky mode (keymap.md §2).
       * With C and S both held no mode applies, and the line keeps the Sticky mode.
       */}
      <p className="entry-mode-line" data-entry-mode={activeMode ?? entryMode} aria-live="polite">
        {ENTRY_MODE_NAMES[activeMode ?? entryMode]}
      </p>
      {empty && (
        <p className="hint" id="grid-help">
          Paste a puzzle to start
        </p>
      )}
      <Toasts toasts={toasts} placement={toastPlacement} onDismiss={dismissToast} />
      {/*
       * Mouse-only: out of the Tab order, and the mousedown handler above
       * keeps focus on the grid when it is clicked (display.md §2).
       */}
      <button
        type="button"
        className="color-scheme-toggle"
        tabIndex={-1}
        aria-label="Dark color scheme"
        aria-pressed={colorScheme === 'dark'}
        onClick={toggleColorScheme}
      >
        {/* A filled or empty dot shows the state by shape as well as color. */}
        <span className="color-scheme-toggle-mark" aria-hidden="true">
          {colorScheme === 'dark' ? '●' : '○'}
        </span>{' '}
        Dark
      </button>
    </main>
  );
}
