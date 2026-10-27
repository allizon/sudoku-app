// @vitest-environment node
// Grid size (TASK-10, AC #1 and #2; display.md §1): the grid is as large as
// the window allows, up to 1000px wide, and the whole grid fits in the window
// without scrolling.
//
// jsdom does no layout, so these tests compute the grid's size from App.css
// itself (see test-support/app-css.ts): nine square cells across plus six
// thin lines and four box lines, inside the page padding, with the line of
// text under the grid below it. That the browser draws it this way, and that
// nothing else on the page (such as the color scheme toggle) pushes the grid
// off screen, needs a check in a real browser.
import { gridLayout, readAppCss, type Viewport } from './test-support/app-css';

const css = readAppCss();
const layout = (width: number, height: number) => gridLayout(css, { width, height });

/** Window sizes from a small phone to a 4K monitor, in CSS pixels. */
const WINDOWS: Viewport[] = [
  { width: 320, height: 480 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
  // Wide and short, and tall and narrow.
  { width: 1920, height: 500 },
  { width: 500, height: 1600 },
];

const label = ({ width, height }: Viewport) => `${width}×${height}`;

/**
 * Allowed shortfall from "as large as the window allows": room the layout may keep below the grid.
 * Lowered from 48 when belowGrid grew by the Entry mode line (24px), so the overall limit stays 84px.
 */
const ROOM_BELOW_GRID_ALLOWANCE = 24;

describe('Grid size: the grid grows with the window up to 1000px wide (AC #1)', () => {
  it.each([
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
  ])('on a $width×$height window the grid is 1000px wide', ({ width, height }) => {
    expect(layout(width, height).gridWidth).toBeCloseTo(1000, 0);
  });

  it('the grid is never wider than 1000px, at any window size', () => {
    for (let width = 300; width <= 4000; width += 50)
      for (const height of [400, 800, 1200, 2400])
        expect(layout(width, height).gridWidth, `${width}×${height}`).toBeLessThanOrEqual(1000.5);
  });

  it('the grid grows as the window grows, until it reaches 1000px', () => {
    let previous = 0;
    for (let width = 400; width <= 3200; width += 100) {
      const height = Math.round(width * 0.6);
      const { gridWidth } = layout(width, height);
      if (previous < 999.5) expect(gridWidth, `${width}×${height}`).toBeGreaterThan(previous);
      else expect(gridWidth, `${width}×${height}`).toBeCloseTo(previous, 1);
      previous = gridWidth;
    }
  });

  it.each(WINDOWS)('on a $width×$height window the grid is as large as the window allows', (window) => {
    const { gridWidth, padding, belowGrid } = layout(window.width, window.height);
    const roomAcross = window.width - 2 * padding;
    const roomDown = window.height - 2 * padding - belowGrid;
    const largest = Math.min(1000, roomAcross, roomDown);
    expect(gridWidth, label(window)).toBeGreaterThanOrEqual(largest - ROOM_BELOW_GRID_ALLOWANCE);
  });

  it('on a 1920×1080 window the grid is larger than the old 58px-cell cap of 540px', () => {
    expect(layout(1920, 1080).gridWidth).toBeGreaterThan(540);
  });
});

describe('Grid size: the whole grid fits in the window without scrolling (AC #2)', () => {
  it('every cell is square, so the grid is as tall as it is wide', () => {
    for (const window of WINDOWS) {
      const { gridWidth, gridHeight } = layout(window.width, window.height);
      expect(gridHeight, label(window)).toBeCloseTo(gridWidth, 3);
    }
  });

  it.each(WINDOWS)('on a $width×$height window the grid fits across, inside the page padding', (window) => {
    const { gridWidth, padding } = layout(window.width, window.height);
    expect(gridWidth + 2 * padding, label(window)).toBeLessThanOrEqual(window.width + 0.5);
  });

  it.each(WINDOWS)(
    'on a $width×$height window the grid and the line of text under it fit down, inside the page padding',
    (window) => {
      const { gridHeight, padding, belowGrid } = layout(window.width, window.height);
      expect(gridHeight + 2 * padding + belowGrid, label(window)).toBeLessThanOrEqual(window.height + 0.5);
    },
  );
});

// With a Puzzle loaded the hint is gone and only the Entry mode line is left, which is less
// than this, so the empty grid is the case to check.
describe('Grid size: the Entry mode line (and the hint, while shown) fit in the room kept under the grid (display.md §1)', () => {
  it.each(WINDOWS)('on a $width×$height window, under an empty grid, the Entry mode line and the hint fit in --below-grid', (window) => {
    const { belowGrid, belowGridRoom } = layout(window.width, window.height);
    expect(belowGrid, label(window)).toBeLessThanOrEqual(belowGridRoom + 0.5);
  });
});
