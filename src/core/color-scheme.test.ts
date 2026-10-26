// The color scheme as saved state (TASK-10, AC #3 and #5; display.md §2).
//
// The chosen color scheme is saved through the storage interface in
// src/core/store.ts. A Store is a set of JSON values by key: get returns
// undefined when nothing is saved, or when what is saved cannot be read.
// These tests use an in-memory Store, so they say nothing about the browser.
import { loadColorScheme, saveColorScheme, type ColorScheme } from './color-scheme';
import type { Store } from './store';

/** A Store kept in a Map, standing in for browser storage. */
function memoryStore(): Store & { saved: Map<string, unknown> } {
  const saved = new Map<string, unknown>();
  return {
    saved,
    get: (key) => saved.get(key),
    set: (key, value) => {
      saved.set(key, value);
    },
  };
}

/** A Store that returns the same value for every key, whatever was saved. */
function storeHolding(value: unknown): Store {
  return { get: () => value, set: () => {} };
}

describe('Color scheme: the app starts in the light color scheme (AC #3)', () => {
  it('with nothing saved, the color scheme is light', () => {
    expect(loadColorScheme(memoryStore())).toBe('light');
  });

  it.each([
    ['a misspelled scheme', 'Dark'],
    ['an unknown scheme', 'blue'],
    ['an empty string', ''],
    ['a number', 1],
    ['null', null],
    ['an object', { scheme: 'dark' }],
    ['a list', ['dark']],
  ])('with %s saved, the color scheme is light', (_, value) => {
    expect(loadColorScheme(storeHolding(value))).toBe('light');
  });
});

describe('Color scheme: the chosen color scheme is remembered, through the storage interface (AC #5)', () => {
  it.each<ColorScheme>(['light', 'dark'])('a saved %s color scheme loads back as %s', (scheme) => {
    const store = memoryStore();
    saveColorScheme(store, scheme);
    expect(loadColorScheme(store)).toBe(scheme);
  });

  it('saving writes to the Store, under one key', () => {
    const store = memoryStore();
    saveColorScheme(store, 'dark');
    expect(store.saved.size).toBe(1);
  });

  it('saving again replaces the earlier choice', () => {
    const store = memoryStore();
    saveColorScheme(store, 'dark');
    saveColorScheme(store, 'light');
    expect(loadColorScheme(store)).toBe('light');
    expect(store.saved.size).toBe(1);
  });

  it('the saved color scheme is a plain JSON value, so any Store can hold it', () => {
    const store = memoryStore();
    saveColorScheme(store, 'dark');
    const [value] = [...store.saved.values()];
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  });
});
