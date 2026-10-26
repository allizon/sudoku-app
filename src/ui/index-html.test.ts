// The script in index.html that draws the page in the saved color scheme
// before the app loads (display.md §2; AGENTS.md "Stack and architecture",
// the one exception to reading saved state through Store). It must read the
// same key and format the browser store writes.
import { readFileSync } from 'node:fs';
import { saveColorScheme } from '../core/color-scheme';
import { createBrowserStore } from '../storage/browser-store';

const html = readFileSync(`${import.meta.dirname}/../../index.html`, 'utf8');

/** The inline script (the one without a src). */
const inlineScript = (() => {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1) throw new Error(`index.html should have one inline script, found ${scripts.length}`);
  return scripts[0]?.[1] ?? '';
})();

/** A Web Storage stand-in. */
function webStorage(items: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(items));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
}

/** Runs the script with `window.localStorage` replaced; returns the scheme it set. */
function runScript(localStorage: () => Storage): string | null {
  root.removeAttribute('data-color-scheme');
  const fakeWindow = {
    get localStorage() {
      return localStorage();
    },
  };
  new Function('window', inlineScript)(fakeWindow);
  return root.getAttribute('data-color-scheme');
}

const root = document.documentElement;

afterEach(() => {
  root.removeAttribute('data-color-scheme');
  root.style.removeProperty('color-scheme');
});

describe('index.html: the page starts in the saved color scheme, before the app loads', () => {
  it('a saved dark color scheme starts the page dark', () => {
    expect(runScript(() => webStorage({ 'sudoku:color-scheme': '"dark"' }))).toBe('dark');
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('a saved light color scheme starts the page light', () => {
    expect(runScript(() => webStorage({ 'sudoku:color-scheme': '"light"' }))).toBe('light');
  });

  it.each([
    ['nothing saved', {}],
    ['a value that is not JSON', { 'sudoku:color-scheme': 'dark' }],
    ['garbage', { 'sudoku:color-scheme': '{not json' }],
    ['another value', { 'sudoku:color-scheme': '"Dark"' }],
    ['a list', { 'sudoku:color-scheme': '["dark"]' }],
  ])('with %s, the page starts light', (_, items: Record<string, string>) => {
    expect(runScript(() => webStorage(items))).toBe('light');
  });

  it('when the browser blocks storage, the page starts light', () => {
    expect(
      runScript(() => {
        throw new DOMException('blocked', 'SecurityError');
      }),
    ).toBe('light');
  });

  it('when reading storage throws, the page starts light', () => {
    const storage = webStorage();
    storage.getItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    expect(runScript(() => storage)).toBe('light');
  });

  it.each(['light', 'dark'] as const)('reads %s as saved through the browser store and saveColorScheme', (scheme) => {
    const storage = webStorage();
    saveColorScheme(createBrowserStore(storage), scheme);
    expect(runScript(() => storage)).toBe(scheme);
  });
});
