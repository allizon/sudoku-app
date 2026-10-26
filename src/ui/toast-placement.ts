import { useLayoutEffect, useState, type RefObject } from 'react';

/** Where the toast stack sits: beside the grid (top-right), or below it. */
export type ToastPlacement = 'beside' | 'below';

/**
 * The room the stack needs on each side of the centered grid, in rem: its
 * narrowest width (12rem), 1rem from the window edge and 1rem from the grid.
 * App.css's .toasts max-width uses the same numbers.
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
 * and again whenever the window is resized (the grid's size follows the
 * window's; display.md §1).
 */
export function useToastPlacement(gridRef: RefObject<HTMLElement | null>): ToastPlacement | undefined {
  const [placement, setPlacement] = useState<ToastPlacement>();

  useLayoutEffect(() => {
    function measure() {
      const grid = gridRef.current;
      if (grid === null) return;
      setPlacement(toastPlacement(window.innerWidth, grid.getBoundingClientRect().width, rootFontSize()));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [gridRef]);

  return placement;
}
