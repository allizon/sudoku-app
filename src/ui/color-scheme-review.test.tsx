// Review round 1 for TASK-10 (display.md §2; milestones.md M0): the color
// scheme toggle hands focus back to the grid, shows its state by more than
// color, and App tidies the root element when it closes; the toast stack's
// placement follows the measured room beside the grid.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Store } from '../core/store';
import { App } from './App';

function memoryStore(): Store {
  const saved = new Map<string, unknown>();
  return { get: (key) => saved.get(key), set: (key, value) => void saved.set(key, value) };
}

function renderApp() {
  const result = render(<App store={memoryStore()} />);
  return { ...result, grid: screen.getByRole('grid') };
}

const toggle = () => screen.getByRole('button', { name: 'Dark color scheme' });
const root = document.documentElement;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Color scheme toggle: focus, state, and tidying up', () => {
  it('clicking the toggle after the grid lost focus puts focus back on the grid', () => {
    const { grid } = renderApp();
    act(() => grid.blur());
    expect(grid).not.toHaveFocus();
    fireEvent.click(toggle());
    expect(grid).toHaveFocus();
  });

  it('the toggle shows whether the dark color scheme is on by a mark, not only by color', () => {
    renderApp();
    const off = toggle().textContent;
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(toggle().textContent).not.toBe(off);
    expect(toggle()).toHaveTextContent('Dark');
  });

  it('the browser is told the color scheme too, so its own parts (scrollbars) match', () => {
    renderApp();
    expect(root.style.getPropertyValue('color-scheme')).toBe('light');
    fireEvent.click(toggle());
    expect(root.style.getPropertyValue('color-scheme')).toBe('dark');
  });

  it('closing the app removes the color scheme from the root element', () => {
    const { unmount } = renderApp();
    fireEvent.click(toggle());
    unmount();
    expect(root).not.toHaveAttribute('data-color-scheme');
    expect(root.style.getPropertyValue('color-scheme')).toBe('');
  });
});

describe('Toast placement: App measures the room beside the grid', () => {
  function measureAs(windowWidth: number, gridWidth: number) {
    vi.stubGlobal('innerWidth', windowWidth);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, gridWidth, gridWidth));
  }
  const stack = () => screen.getByRole('alert');

  it('with room beside the grid (1440px window, 804px grid), the toasts go beside it', () => {
    measureAs(1440, 804);
    renderApp();
    expect(stack()).toHaveAttribute('data-placement', 'beside');
  });

  it('without room beside the grid (375px window, 343px grid), the toasts go below it', () => {
    measureAs(375, 343);
    renderApp();
    expect(stack()).toHaveAttribute('data-placement', 'below');
  });

  it('the grid changing size without a window resize (a new root font size) measures again', () => {
    type Observed = { callback: ResizeObserverCallback; observer: ResizeObserver; target?: Element };
    const observed: Observed[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class implements ResizeObserver {
        private readonly entry: Observed;
        constructor(callback: ResizeObserverCallback) {
          this.entry = { callback, observer: this };
          observed.push(this.entry);
        }
        observe(target: Element) {
          this.entry.target = target;
        }
        unobserve() {}
        disconnect() {}
      },
    );
    measureAs(1440, 804);
    const { grid } = renderApp();
    expect(stack()).toHaveAttribute('data-placement', 'beside');
    expect(observed.map((o) => o.target)).toContain(grid);
    measureAs(1440, 1000);
    act(() => {
      for (const { callback, observer } of observed) callback([], observer);
    });
    expect(stack()).toHaveAttribute('data-placement', 'below');
  });

  it('resizing the window measures again', () => {
    measureAs(1440, 804);
    renderApp();
    measureAs(800, 604);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(stack()).toHaveAttribute('data-placement', 'below');
  });
});
