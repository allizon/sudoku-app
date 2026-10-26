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
import { ROOM_BESIDE_REM, toastPlacement } from './toast-placement';

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
});

const BESIDE = ".toasts[data-placement='beside']";
const BELOW = ".toasts[data-placement='below']";

/** The beside rule's numbers, read from App.css: the stack's narrowest width, its margins, and its right inset. */
function besideNumbers() {
  const maxWidth = propertyOf(rules, BESIDE, 'max-width') ?? '';
  const match = /clamp\(\s*([\d.]+)rem\s*,\s*calc\(\(100vw - var\(--grid-width\)\) \/ 2 - ([\d.]+)rem\)/.exec(maxWidth);
  const right = /^([\d.]+)rem$/.exec(propertyOf(rules, BESIDE, 'right') ?? '');
  if (match === null || right === null) throw new Error(`App.css's beside rule no longer has the expected shape: ${maxWidth}`);
  return { minWidth: Number(match[1]), margins: Number(match[2]), right: Number(right[1]) };
}

describe('Toast placement: App.css and toast-placement.ts agree on the room beside the grid', () => {
  it('ROOM_BESIDE_REM is the stack’s narrowest width plus its margins in App.css', () => {
    const { minWidth, margins } = besideNumbers();
    expect(ROOM_BESIDE_REM).toBe(minWidth + margins);
  });

  it('beside the grid, the stack keeps a gap from the grid as well as from the window edge', () => {
    const { margins, right } = besideNumbers();
    expect(margins - right).toBeGreaterThan(0);
  });

  it('beside the grid, the stack at its narrowest stays clear of the grid', () => {
    const { minWidth, right } = besideNumbers();
    for (const [width, height] of [
      [1440, 900],
      [1366, 768],
      [1920, 1080],
      [3840, 2160],
    ] as const) {
      const grid = gridWidth(width, height);
      expect(toastPlacement(width, grid, REM), `${width}×${height}`).toBe('beside');
      const stackLeft = width - right * REM - minWidth * REM;
      expect(stackLeft, `${width}×${height}`).toBeGreaterThan((width + grid) / 2);
    }
  });
});

describe('Toast placement: only the placement rules position the stack', () => {
  const PLACEMENT = ['top', 'bottom', 'left', 'right', 'inset', 'max-width', 'max-height', 'align-items'];

  it('App.css has no @media rule for the toasts', () => {
    expect(rules.filter((r) => r.selector.includes('.toasts') && r.context.length > 0)).toEqual([]);
  });

  it('no other rule sets where the stack goes, so nothing can override a placement', () => {
    const others = rules.filter((r) => r.selector.includes('.toasts') && r.selector !== BESIDE && r.selector !== BELOW);
    for (const rule of others)
      for (const { property } of rule.declarations)
        expect(PLACEMENT.includes(property), `${rule.selector} { ${property} }`).toBe(false);
  });

  it.each([BESIDE, BELOW])('%s sets every side and both limits', (selector) => {
    for (const property of ['top', 'bottom', 'left', 'right', 'max-width', 'max-height'])
      expect(propertyOf(rules, selector, property), `${selector} { ${property} }`).toBeDefined();
  });

  it('beside the grid, the stack is in the top-right corner', () => {
    expect(propertyOf(rules, BESIDE, 'top')).toBe('1rem');
    expect(propertyOf(rules, BESIDE, 'bottom')).toBe('auto');
    expect(propertyOf(rules, BESIDE, 'left')).toBe('auto');
  });

  it('below the grid, the stack is at the bottom of the window', () => {
    expect(propertyOf(rules, BELOW, 'top')).toBe('auto');
    expect(propertyOf(rules, BELOW, 'bottom')).not.toBe('auto');
  });
});

describe('Toast placement: below the grid, the stack is centered and clear of the toggle', () => {
  const tokens = schemeTokens(rules, 'light');
  const length = (selector: string, property: string) => {
    const value = propertyOf(rules, selector, property);
    if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
    return evaluateLength(resolveVars(value, tokens), { width: 375, height: 667 });
  };

  it('below the grid, the stack starts right of the toggle', () => {
    const toggleRight = length('.color-scheme-toggle', 'left') + length('.color-scheme-toggle', 'width');
    expect(length(BELOW, 'left')).toBeGreaterThan(toggleRight);
  });

  it('below the grid, the stack is centered in the window, so under the grid', () => {
    expect(length(BELOW, 'left')).toBeCloseTo(length(BELOW, 'right'), 5);
    expect(propertyOf(rules, BELOW, 'align-items')).toBe('center');
  });

  it('below the grid, the stack still has room for toasts on a 320px window', () => {
    expect(320 - length(BELOW, 'left') - length(BELOW, 'right')).toBeGreaterThanOrEqual(8 * REM);
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
