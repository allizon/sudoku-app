// Test support for reading App.css without a browser (TASK-10; display.md §1, §2).
//
// jsdom does no layout and does not apply App.css, so the grid-size and
// color-scheme tests read the stylesheet from disk and work from its rules:
// a small parser, a resolver for var() tokens, a calculator for the length
// expressions the grid size is built from, and WCAG contrast for colors.
// Used only by tests.
import { readFileSync } from 'node:fs';

export const appCssPath = `${import.meta.dirname}/../App.css`;

export function readAppCss(): string {
  return readFileSync(appCssPath, 'utf8');
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface Declaration {
  property: string;
  value: string;
}

export interface CssRule {
  /** The rule's selector, e.g. ".cell" or ":root[data-color-scheme='dark']". */
  selector: string;
  /** Enclosing at-rule preludes, outermost first, e.g. ["@media (width < 988px)"]. */
  context: string[];
  declarations: Declaration[];
}

/** Every style rule in a stylesheet, including those inside @media and @keyframes. */
export function parseCss(css: string): CssRule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: CssRule[] = [];
  parseBlock(text, [], undefined, rules);
  return rules;
}

function parseBlock(text: string, context: string[], parentSelector: string | undefined, out: CssRule[]) {
  const declarations: Declaration[] = [];
  let i = 0;
  let start = 0;
  let depth = 0; // parentheses, so a ";" inside url(...) does not end a declaration
  while (i < text.length) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      addDeclaration(text.slice(start, i), declarations);
      start = i + 1;
    } else if (ch === '{' && depth === 0) {
      const prelude = text.slice(start, i).trim();
      const end = matchingBrace(text, i);
      const body = text.slice(i + 1, end);
      if (prelude.startsWith('@')) parseBlock(body, [...context, prelude], parentSelector, out);
      else {
        const selector = parentSelector === undefined ? prelude : `${parentSelector} ${prelude}`;
        parseBlock(body, context, selector, out);
      }
      i = end + 1;
      start = i;
      continue;
    }
    i++;
  }
  addDeclaration(text.slice(start), declarations);
  if (parentSelector !== undefined && declarations.length > 0)
    out.push({ selector: parentSelector, context, declarations });
}

function matchingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error('App.css: unbalanced braces');
}

function addDeclaration(raw: string, out: Declaration[]) {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.startsWith('@')) return;
  const colon = trimmed.indexOf(':');
  if (colon < 0) return;
  out.push({ property: trimmed.slice(0, colon).trim(), value: trimmed.slice(colon + 1).trim() });
}

/** Whether a rule sits inside a @keyframes block (its "from"/"to" are not selectors). */
export const inKeyframes = (rule: CssRule) => rule.context.some((c) => c.startsWith('@keyframes'));

// ---------------------------------------------------------------------------
// Color schemes
// ---------------------------------------------------------------------------

/** The light scheme is the stylesheet's base: the :root rule, outside any at-rule. */
export const isLightSchemeRule = (rule: CssRule) =>
  rule.context.length === 0 &&
  /^(?::root|html)(?:\[data-color-scheme=(['"]?)light\1\])?$/.test(rule.selector);

/** The dark scheme: the root element carrying data-color-scheme="dark". */
export const isDarkSchemeRule = (rule: CssRule) =>
  rule.context.length === 0 && /^(?::root|html)?\[data-color-scheme=(['"]?)dark\1\]$/.test(rule.selector);

export type Tokens = Map<string, string>;

/** Custom properties declared in the given rules, later ones winning. */
function tokensOf(rules: CssRule[]): Tokens {
  const tokens: Tokens = new Map();
  for (const rule of rules)
    for (const { property, value } of rule.declarations) if (property.startsWith('--')) tokens.set(property, value);
  return tokens;
}

/** The token values in effect in a scheme: the base :root tokens, with the dark rule on top for dark. */
export function schemeTokens(rules: CssRule[], scheme: 'light' | 'dark'): Tokens {
  const light = tokensOf(rules.filter(isLightSchemeRule));
  if (scheme === 'light') return light;
  return new Map([...light, ...tokensOf(rules.filter(isDarkSchemeRule))]);
}

/** Substitutes var() references with token values (and their fallbacks), as the browser would. */
export function resolveVars(value: string, tokens: Tokens, depth = 0): string {
  if (depth > 20) throw new Error(`var() cycle while resolving "${value}"`);
  const start = value.indexOf('var(');
  if (start < 0) return value;
  let depth2 = 0;
  let end = start + 3;
  for (; end < value.length; end++) {
    if (value[end] === '(') depth2++;
    else if (value[end] === ')') {
      depth2--;
      if (depth2 === 0) break;
    }
  }
  const inner = value.slice(start + 4, end);
  const comma = inner.indexOf(',');
  const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
  const fallback = comma < 0 ? undefined : inner.slice(comma + 1).trim();
  const replacement = tokens.get(name) ?? fallback;
  if (replacement === undefined) throw new Error(`token ${name} is not defined`);
  const substituted = value.slice(0, start) + resolveVars(replacement, tokens, depth + 1) + value.slice(end + 1);
  return resolveVars(substituted, tokens, depth + 1);
}

/** The value of a property on a selector (outside at-rules), last declaration winning. */
export function propertyOf(rules: CssRule[], selector: string, property: string): string | undefined {
  let found: string | undefined;
  for (const rule of rules)
    if (rule.context.length === 0 && rule.selector === selector)
      for (const d of rule.declarations) if (d.property === property) found = d.value;
  return found;
}

// ---------------------------------------------------------------------------
// Color literals
// ---------------------------------------------------------------------------

/** The CSS named colors. transparent and currentcolor are not listed: they draw no color of their own. */
const NAMED_COLORS = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan
darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen
darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite
forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink
indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral
lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
whitesmoke yellow yellowgreen`.split(/\s+/);

const COLOR_FUNCTIONS = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix', 'light-dark'];

const colorLiteralPattern = new RegExp(
  [
    '#[0-9a-fA-F]{3,8}\\b',
    `(?<![\\w-])(?:${COLOR_FUNCTIONS.join('|')})\\([^()]*(?:\\([^()]*\\)[^()]*)*\\)`,
    `(?<![\\w-])(?:${NAMED_COLORS.join('|')})(?![\\w-])`,
  ].join('|'),
  'gi',
);

/** The color literals written in a CSS value (var() names and quoted strings ignored). */
export function colorLiteralsIn(value: string): string[] {
  const bare = value.replace(/var\(\s*--[\w-]+/g, 'var(').replace(/(['"])[^'"]*\1/g, '""');
  return bare.match(colorLiteralPattern) ?? [];
}

/** Whether a value is exactly one color literal and nothing else. */
export function isSingleColor(value: string): boolean {
  const literals = colorLiteralsIn(value);
  return literals.length === 1 && literals[0]?.toLowerCase() === value.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Contrast (WCAG 2)
// ---------------------------------------------------------------------------

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parses a hex, rgb()/rgba(), hsl()/hsla(), white, or black color. Other forms are not supported here. */
export function parseColor(literal: string): Rgba {
  const text = literal.trim().toLowerCase();
  if (text === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (text === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(text)?.[1];
  if (hex !== undefined) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex;
    const byte = (i: number) => parseInt(full.slice(i * 2, i * 2 + 2), 16);
    return { r: byte(0), g: byte(1), b: byte(2), a: full.length === 8 ? byte(3) / 255 : 1 };
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(text);
  if (fn !== null) {
    const parts = (fn[2] ?? '').split(/[\s,/]+/).filter((p) => p !== '');
    const num = (p: string | undefined, scale: number) =>
      p === undefined ? 1 : p.endsWith('%') ? (parseFloat(p) / 100) * scale : parseFloat(p);
    const alpha = parts[3] === undefined ? 1 : num(parts[3], 1);
    if (fn[1]?.startsWith('rgb')) return { r: num(parts[0], 255), g: num(parts[1], 255), b: num(parts[2], 255), a: alpha };
    const h = parseFloat(parts[0] ?? '0');
    const s = num(parts[1], 1);
    const l = num(parts[2], 1);
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a: alpha };
  }
  throw new Error(`the contrast check reads hex, rgb(), hsl(), white and black; it cannot read "${literal}"`);
}

/** A color drawn over an opaque background. */
function over(color: Rgba, background: Rgba): Rgba {
  const mix = (c: number, b: number) => c * color.a + b * (1 - color.a);
  return { r: mix(color.r, background.r), g: mix(color.g, background.g), b: mix(color.b, background.b), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The relative luminance of an opaque color literal, 0 (black) to 1 (white). */
export const luminanceOf = (literal: string) => luminance(parseColor(literal));

/** The WCAG contrast ratio of a foreground color drawn on a background color. */
export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  if (bg.a < 1) throw new Error(`background ${background} is not opaque`);
  const fg = over(parseColor(foreground), bg);
  const [light, dark] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** The one color literal in a resolved value such as "1px solid #8a8a8a". */
export function onlyColorIn(resolved: string): string {
  const literals = colorLiteralsIn(resolved);
  if (literals.length !== 1) throw new Error(`expected one color in "${resolved}", found ${literals.length}`);
  return literals[0] as string;
}

// ---------------------------------------------------------------------------
// Lengths
// ---------------------------------------------------------------------------

export interface Viewport {
  width: number;
  height: number;
}

/** Root font size assumed for rem (and em, which the grid's rules do not use today). */
const REM = 16;

type Token = { kind: 'num'; value: number; px: boolean } | { kind: 'op'; op: string } | { kind: 'fn'; name: string } | { kind: 'paren'; ch: string } | { kind: 'comma' };

function tokenize(expr: string, viewport: Viewport): Token[] {
  const units: Record<string, number> = {
    px: 1,
    rem: REM,
    em: REM,
    vw: viewport.width / 100,
    vh: viewport.height / 100,
    dvh: viewport.height / 100,
    svh: viewport.height / 100,
    lvh: viewport.height / 100,
    dvw: viewport.width / 100,
    svw: viewport.width / 100,
    lvw: viewport.width / 100,
    vmin: Math.min(viewport.width, viewport.height) / 100,
    vmax: Math.max(viewport.width, viewport.height) / 100,
  };
  const out: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const rest = expr.slice(i);
    const space = /^\s+/.exec(rest);
    if (space) {
      i += space[0].length;
      continue;
    }
    const prev = out[out.length - 1];
    const valueBefore = prev !== undefined && (prev.kind === 'num' || (prev.kind === 'paren' && prev.ch === ')'));
    const number = (valueBefore ? /^(\d*\.?\d+(?:e[+-]?\d+)?)([a-z%]*)/i : /^(-?\d*\.?\d+(?:e[+-]?\d+)?)([a-z%]*)/i).exec(rest);
    if (number) {
      const unit = (number[2] ?? '').toLowerCase();
      if (unit === '') out.push({ kind: 'num', value: parseFloat(number[1] ?? ''), px: false });
      else {
        const scale = units[unit];
        if (scale === undefined) throw new Error(`the grid-size check cannot evaluate the unit "${unit}" in "${expr}"`);
        out.push({ kind: 'num', value: parseFloat(number[1] ?? '') * scale, px: true });
      }
      i += number[0].length;
      continue;
    }
    const fn = /^([a-z-]+)\(/i.exec(rest);
    if (fn) {
      out.push({ kind: 'fn', name: (fn[1] ?? '').toLowerCase() });
      i += fn[0].length;
      continue;
    }
    const ch = expr[i] as string;
    if ('+-*/'.includes(ch)) out.push({ kind: 'op', op: ch });
    else if (ch === '(' || ch === ')') out.push({ kind: 'paren', ch });
    else if (ch === ',') out.push({ kind: 'comma' });
    else throw new Error(`the grid-size check cannot evaluate "${expr}"`);
    i++;
  }
  return out;
}

type Value = { value: number; px: boolean };

/** Evaluates a CSS length expression (calc, min, max, clamp, viewport units) to pixels. */
export function evaluateLength(expr: string, viewport: Viewport): number {
  const tokens = tokenize(expr, viewport);
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function sum(): Value {
    let left = product();
    for (let t = peek(); t?.kind === 'op' && (t.op === '+' || t.op === '-'); t = peek()) {
      next();
      const right = product();
      left = { value: t.op === '+' ? left.value + right.value : left.value - right.value, px: left.px || right.px };
    }
    return left;
  }
  function product(): Value {
    let left = primary();
    for (let t = peek(); t?.kind === 'op' && (t.op === '*' || t.op === '/'); t = peek()) {
      next();
      const right = primary();
      left =
        t.op === '*'
          ? { value: left.value * right.value, px: left.px || right.px }
          : { value: left.value / right.value, px: left.px && !right.px };
    }
    return left;
  }
  function args(): Value[] {
    const list = [sum()];
    while (peek()?.kind === 'comma') {
      next();
      list.push(sum());
    }
    const close = next();
    if (close?.kind !== 'paren' || close.ch !== ')') throw new Error(`unclosed function in "${expr}"`);
    return list;
  }
  function primary(): Value {
    const t = next();
    if (t === undefined) throw new Error(`unexpected end of "${expr}"`);
    if (t.kind === 'num') return { value: t.value, px: t.px };
    if (t.kind === 'paren' && t.ch === '(') {
      const v = sum();
      next();
      return v;
    }
    if (t.kind === 'op' && t.op === '-') {
      const v = primary();
      return { value: -v.value, px: v.px };
    }
    if (t.kind === 'fn') {
      const list = args();
      const px = list.some((v) => v.px);
      const values = list.map((v) => v.value);
      switch (t.name) {
        case 'calc':
          return list[0] as Value;
        case 'min':
          return { value: Math.min(...values), px };
        case 'max':
          return { value: Math.max(...values), px };
        case 'clamp':
          return { value: Math.max(values[0] as number, Math.min(values[1] as number, values[2] as number)), px };
      }
      throw new Error(`the grid-size check cannot evaluate ${t.name}() in "${expr}"`);
    }
    throw new Error(`the grid-size check cannot evaluate "${expr}"`);
  }

  const result = sum();
  if (pos !== tokens.length) throw new Error(`the grid-size check could not read all of "${expr}"`);
  return result.value;
}

/** The first length in a value such as "1px solid #8a8a8a" or "0.75rem 0 0". */
export function firstLength(resolved: string, viewport: Viewport): number {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of resolved.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (current !== '') parts.push(current);
      current = '';
    } else current += ch;
  }
  if (current !== '') parts.push(current);
  for (const part of parts) {
    if (colorLiteralsIn(part).length > 0 || /^[a-z-]+$/i.test(part)) continue;
    return evaluateLength(part, viewport);
  }
  throw new Error(`no length in "${resolved}"`);
}

// ---------------------------------------------------------------------------
// The grid's size, modelled from App.css
// ---------------------------------------------------------------------------

/**
 * The grid's outer size as App.css lays it out today: nine square .cell boxes
 * per row, six thin lines (.cell's border-right) and four box lines (the
 * .grid's border, also drawn between boxes) across. Throws with a clear
 * message when App.css no longer matches that model.
 */
export function gridLayout(css: string, viewport: Viewport) {
  const rules = parseCss(css);
  const tokens = schemeTokens(rules, 'light');
  // Media queries are not applied here; the size rules must not depend on them.
  for (const rule of rules)
    if (rule.context.some((c) => c.startsWith('@media')))
      for (const d of rule.declarations)
        if (['width', 'height', 'padding', 'border', 'aspect-ratio'].includes(d.property) && /^\.(cell|grid|app)$/.test(rule.selector))
          throw new Error(`the grid-size check does not apply @media rules (${rule.selector} { ${d.property} })`);
  const need = (selector: string, property: string) => {
    const value = propertyOf(rules, selector, property);
    if (value === undefined) throw new Error(`App.css has no ${property} on ${selector}`);
    return resolveVars(value, tokens);
  };
  const length = (value: string) => firstLength(value, viewport);

  const cellWidth = evaluateLength(need('.cell', 'width'), viewport);
  const aspect = propertyOf(rules, '.cell', 'aspect-ratio');
  const cellHeight = aspect !== undefined && /^1(\s*\/\s*1)?$/.test(aspect.trim()) ? cellWidth : evaluateLength(need('.cell', 'height'), viewport);
  const thin = length(need('.cell', 'border-right'));
  const box = length(propertyOf(rules, '.grid', 'border') !== undefined ? need('.grid', 'border') : need('.grid', 'border-width'));
  const borderBox = propertyOf(rules, '.cell', 'box-sizing') === 'border-box';
  const lines = 6 * thin + 4 * box;
  const gridWidth = borderBox ? 9 * cellWidth + 2 * box : 9 * cellWidth + lines;
  const gridHeight = borderBox ? 9 * cellHeight + 2 * box : 9 * cellHeight + lines;

  const padding = length(need('.app', 'padding'));
  // The lines of text under the grid: the Entry mode line, always shown, and
  // under it the hint, shown only while the grid is empty.
  const entryModeLine = length(need('.entry-mode-line', 'margin')) + length(need('.entry-mode-line', 'line-height'));
  const hint = length(need('.hint', 'margin')) + length(need('.hint', 'line-height'));
  // The room App.css keeps under the grid when it sizes the cells.
  const belowGridRoom = evaluateLength(need(':root', '--below-grid'), viewport);
  return {
    cellWidth,
    cellHeight,
    gridWidth,
    gridHeight,
    padding,
    /** Under an empty grid: the Entry mode line and the hint, the most text the grid ever has under it. */
    belowGrid: entryModeLine + hint,
    belowGridRoom,
  };
}
