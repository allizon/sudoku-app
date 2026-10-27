// @vitest-environment node
// How the Entry mode line and Candidates look, as written in App.css (TASK-6, AC #3, #7;
// keymap.md §2; display.md §2).
//
// Assumed selectors (see entry-mode.test.tsx for the markup):
// - .entry-mode-line[data-entry-mode='fill' | 'center' | 'corner'] sets the line's color for each mode.
// - a rule ending in .center-marks / .corner-marks styles a cell's Center marks / Corner marks
//   (e.g. ".center-marks" or ".cell .center-marks"); each sets color and font-size.
// jsdom does not apply App.css, so colors are resolved from the token values in each color scheme.
import {
  colorLiteralsIn,
  contrastRatio,
  evaluateLength,
  onlyColorIn,
  parseColor,
  parseCss,
  propertyOf,
  readAppCss,
  resolveVars,
  schemeTokens,
  type CssRule,
} from './test-support/app-css';

const css = readAppCss();
const rules = parseCss(css);
const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];

/** The last value of a property among top-level rules whose selector (or one of its comma parts) matches. */
function valueWhere(matches: (selector: string) => boolean, property: string): string | undefined {
  let found: string | undefined;
  for (const rule of rules as CssRule[]) {
    if (rule.context.length > 0) continue;
    if (!rule.selector.split(',').some((part) => matches(part.trim()))) continue;
    for (const d of rule.declarations) if (d.property === property) found = d.value;
  }
  return found;
}

const modeSelector = (mode: string) => (selector: string) =>
  new RegExp(`^\\.entry-mode-line\\[data-entry-mode=(['"]?)${mode}\\1\\]$`).test(selector);
const endsWithClass = (name: string) => (selector: string) => new RegExp(`\\.${name}$`).test(selector);

function resolvedColor(value: string | undefined, what: string, scheme: Scheme): string {
  if (value === undefined) throw new Error(`App.css sets no color for ${what}`);
  return onlyColorIn(resolveVars(value, schemeTokens(rules, scheme)));
}

const lineColor = (mode: string, scheme: Scheme) =>
  resolvedColor(valueWhere(modeSelector(mode), 'color'), `the Entry mode line in ${mode} mode`, scheme);

const marksColor = (name: 'center-marks' | 'corner-marks', scheme: Scheme) =>
  resolvedColor(valueWhere(endsWithClass(name), 'color'), `.${name}`, scheme);

const pageBackground = (scheme: Scheme) =>
  resolvedColor(propertyOf(rules, ':root', 'background') ?? propertyOf(rules, ':root', 'background-color'), 'the page', scheme);

const cellBackground = (scheme: Scheme) =>
  resolvedColor(propertyOf(rules, '.grid', 'background') ?? propertyOf(rules, '.grid', 'background-color'), 'the grid', scheme);

/** Hue in degrees (0–360) and saturation (0–1, HSL) of an opaque color. */
function hueAndSaturation(literal: string): { hue: number; saturation: number } {
  const { r, g, b } = parseColor(literal);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
    else hue = 60 * ((rn - gn) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation };
}

describe('Entry mode line: gray for fill, blue for center, green for corner, in both color schemes (AC #3)', () => {
  it.each(SCHEMES)('in the %s color scheme, fill mode is gray', (scheme) => {
    const { saturation } = hueAndSaturation(lineColor('fill', scheme));
    expect(saturation).toBeLessThan(0.15);
  });

  it.each(SCHEMES)('in the %s color scheme, center mode is blue', (scheme) => {
    const { hue, saturation } = hueAndSaturation(lineColor('center', scheme));
    expect(saturation).toBeGreaterThanOrEqual(0.3);
    expect(hue).toBeGreaterThanOrEqual(195);
    expect(hue).toBeLessThanOrEqual(250);
  });

  it.each(SCHEMES)('in the %s color scheme, corner mode is green', (scheme) => {
    const { hue, saturation } = hueAndSaturation(lineColor('corner', scheme));
    expect(saturation).toBeGreaterThanOrEqual(0.25);
    expect(hue).toBeGreaterThanOrEqual(90);
    expect(hue).toBeLessThanOrEqual(160);
  });

  it.each(SCHEMES)('in the %s color scheme, the three Entry modes have three different colors', (scheme) => {
    const colors = ['fill', 'center', 'corner'].map((mode) => lineColor(mode, scheme).toLowerCase());
    expect(new Set(colors).size).toBe(3);
  });

  it.each(['fill', 'center', 'corner'])('the %s color has its own shade in the dark color scheme', (mode) => {
    expect(lineColor(mode, 'dark').toLowerCase()).not.toBe(lineColor(mode, 'light').toLowerCase());
  });

  it.each(SCHEMES.flatMap((scheme) => ['fill', 'center', 'corner'].map((mode) => [scheme, mode] as const)))(
    'in the %s color scheme, the %s mode text meets 4.5:1 against the page background',
    (scheme, mode) => {
      expect(contrastRatio(lineColor(mode, scheme), pageBackground(scheme))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(['fill', 'center', 'corner'])('the %s color is set through a CSS token, not a color literal', (mode) => {
    const value = valueWhere(modeSelector(mode), 'color') ?? '';
    expect(value).toMatch(/^var\(--[\w-]+\)$/);
    expect(colorLiteralsIn(value)).toEqual([]);
  });
});

describe('Candidates: Center marks and Corner marks look different from each other and from digits (AC #7)', () => {
  /** A font size in px on a typical laptop window, after resolving tokens. */
  const fontSize = (value: string | undefined, what: string) => {
    if (value === undefined) throw new Error(`App.css sets no font-size for ${what}`);
    return evaluateLength(resolveVars(value, schemeTokens(rules, 'light')), { width: 1440, height: 900 });
  };
  const digitSize = fontSize(propertyOf(rules, '.placed', 'font-size'), '.placed');
  const givenSize = fontSize(propertyOf(rules, '.given', 'font-size'), '.given');

  it.each(['center-marks', 'corner-marks'] as const)('.%s are drawn smaller than Placed digits and Givens', (name) => {
    const size = fontSize(valueWhere(endsWithClass(name), 'font-size'), `.${name}`);
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(digitSize * 0.75);
    expect(size).toBeLessThan(givenSize * 0.75);
  });

  it('Center marks and Corner marks differ from each other in color or size', () => {
    const color = (name: string) => valueWhere(endsWithClass(name), 'color');
    const size = (name: string) => valueWhere(endsWithClass(name), 'font-size');
    const sameColor = color('center-marks') === color('corner-marks');
    const sameSize = size('center-marks') === size('corner-marks');
    expect(sameColor && sameSize).toBe(false);
  });

  it.each(['center-marks', 'corner-marks'] as const)('.%s take their color from a CSS token', (name) => {
    const value = valueWhere(endsWithClass(name), 'color') ?? '';
    expect(value).toMatch(/^var\(--[\w-]+\)$/);
  });

  it.each(SCHEMES.flatMap((scheme) => (['center-marks', 'corner-marks'] as const).map((name) => [scheme, name] as const)))(
    'in the %s color scheme, .%s meet 4.5:1 against the grid background',
    (scheme, name) => {
      expect(contrastRatio(marksColor(name, scheme), cellBackground(scheme))).toBeGreaterThanOrEqual(4.5);
    },
  );
});
