// @vitest-environment node
// Review round 1 for TASK-10 (display.md §1, §2; milestones.md M0), checked
// against App.css: where the toast stack goes, that it keeps clear of the
// color scheme toggle, and that grid lines stay visible during the focus flash.
import {
  contrastRatio,
  evaluateLength,
  gridLayout,
  onlyColorIn,
  parseCss,
  propertyOf,
  readAppCss,
  resolveVars,
  schemeTokens,
  type CssRule,
} from './test-support/app-css';
import { toastPlacement } from './toast-placement';

const css = readAppCss();
const rules = parseCss(css);
const SCHEMES = ['light', 'dark'] as const;
const REM = 16;

const gridWidth = (width: number, height: number) => gridLayout(css, { width, height }).gridWidth;

describe('Toast placement: beside the grid when there is room, below it otherwise (milestones.md M0)', () => {
  it.each([
    [1440, 900],
    [1366, 768],
    [1920, 1080],
    [2560, 1440],
  ])('on a %i×%i window the toasts go beside the grid', (width, height) => {
    expect(toastPlacement(width, gridWidth(width, height), REM)).toBe('beside');
  });

  it.each([
    [320, 480],
    [375, 667],
    [768, 1024],
    [1024, 768],
  ])('on a %i×%i window the toasts go below the grid', (width, height) => {
    expect(toastPlacement(width, gridWidth(width, height), REM)).toBe('below');
  });

  it('with a larger root font, the room needed beside the grid grows with it', () => {
    // 1460px wide: 230px each side of a 1000px grid. Enough for 14rem at 16px, not at 20px.
    expect(toastPlacement(1460, 1000, 16)).toBe('beside');
    expect(toastPlacement(1460, 1000, 20)).toBe('below');
  });

  it('beside the grid, the stack at its narrowest stays right of the grid', () => {
    for (const [width, height] of [
      [1440, 900],
      [1366, 768],
      [3840, 2160],
    ] as const) {
      const grid = gridWidth(width, height);
      if (toastPlacement(width, grid, REM) !== 'beside') continue;
      const stackLeft = width - REM - 12 * REM;
      expect(stackLeft, `${width}×${height}`).toBeGreaterThanOrEqual((width + grid) / 2);
    }
  });
});

describe('Toast placement: the toast stack never hides the color scheme toggle', () => {
  const tokens = schemeTokens(rules, 'light');
  const length = (selector: string, property: string) => {
    const value = propertyOf(rules, selector, property);
    if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
    return evaluateLength(resolveVars(value, tokens), { width: 375, height: 667 });
  };

  it('below the grid, the stack starts right of the toggle', () => {
    const toggleRight = length('.color-scheme-toggle', 'left') + length('.color-scheme-toggle', 'width');
    expect(length(".toasts[data-placement='below']", 'left')).toBeGreaterThan(toggleRight);
  });

  it('before App has measured, a narrow window’s stack also starts right of the toggle', () => {
    const narrow = rules.find((r) => r.selector === '.toasts' && r.context.some((c) => c.startsWith('@media')));
    const left = narrow?.declarations.find((d) => d.property === 'left')?.value;
    expect(left).toBeDefined();
    const toggleRight = length('.color-scheme-toggle', 'left') + length('.color-scheme-toggle', 'width');
    expect(evaluateLength(resolveVars(left ?? '', tokens), { width: 375, height: 667 })).toBeGreaterThan(toggleRight);
  });
});

describe('Grid focus flash: grid lines and box lines stay at least 3:1 while the grid flashes (display.md §2)', () => {
  const flashRules = (): CssRule[] =>
    rules.filter((r) => r.context.some((c) => c.startsWith('@keyframes grid-focus-flash')) && r.selector === 'from');

  const flashColor = (scheme: 'light' | 'dark') => {
    const [rule] = flashRules();
    const value = rule?.declarations.find((d) => d.property === 'background-color')?.value;
    if (value === undefined) throw new Error('App.css has no grid focus flash color');
    return onlyColorIn(resolveVars(value, schemeTokens(rules, scheme)));
  };
  const colorOf = (selector: string, property: string, scheme: 'light' | 'dark') => {
    const value = propertyOf(rules, selector, property);
    if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
    return onlyColorIn(resolveVars(value, schemeTokens(rules, scheme)));
  };

  it('both flash animations start from the same color', () => {
    const values = flashRules().map((r) => r.declarations.find((d) => d.property === 'background-color')?.value);
    expect(values.length).toBe(2);
    expect(new Set(values).size).toBe(1);
  });

  it.each(SCHEMES)('in the %s color scheme, grid lines meet 3:1 against the flash color', (scheme) => {
    expect(contrastRatio(colorOf('.cell', 'border-right', scheme), flashColor(scheme))).toBeGreaterThanOrEqual(3);
  });

  it.each(SCHEMES)('in the %s color scheme, box lines meet 3:1 against the flash color', (scheme) => {
    expect(contrastRatio(colorOf('.grid', 'border', scheme), flashColor(scheme))).toBeGreaterThanOrEqual(3);
  });

  it.each(SCHEMES)('in the %s color scheme, the flash is visibly different from the grid background', (scheme) => {
    expect(contrastRatio(flashColor(scheme), colorOf('.grid', 'background', scheme))).toBeGreaterThan(1.1);
  });
});
