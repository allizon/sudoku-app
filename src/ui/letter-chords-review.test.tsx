// Letter chords, review round 1 (TASK-7; keymap.md §3 rules 4 and 7): letting go of Cmd ends every held
// chord, a chord letter's release is heard wherever focus is in the page and whatever modifiers are down,
// and the page-wide listeners go away with the app.
//
// Same page assumptions as letter-chords.test.tsx: the Entry mode line is the element with class
// "entry-mode-line" carrying data-entry-mode, and a cell's accessible name lists what it holds.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Store } from '../core/store';
import { App } from './App';

type KeyInit = { code?: string; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; repeat?: boolean };

function memoryStore(): Store {
  const saved = new Map<string, unknown>();
  return { get: (key) => saved.get(key), set: (key, value) => void saved.set(key, value) };
}

function renderApp() {
  const rendered = render(<App store={memoryStore()} />);
  return { grid: screen.getByRole('grid'), unmount: rendered.unmount };
}

/** The cell at a 0-based row and column. */
function cellAt(grid: HTMLElement, row: number, column: number): HTMLElement {
  const cell = within(grid).getAllByRole('row')[row]?.querySelectorAll<HTMLElement>('[role="gridcell"]')[column];
  if (cell === undefined) throw new Error(`no cell at ${row}, ${column}`);
  return cell;
}

const press = (key: string, init: KeyInit = {}) => fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });
const release = (key: string, init: KeyInit = {}) => fireEvent.keyUp(document.activeElement ?? document.body, { key, ...init });

const holdC = (init: KeyInit = {}) => press('c', { code: 'KeyC', ...init });
const releaseC = (init: KeyInit = {}) => release('c', { code: 'KeyC', ...init });
const holdS = () => press('s', { code: 'KeyS' });
const pressDigit = (digit: number) => press(String(digit), { code: `Digit${digit}` });

/** Cmd goes down while a chord letter is held, then comes up; on macOS no keyup arrives for the letter. */
function pressAndReleaseCmd(code: 'MetaLeft' | 'MetaRight' = 'MetaLeft') {
  press('Meta', { code, metaKey: true });
  release('Meta', { code });
}

function expectEntryMode(mode: 'fill' | 'center' | 'corner') {
  const lines = document.querySelectorAll<HTMLElement>('.entry-mode-line');
  expect(lines).toHaveLength(1);
  expect(lines[0]).toHaveAttribute('data-entry-mode', mode);
}

afterEach(cleanup);

describe('Letter chords: letting go of Cmd ends every held chord (keymap.md §3 rule 7)', () => {
  it.each(['MetaLeft', 'MetaRight'] as const)('holding C, letting go of Cmd (%s) reverts the line and the next digit uses the Sticky mode', (code) => {
    const { grid } = renderApp();
    holdC();
    expectEntryMode('center');
    pressAndReleaseCmd(code);
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('holding C and S, letting go of Cmd ends both chords', () => {
    const { grid } = renderApp();
    holdC();
    holdS();
    pressAndReleaseCmd();
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });

  it('after letting go of Cmd, a fresh press of C starts a chord again', () => {
    const { grid } = renderApp();
    holdC();
    pressAndReleaseCmd();
    expectEntryMode('fill');
    holdC();
    expectEntryMode('center');
    pressDigit(5);
    releaseC();
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, center marks 5');
  });

  it('after letting go of Cmd, auto-repeat from a C still held does not restart the chord', () => {
    const { grid } = renderApp();
    holdC();
    pressAndReleaseCmd();
    holdC({ repeat: true });
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Letter chords: the release is heard wherever focus is in the page (keymap.md §3 rule 7)', () => {
  it('holding C, moving focus off the grid and releasing C there ends the chord', () => {
    const { grid } = renderApp();
    holdC();
    expectEntryMode('center');
    grid.blur(); // focus moves to the page body; the window keeps focus
    expect(document.activeElement).toBe(document.body);
    fireEvent.keyUp(document.body, { key: 'c', code: 'KeyC' });
    expectEntryMode('fill');
    grid.focus();
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Letter chords: releasing the letter ends the chord whatever modifiers are held (keymap.md §3 rule 7)', () => {
  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Alt', { altKey: true }],
    ['Cmd', { metaKey: true }],
  ] as const)('releasing C with %s held ends the chord', (_name, modifier) => {
    const { grid } = renderApp();
    holdC();
    expectEntryMode('center');
    releaseC(modifier);
    expectEntryMode('fill');
    pressDigit(5);
    expect(cellAt(grid, 0, 0)).toHaveAccessibleName('Row 1, column 1, placed 5');
  });
});

describe('Letter chords: the page-wide listeners are removed with the app', () => {
  it('every keyup and blur listener added to window is removed on unmount', () => {
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    try {
      const { unmount } = renderApp();
      const ours = added.mock.calls.filter(([type]) => type === 'keyup' || type === 'blur');
      expect(ours.map(([type]) => type).sort()).toEqual(['blur', 'keyup']);
      unmount();
      for (const [type, listener] of ours)
        expect(removed.mock.calls.some(([t, l]) => t === type && l === listener), `${type} listener removed`).toBe(true);
    } finally {
      added.mockRestore();
      removed.mockRestore();
    }
  });
});
