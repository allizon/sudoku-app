// Browser storage: the Store implementation backed by the browser's
// localStorage (TASK-10, AC #5; AGENTS.md "Stack and architecture").
//
// It lives outside src/core/ because it touches the browser. Values go in as
// JSON; anything missing, unreadable, or blocked by the browser reads as
// undefined, and a save the browser refuses is dropped without an error, so
// a storage failure never stops the app.
import { createBrowserStore } from './browser-store';

/** A Web Storage stand-in whose methods can be made to misbehave. */
function fakeWebStorage(overrides: Partial<Pick<Storage, 'getItem' | 'setItem'>> = {}) {
  const items = new Map<string, string>();
  return {
    items,
    getItem: overrides.getItem ?? ((key: string) => items.get(key) ?? null),
    setItem:
      overrides.setItem ??
      ((key: string, value: string) => {
        items.set(key, value);
      }),
    removeItem: (key: string) => {
      items.delete(key);
    },
    clear: () => items.clear(),
    key: (index: number) => [...items.keys()][index] ?? null,
    get length() {
      return items.size;
    },
  } satisfies Storage;
}

beforeEach(() => {
  localStorage.clear();
});

describe('Browser storage: saving and reading values', () => {
  it('a key never saved reads as undefined', () => {
    expect(createBrowserStore().get('color-scheme')).toBeUndefined();
  });

  it.each([
    ['a string', 'dark'],
    ['a number', 42],
    ['a boolean', true],
    ['null', null],
    ['an object', { cells: [[1, 2], [3]], selected: { row: 0, column: 0 } }],
    ['a list', ['a', 'b']],
  ])('%s saved under a key reads back equal', (_, value) => {
    const store = createBrowserStore();
    store.set('some-key', value);
    expect(store.get('some-key')).toEqual(value);
  });

  it('values saved under different keys are kept apart', () => {
    const store = createBrowserStore();
    store.set('first', 'one');
    store.set('second', 'two');
    expect(store.get('first')).toBe('one');
    expect(store.get('second')).toBe('two');
  });

  it('saving under a key again replaces the earlier value', () => {
    const store = createBrowserStore();
    store.set('key', 'old');
    store.set('key', 'new');
    expect(store.get('key')).toBe('new');
  });

  it('a value saved survives a reload: a new store over the same browser storage reads it', () => {
    createBrowserStore().set('color-scheme', 'dark');
    expect(createBrowserStore().get('color-scheme')).toBe('dark');
  });

  it('by default it saves to the browser’s localStorage', () => {
    createBrowserStore().set('color-scheme', 'dark');
    expect(localStorage.length).toBeGreaterThan(0);
  });

  it('it leaves other sites’ and other apps’ entries in localStorage alone', () => {
    localStorage.setItem('someone-else', 'keep me');
    const store = createBrowserStore();
    store.set('someone-else', 'mine');
    expect(localStorage.getItem('someone-else')).toBe('keep me');
    expect(store.get('someone-else')).toBe('mine');
  });
});

describe('Browser storage: missing, corrupt, or blocked storage', () => {
  it('a saved entry that is not valid JSON reads as undefined', () => {
    const storage = fakeWebStorage({ getItem: () => '{not json' });
    expect(createBrowserStore(storage).get('color-scheme')).toBeUndefined();
  });

  it('when the browser refuses to read storage, every key reads as undefined', () => {
    const storage = fakeWebStorage({
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
    expect(createBrowserStore(storage).get('color-scheme')).toBeUndefined();
  });

  it('when the browser refuses to save (storage full or blocked), saving does not throw', () => {
    const storage = fakeWebStorage({
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    });
    expect(() => createBrowserStore(storage).set('color-scheme', 'dark')).not.toThrow();
  });

  it('it reads and writes the Web Storage it is given, not localStorage', () => {
    const storage = fakeWebStorage();
    const store = createBrowserStore(storage);
    store.set('color-scheme', 'dark');
    expect(storage.items.size).toBe(1);
    expect(localStorage.length).toBe(0);
    expect(createBrowserStore(storage).get('color-scheme')).toBe('dark');
  });
});
