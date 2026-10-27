// @vitest-environment node
// How Center marks and Corner marks are laid out in a cell, as written in App.css
// (TASK-6 review round 1, CR-2 and CR-5; keymap.md §2; AC #7).
// jsdom does not apply App.css, so these tests read the rules and resolve their tokens.
import {
  colorLiteralsIn,
  evaluateLength,
  parseCss,
  propertyOf,
  readAppCss,
  resolveVars,
  schemeTokens,
  type Viewport,
} from './test-support/app-css';

const rules = parseCss(readAppCss());
const tokens = schemeTokens(rules, 'light');

/** A property on a selector (outside at-rules), failing when App.css does not set it. */
function need(selector: string, property: string): string {
  const value = propertyOf(rules, selector, property);
  if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
  return value;
}

/** Window sizes from a small phone to a 4K monitor, so cells range from about 30px to 110px. */
const WINDOWS: Viewport[] = [
  { width: 320, height: 480 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
];

const length = (value: string, viewport: Viewport) => evaluateLength(resolveVars(value, tokens), viewport);

/** Splits a value on top-level commas or whitespace, leaving anything inside parentheses whole. */
function splitTopLevel(value: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && separator.test(ch)) {
      if (current.trim() !== '') parts.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim() !== '') parts.push(current.trim());
  return parts;
}

/** How far the Selected cell's inset ring and halo reach into the cell: the largest inset spread. */
function selectedRingReach(viewport: Viewport): number {
  const shadows = splitTopLevel(need(".cell[aria-selected='true']", 'box-shadow'), /,/);
  const spreads = shadows.map((shadow) => {
    const lengths = splitTopLevel(shadow, /\s/).filter(
      (part) => part !== 'inset' && colorLiteralsIn(resolveVars(part, schemeTokens(rules, 'light'))).length === 0,
    );
    const spread = lengths[3];
    if (spread === undefined) throw new Error(`no spread in box-shadow "${shadow}"`);
    return length(spread, viewport);
  });
  return Math.max(...spreads);
}

describe('Candidates layout: Corner marks sit against the cell edges, Center marks in the middle (AC #7)', () => {
  it('a cell is a positioning container, so its Corner marks are placed against its own edges', () => {
    expect(need('.cell', 'position')).toBe('relative');
  });

  it('.corner-marks cover the cell (absolutely positioned, inset on every side)', () => {
    expect(need('.cell .corner-marks', 'position')).toBe('absolute');
    expect(propertyOf(rules, '.cell .corner-marks', 'inset')).toBeDefined();
  });

  it('each Corner mark is absolutely positioned', () => {
    expect(need('.corner-mark', 'position')).toBe('absolute');
  });

  it.each([
    [1, 'top', 'left'],
    [2, 'top', 'right'],
    [3, 'bottom', 'left'],
    [4, 'bottom', 'right'],
  ] as const)('Corner mark %i goes in the %s %s corner', (n, vertical, horizontal) => {
    const selector = `.corner-mark:nth-child(${n})`;
    expect(need(selector, vertical)).toBe('0');
    expect(need(selector, horizontal)).toBe('0');
  });

  it.each([5, 6, 7, 8, 9])('Corner mark %i has a place of its own on an edge', (n) => {
    const selector = `.corner-mark:nth-child(${n})`;
    const vertical = propertyOf(rules, selector, 'top') ?? propertyOf(rules, selector, 'bottom');
    const horizontal = propertyOf(rules, selector, 'left') ?? propertyOf(rules, selector, 'right');
    expect(vertical, `${selector} top/bottom`).toBeDefined();
    expect(horizontal, `${selector} left/right`).toBeDefined();
    expect([vertical, horizontal]).toContain('0');
  });

  it('.center-marks are not absolutely positioned: the cell centers them', () => {
    expect(propertyOf(rules, '.cell .center-marks', 'position') ?? 'static').not.toBe('absolute');
    expect(need('.cell', 'display')).toBe('flex');
    expect(need('.cell', 'align-items')).toBe('center');
    expect(need('.cell', 'justify-content')).toBe('center');
    expect(need('.cell .center-marks', 'text-align')).toBe('center');
  });

  it.each(WINDOWS)('on a $width×$height window, Corner marks are drawn smaller than Center marks', (viewport) => {
    const center = length(need('.cell .center-marks', 'font-size'), viewport);
    const corner = length(need('.cell .corner-marks', 'font-size'), viewport);
    expect(corner).toBeLessThan(center);
  });
});

describe('Candidates layout: Corner marks stay clear of the Selected cell ring (CR-5)', () => {
  it.each(WINDOWS)('on a $width×$height window, the Corner marks inset is past the ring and halo', (viewport) => {
    const inset = length(need('.cell .corner-marks', 'inset'), viewport);
    expect(inset).toBeGreaterThan(selectedRingReach(viewport));
  });
});

/*
 * Where each Corner mark lands, modelled from App.css: the .corner-marks box
 * (the cell less its inset on each side), each .corner-mark:nth-child(n) placed
 * by top/bottom/left/right (0 or a percentage of the box) and nudged by
 * translate (a percentage of its own size). A digit's box is assumed to be
 * 0.6em wide (system-ui digits are about 0.55–0.6em) and one line-height tall.
 */
const DIGIT_WIDTH_EM = 0.6;

type Box = { left: number; top: number; right: number; bottom: number };

function cornerMarkBoxes(viewport: Viewport): Box[] {
  const cell = length('var(--cell-size)', viewport);
  const inset = length(need('.cell .corner-marks', 'inset'), viewport);
  const size = cell - 2 * inset;
  const font = length(need('.cell .corner-marks', 'font-size'), viewport);
  const width = DIGIT_WIDTH_EM * font;
  const height = Number(need('.cell .corner-marks', 'line-height')) * font;
  /** A position offset: "0", a percentage of the box, or a length. */
  const offset = (value: string) => (value.endsWith('%') ? (parseFloat(value) / 100) * size : length(value, viewport));
  /** A translate part: "0" or a percentage of the mark's own size. */
  const shift = (value: string | undefined, own: number) =>
    value === undefined || value === '0' ? 0 : value.endsWith('%') ? (parseFloat(value) / 100) * own : length(value, viewport);
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
    const selector = `.corner-mark:nth-child(${n})`;
    const at = (property: string) => propertyOf(rules, selector, property);
    const [tx, ty] = (at('translate') ?? '0 0').split(/\s+/);
    const left = at('left');
    const right = at('right');
    const top = at('top');
    const bottom = at('bottom');
    if ((left ?? right) === undefined || (top ?? bottom) === undefined) throw new Error(`${selector} is not placed`);
    const x = (left !== undefined ? offset(left) : size - offset(right ?? '0') - width) + shift(tx, width);
    const y = (top !== undefined ? offset(top) : size - offset(bottom ?? '0') - height) + shift(ty, height);
    return { left: x, top: y, right: x + width, bottom: y + height };
  });
}

const overlap = (a: Box, b: Box) => a.left < b.right - 0.01 && b.left < a.right - 0.01 && a.top < b.bottom - 0.01 && b.top < a.bottom - 0.01;

/** Small cells too: the narrowest windows give cells of about 25–30px. */
const SMALL_AND_LARGE: Viewport[] = [{ width: 280, height: 480 }, ...WINDOWS];

describe('Candidates layout: no two Corner marks overlap, at any cell size (R2-3)', () => {
  it.each(SMALL_AND_LARGE)('on a $width×$height window, all nine Corner marks stay apart', (viewport) => {
    const boxes = cornerMarkBoxes(viewport);
    for (let a = 0; a < boxes.length; a += 1)
      for (let b = a + 1; b < boxes.length; b += 1)
        expect(overlap(boxes[a] as Box, boxes[b] as Box), `Corner marks ${a + 1} and ${b + 1}`).toBe(false);
  });

  it.each(SMALL_AND_LARGE)('on a $width×$height window, every Corner mark stays inside the .corner-marks box', (viewport) => {
    const cell = length('var(--cell-size)', viewport);
    const size = cell - 2 * length(need('.cell .corner-marks', 'inset'), viewport);
    for (const [i, box] of cornerMarkBoxes(viewport).entries()) {
      expect(box.left, `Corner mark ${i + 1} left`).toBeGreaterThanOrEqual(-0.01);
      expect(box.top, `Corner mark ${i + 1} top`).toBeGreaterThanOrEqual(-0.01);
      expect(box.right, `Corner mark ${i + 1} right`).toBeLessThanOrEqual(size + 0.01);
      expect(box.bottom, `Corner mark ${i + 1} bottom`).toBeLessThanOrEqual(size + 0.01);
    }
  });
});
