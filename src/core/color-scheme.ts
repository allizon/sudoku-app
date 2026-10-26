import type { Store } from './store';

/** The app's two color schemes (display.md §2). */
export type ColorScheme = 'light' | 'dark';

const KEY = 'color-scheme';

/** The saved color scheme; light when nothing readable is saved (display.md §2). */
export function loadColorScheme(store: Store): ColorScheme {
  const saved = store.get(KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

/** Saves the chosen color scheme, replacing any earlier choice. */
export function saveColorScheme(store: Store, scheme: ColorScheme): void {
  store.set(KEY, scheme);
}
