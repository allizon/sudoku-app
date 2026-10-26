// @vitest-environment node
// Color tokens and the two color schemes, as written in App.css (TASK-10,
// AC #3, #6, #7, #8; display.md §2).
//
// The light color scheme is the base :root rule; the dark color scheme is a
// rule on the root element carrying data-color-scheme="dark" (App sets that
// attribute; see color-scheme.test.tsx). Each scheme is a set of token
// (custom property) values. jsdom does not apply App.css, so contrast is
// computed from the token values the rules resolve to in each scheme.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  colorLiteralsIn,
  contrastRatio,
  inKeyframes,
  isDarkSchemeRule,
  isLightSchemeRule,
  isSingleColor,
  luminanceOf,
  onlyColorIn,
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

const isToken = (property: string) => property.startsWith('--');

/** Properties that draw a color. */
const COLOR_PROPERTIES =
  /^(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|box-shadow|text-shadow|text-decoration(?:-color)?|caret-color|accent-color|column-rule(?:-color)?|fill|stroke)$/;

/** Color tokens: custom properties whose value holds a color literal. */
function colorTokensIn(selected: CssRule[]): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const rule of selected)
    for (const { property, value } of rule.declarations)
      if (isToken(property) && colorLiteralsIn(value).length > 0) tokens.set(property, value);
  return tokens;
}

const darkRules = () => rules.filter(isDarkSchemeRule);

/** The color a property on a selector draws in a scheme, after resolving its tokens. */
function colorOf(selector: string, property: string, scheme: 'light' | 'dark'): string {
  // Without a dark rule, "dark" would silently be the light values.
  if (scheme === 'dark' && darkRules().length === 0) throw new Error('App.css has no dark color scheme rule');
  const value = propertyOf(rules, selector, property);
  if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
  return onlyColorIn(resolveVars(value, schemeTokens(rules, scheme)));
}

const gridBackground = (scheme: 'light' | 'dark') =>
  propertyOf(rules, '.grid', 'background') !== undefined
    ? colorOf('.grid', 'background', scheme)
    : colorOf('.grid', 'background-color', scheme);

const pageBackground = (scheme: 'light' | 'dark') =>
  propertyOf(rules, ':root', 'background') !== undefined
    ? colorOf(':root', 'background', scheme)
    : colorOf(':root', 'background-color', scheme);

/** Grid lines: the thin lines between cells. */
const gridLine = (scheme: 'light' | 'dark') => colorOf('.cell', 'border-right', scheme);
/** Box lines: the thick lines around and between the 3×3 boxes. */
const boxLine = (scheme: 'light' | 'dark') =>
  propertyOf(rules, '.grid', 'border') !== undefined ? colorOf('.grid', 'border', scheme) : colorOf('.grid', 'border-color', scheme);
const innerBoxLine = (scheme: 'light' | 'dark') => colorOf('.cell:nth-child(3n):not(:last-child)', 'border-right', scheme);

describe('Color scheme: the app starts in the light color scheme, whatever the system setting (AC #3)', () => {
  it('App.css does not follow the system light/dark setting (no prefers-color-scheme query)', () => {
    expect(css).not.toMatch(/prefers-color-scheme/);
  });

  it('the base :root rule holds the light color scheme, so with no scheme chosen the app is light', () => {
    // The light scheme's colors are in effect before any attribute is set.
    expect(colorTokensIn(rules.filter((r) => r.context.length === 0 && r.selector === ':root')).size).toBeGreaterThan(0);
    expect(luminanceOf(pageBackground('light'))).toBeGreaterThan(0.5);
    expect(luminanceOf(gridBackground('light'))).toBeGreaterThan(0.5);
  });
});

describe('Color scheme: the dark color scheme is dark (AC #4)', () => {
  it('App.css has a dark color scheme rule on the root element', () => {
    expect(darkRules().length).toBeGreaterThan(0);
  });

  it('in the dark color scheme the page and grid backgrounds are dark', () => {
    expect(luminanceOf(pageBackground('dark'))).toBeLessThan(0.2);
    expect(luminanceOf(gridBackground('dark'))).toBeLessThan(0.2);
  });
});

describe('Color scheme: grid lines and box lines meet at least 3:1 contrast in both schemes (AC #6)', () => {
  it.each(SCHEMES)('in the %s color scheme, grid lines meet 3:1 against the grid background', (scheme) => {
    expect(contrastRatio(gridLine(scheme), gridBackground(scheme))).toBeGreaterThanOrEqual(3);
  });

  it.each(SCHEMES)('in the %s color scheme, box lines meet 3:1 against the grid background', (scheme) => {
    expect(contrastRatio(boxLine(scheme), gridBackground(scheme))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(innerBoxLine(scheme), gridBackground(scheme))).toBeGreaterThanOrEqual(3);
  });

  it.each(SCHEMES)('in the %s color scheme, the outer box line meets 3:1 against the page background', (scheme) => {
    expect(contrastRatio(boxLine(scheme), pageBackground(scheme))).toBeGreaterThanOrEqual(3);
  });
});

describe('Color scheme: text meets at least 4.5:1 contrast in both schemes', () => {
  const toastBackground = (selector: string, scheme: 'light' | 'dark') =>
    propertyOf(rules, selector, 'background') !== undefined
      ? colorOf(selector, 'background', scheme)
      : colorOf(selector, 'background-color', scheme);

  it.each(SCHEMES)('in the %s color scheme, Given digits meet 4.5:1 against the grid background', (scheme) => {
    expect(contrastRatio(colorOf('.given', 'color', scheme), gridBackground(scheme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SCHEMES)('in the %s color scheme, Placed digits meet 4.5:1 against the grid background', (scheme) => {
    expect(contrastRatio(colorOf('.placed', 'color', scheme), gridBackground(scheme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SCHEMES)('in the %s color scheme, the hint text meets 4.5:1 against the page background', (scheme) => {
    expect(contrastRatio(colorOf('.hint', 'color', scheme), pageBackground(scheme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SCHEMES)('in the %s color scheme, parse error toast text meets 4.5:1 against its background', (scheme) => {
    expect(contrastRatio(colorOf('.toast', 'color', scheme), toastBackground('.toast', scheme))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SCHEMES)('in the %s color scheme, refusal toast text meets 4.5:1 against its background', (scheme) => {
    expect(
      contrastRatio(colorOf('.toast', 'color', scheme), toastBackground(".toast[data-kind='refusal']", scheme)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Color tokens: every color the app draws comes from a CSS token (AC #7)', () => {
  it('App.css has no color literals outside token definitions', () => {
    const offenders: string[] = [];
    for (const rule of rules)
      for (const { property, value } of rule.declarations)
        if (!isToken(property) && colorLiteralsIn(value).length > 0)
          offenders.push(`${rule.context.join(' ')} ${rule.selector} { ${property}: ${value} }`.trim());
    expect(offenders).toEqual([]);
  });

  it('every token App.css uses for a color is defined in both color schemes', () => {
    expect(darkRules().length, 'App.css has no dark color scheme rule').toBeGreaterThan(0);
    for (const scheme of SCHEMES) {
      const tokens = schemeTokens(rules, scheme);
      for (const rule of rules)
        for (const { property, value } of rule.declarations) {
          if (!COLOR_PROPERTIES.test(property)) continue;
          for (const [, name] of value.matchAll(/var\(\s*(--[\w-]+)/g))
            expect(tokens.has(name ?? ''), `${scheme}: ${rule.selector} { ${property} } uses ${name}`).toBe(true);
        }
    }
  });

  it('no other stylesheet or component in src/ writes a color literal', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'test-support') walk(path);
        } else if (/\.(css|tsx)$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name) && !path.endsWith(join('ui', 'App.css'))) {
          const text = readFileSync(path, 'utf8');
          const hex = text.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
          const fns = text.match(/\b(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch)\(/g) ?? [];
          if (hex.length + fns.length > 0) offenders.push(`${path}: ${[...hex, ...fns].join(', ')}`);
        }
      }
    };
    walk(join(import.meta.dirname, '..'));
    expect(offenders).toEqual([]);
  });
});

describe('Color tokens: each color scheme is defined purely as token values (AC #8)', () => {
  it('the dark color scheme rule sets only tokens', () => {
    expect(darkRules().length).toBeGreaterThan(0);
    for (const rule of darkRules())
      for (const { property } of rule.declarations) expect(isToken(property), `dark scheme sets ${property}`).toBe(true);
  });

  it('the light and dark color schemes define the same set of color tokens', () => {
    const light = [...colorTokensIn(rules.filter(isLightSchemeRule)).keys()].sort();
    const dark = [...colorTokensIn(darkRules()).keys()].sort();
    expect(light.length).toBeGreaterThan(0);
    expect(dark).toEqual(light);
  });

  it('every color token holds just a color, so a skin supplies colors and nothing else', () => {
    const mixed: string[] = [];
    for (const rule of rules)
      for (const { property, value } of rule.declarations)
        if (isToken(property) && colorLiteralsIn(value).length > 0 && !isSingleColor(value))
          mixed.push(`${rule.selector} { ${property}: ${value} }`);
    expect(mixed).toEqual([]);
  });

  it('color tokens are defined only in the light and dark color scheme rules', () => {
    const elsewhere: string[] = [];
    for (const rule of rules) {
      if (isLightSchemeRule(rule) || isDarkSchemeRule(rule) || inKeyframes(rule)) continue;
      for (const { property, value } of rule.declarations)
        if (isToken(property) && colorLiteralsIn(value).length > 0)
          elsewhere.push(`${rule.context.join(' ')} ${rule.selector} { ${property}: ${value} }`.trim());
    }
    expect(elsewhere).toEqual([]);
  });

  it('the dark color scheme changes colors only, never sizes or layout tokens', () => {
    expect(darkRules().length, 'App.css has no dark color scheme rule').toBeGreaterThan(0);
    for (const rule of darkRules())
      for (const { property, value } of rule.declarations)
        expect(colorLiteralsIn(value).length, `dark scheme sets non-color token ${property}: ${value}`).toBeGreaterThan(0);
  });
});
