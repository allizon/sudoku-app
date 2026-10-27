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
