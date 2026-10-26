import { useLayoutEffect, useState, type RefObject } from 'react';

/** Where the toast stack sits: beside the grid (top-right), or below it. */
export type ToastPlacement = 'beside' | 'below';

/**
 * The room the stack needs on each side of the centered grid, in rem: its
 * narrowest width (12rem), 1rem from the window edge and 1rem from the grid.
 * App.css's beside rule uses the same numbers (display-review.test.ts checks).
 */
export const ROOM_BESIDE_REM = 14;

/**
 * Toasts go beside the grid when there is room for them there, and below it
 * otherwise, so they never cover it (milestones.md M0). Widths are in CSS
 * pixels; remPx is the root font size.
 */
export function toastPlacement(windowWidth: number, gridWidth: number, remPx: number): ToastPlacement {
  return (windowWidth - gridWidth) / 2 >= ROOM_BESIDE_REM * remPx ? 'beside' : 'below';
}

/** The root font size in pixels, 16 when the browser does not report one. */
function rootFontSize(): number {
  const size = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : 16;
}

/**
 * The toast placement for the grid as drawn, measured before the first paint
 * and again whenever the window or the grid changes size (the grid's size
 * follows the window and the root font size; display.md §1). Until measured
 * it is "below", which never covers the grid.
 */
export function useToastPlacement(gridRef: RefObject<HTMLElement | null>): ToastPlacement {
  const [placement, setPlacement] = useState<ToastPlacement>('below');

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (grid === null) return;
    function measure() {
      if (grid === null) return;
      setPlacement(toastPlacement(window.innerWidth, grid.getBoundingClientRect().width, rootFontSize()));
    }
    measure();
    // The window can widen with the grid at its 1000px cap, so the grid alone
    // is not enough to watch. ResizeObserver is missing in some test DOMs.
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(grid);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [gridRef]);

  return placement;
}
