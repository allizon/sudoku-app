// The color scheme toggle (TASK-10, AC #3, #4, #5; display.md §2).
//
// App shows its color scheme as data-color-scheme="light" or "dark" on the
// root element (<html>), which App.css's scheme rules key on (no attribute
// counts as light). The toggle is a button whose accessible name mentions the
// color scheme (or light/dark). App reads and saves the scheme through a
// Store (src/core/store.ts) passed as its `store` prop; without one it uses
// browser storage.
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import puzzle1 from '../../fixtures/puzzles/puzzle-1.txt?raw';
import type { Store } from '../core/store';
import { App } from './App';

/** A Store kept in a Map; it survives an unmount, as browser storage survives a reload. */
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

/** The color scheme on screen. */
const scheme = () => document.documentElement.getAttribute('data-color-scheme') ?? 'light';

function renderApp(store?: Store) {
  const result = render(store === undefined ? <App /> : <App store={store} />);
  return { ...result, grid: screen.getByRole('grid') };
}

/** Closes the app and opens it again over the same storage, as a page reload does. */
function reload(unmount: () => void, store?: Store) {
  unmount();
  document.documentElement.removeAttribute('data-color-scheme');
  return renderApp(store);
}

/** The color scheme toggle: the one control naming the color scheme. */
function toggle(): HTMLElement {
  const controls = (['button', 'switch', 'checkbox'] as const).flatMap((role) =>
    screen.queryAllByRole(role, { name: /color scheme|dark|light/i }),
  );
  expect(controls).toHaveLength(1);
  return controls[0] as HTMLElement;
}

/** A mouse click, with the mousedown that comes before it. */
function click(element: HTMLElement) {
  fireEvent.mouseDown(element);
  fireEvent.mouseUp(element);
  fireEvent.click(element);
}

function paste(text: string) {
  fireEvent.paste(document.activeElement ?? document.body, {
    clipboardData: { types: ['text/plain'], getData: () => text },
  });
}

/** Pretends the system's light/dark setting is dark. */
function systemPrefersDark() {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        matches: /prefers-color-scheme:\s*dark/.test(query),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-color-scheme');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Color scheme: the app starts in the light color scheme, whatever the system setting (AC #3)', () => {
  it('with nothing saved, the app opens in the light color scheme', () => {
    renderApp(memoryStore());
    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'light');
  });

  it('with the system set to dark, the app still opens in the light color scheme', () => {
    systemPrefersDark();
    renderApp(memoryStore());
    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'light');
  });

  it('with an unreadable saved choice, the app opens in the light color scheme', () => {
    // A Store that answers every key with a value that is not a color scheme.
    renderApp({ get: () => 'purple', set: () => {} });
    expect(document.documentElement).toHaveAttribute('data-color-scheme', 'light');
  });
});

describe('Color scheme: a mouse-only toggle switches between light and dark (AC #4)', () => {
  it('the app shows one color scheme toggle', () => {
    renderApp(memoryStore());
    expect(toggle()).toBeInTheDocument();
  });

  it('the toggle is outside the grid', () => {
    const { grid } = renderApp(memoryStore());
    expect(grid).not.toContainElement(toggle());
  });

  it('clicking the toggle switches to the dark color scheme', () => {
    renderApp(memoryStore());
    click(toggle());
    expect(scheme()).toBe('dark');
  });

  it('clicking the toggle again switches back to the light color scheme', () => {
    renderApp(memoryStore());
    click(toggle());
    click(toggle());
    expect(scheme()).toBe('light');
  });

  it('clicking the toggle leaves keyboard focus on the grid, so keys and paste still reach it', () => {
    const { grid } = renderApp(memoryStore());
    click(toggle());
    expect(grid).toHaveFocus();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(within(grid).getAllByRole('gridcell')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('the toggle is not in the keyboard tab order', () => {
    renderApp(memoryStore());
    expect(toggle()).toHaveAttribute('tabindex', '-1');
  });

  it('switching color schemes leaves the Puzzle and the Selected cell as they were', () => {
    const { grid } = renderApp(memoryStore());
    paste(puzzle1);
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    const before = within(grid)
      .getAllByRole('gridcell')
      .map((cell) => [cell.getAttribute('aria-label'), cell.getAttribute('aria-selected')]);
    click(toggle());
    const after = within(grid)
      .getAllByRole('gridcell')
      .map((cell) => [cell.getAttribute('aria-label'), cell.getAttribute('aria-selected')]);
    expect(after).toEqual(before);
  });

  describe('no key switches the color scheme', () => {
    const letters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((l) => ({ key: l.toLowerCase(), code: `Key${l}` }));
    const digits = [...'0123456789'].map((d) => ({ key: d, code: `Digit${d}` }));
    const others = [
      { key: ' ', code: 'Space' },
      { key: 'Enter', code: 'Enter' },
      { key: 'Escape', code: 'Escape' },
      { key: 'Tab', code: 'Tab' },
      { key: 'Backspace', code: 'Backspace' },
      { key: 'Delete', code: 'Delete' },
      ...Array.from({ length: 12 }, (_, i) => ({ key: `F${i + 1}`, code: `F${i + 1}` })),
    ];
    const keys = [...letters, ...digits, ...others];
    const modifiers = [{}, { shiftKey: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }];

    function pressEverything(target: Element | Document) {
      for (const key of keys)
        for (const modifier of modifiers) {
          fireEvent.keyDown(target, { ...key, ...modifier });
          fireEvent.keyUp(target, { ...key, ...modifier });
        }
    }

    it('pressing any key, with or without modifiers, on the grid leaves the light color scheme on', () => {
      const { grid } = renderApp(memoryStore());
      expect(scheme()).toBe('light');
      toggle(); // the toggle exists, so there is something a key could wrongly reach
      pressEverything(grid);
      expect(scheme()).toBe('light');
    });

    it('pressing any key, with or without modifiers, on the grid leaves the dark color scheme on', () => {
      const { grid } = renderApp(memoryStore());
      click(toggle());
      pressEverything(grid);
      expect(scheme()).toBe('dark');
    });

    it('pressing any key on the page outside the grid leaves the color scheme as it was', () => {
      renderApp(memoryStore());
      toggle();
      pressEverything(document);
      pressEverything(document.body);
      expect(scheme()).toBe('light');
    });
  });
});

describe('Color scheme: the chosen color scheme is remembered across reloads (AC #5)', () => {
  it('after choosing dark and reloading, the app opens in the dark color scheme', () => {
    const store = memoryStore();
    const { unmount } = renderApp(store);
    click(toggle());
    reload(unmount, store);
    expect(scheme()).toBe('dark');
  });

  it('after choosing dark, then light, and reloading, the app opens in the light color scheme', () => {
    const store = memoryStore();
    const { unmount } = renderApp(store);
    click(toggle());
    click(toggle());
    reload(unmount, store);
    expect(scheme()).toBe('light');
  });

  it('the choice is saved through the storage interface, not straight to browser storage', () => {
    const store = memoryStore();
    const { unmount } = renderApp(store);
    click(toggle());
    expect(store.saved.size).toBeGreaterThan(0);
    // Nothing else survives: what browser storage holds is gone, the Store's contents are not.
    localStorage.clear();
    reload(unmount, store);
    expect(scheme()).toBe('dark');
  });

  it('with the system set to dark, a saved light color scheme still opens light', () => {
    const store = memoryStore();
    const { unmount } = renderApp(store);
    click(toggle());
    click(toggle());
    systemPrefersDark();
    reload(unmount, store);
    expect(scheme()).toBe('light');
  });

  it('with no store given, the app remembers the color scheme in browser storage across a reload', () => {
    const { unmount } = renderApp();
    click(toggle());
    reload(unmount);
    expect(scheme()).toBe('dark');
  });
});
