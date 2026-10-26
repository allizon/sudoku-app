import type { Store } from '../core/store';

/** Keeps the app's entries apart from anything else in the same storage. */
const PREFIX = 'sudoku:';

/**
 * A Store backed by Web Storage (by default the browser's localStorage),
 * holding each value as JSON under a "sudoku:" key. Missing, unreadable, or
 * blocked storage reads as undefined, and a refused save is dropped, so a
 * storage failure never stops the app.
 */
export function createBrowserStore(storage?: Storage): Store {
  // Reaching window.localStorage can itself throw when storage is blocked.
  const webStorage = (): Storage => storage ?? window.localStorage;
  return {
    get(key) {
      try {
        const raw = webStorage().getItem(PREFIX + key);
        if (raw === null) return undefined;
        const value: unknown = JSON.parse(raw);
        return value;
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        webStorage().setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: the value is not saved.
      }
    },
  };
}
