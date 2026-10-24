// Checks the src/core/ boundary (AGENTS.md "Stack and architecture"): files in
// src/core/ import only from src/core/ itself and use no DOM or Node APIs. Used
// by core-boundary.test.ts; not imported by the app.
//
// This is a text scan, not a parser, so it can be fooled (for example by a
// regex literal containing a quote or backtick). tsconfig.core.json backs it
// up: it type-checks src/core/ with only the ES standard library, so any DOM
// or Node use there fails to compile.

/** A source file, its path relative to the repo root with POSIX separators. */
export type SourceFile = { readonly path: string; readonly source: string };

/**
 * One boundary violation: the file, and what was found in it — an import
 * specifier, a triple-slash reference, or a DOM or Node global.
 */
export type CoreBoundaryViolation = { readonly file: string; readonly found: string };

const CORE_ROOT = ['src', 'core'];

const FORBIDDEN_GLOBALS = [
  'document',
  'window',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'XMLHttpRequest',
  'process',
];

// Comments, then string and template literals. A template literal is treated
// as a single string, which is close enough for spotting imports and globals.
const COMMENT_OR_STRING =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)/g;

// Each alternative captures its quote and its specifier:
//   import … from 'x' / export … from 'x'   (static import or re-export)
//   import 'x'                              (side-effect import)
//   import('x') / require('x')              (dynamic import or require; also with backticks)
const MODULE_SPECIFIER =
  /(?<![\w$.])(?:import|export)\b[^'"`;()]*?\bfrom\s*(['"])([^'"\n]*)\1|(?<![\w$.])import\s*(['"])([^'"\n]*)\3|(?<![\w$.])(?:import|require)\s*\(\s*(['"`])([^'"`\n$]*)\5\s*\)/g;

// A `/// <reference … />` tag, and its types/lib/path attribute wherever it
// appears among the tag's attributes.
const TRIPLE_SLASH_REFERENCE = /^\/\/\/\s*<reference\b([^>]*)/;
const REFERENCE_ATTRIBUTE = /(?:^|\s)(types|lib|path)\s*=\s*(['"])([^'"]*)\2/;

// A forbidden global, used bare or through globalThis/self/window; or any
// other use of globalThis or self, which pure core code has no reason to touch
// (casts, aliases, bracket access, optional chaining). Not a property of
// something else (`foo.window`, `options.self`) and not part of a longer name.
const FORBIDDEN_GLOBAL = new RegExp(
  `(?<![\\w$.])(?:(?:globalThis|self|window)\\s*\\.\\s*)?(${FORBIDDEN_GLOBALS.join('|')})(?![\\w$])` +
    `|(?<![\\w$.])(globalThis|self)(?![\\w$])`,
  'g',
);

type Found = { readonly index: number; readonly name: string };

/** Replaces every character except newlines with a space, keeping offsets intact. */
const blank = (text: string) => text.replace(/[^\n]/g, ' ');

/** Whether a specifier imported from `filePath` resolves to src/core/ or somewhere inside it. */
function staysInsideCore(filePath: string, specifier: string): boolean {
  const isRelative =
    specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
  if (!isRelative) return false;
  const resolved = filePath.split('/').slice(0, -1);
  for (const segment of specifier.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (resolved.length === 0) return false;
      resolved.pop();
    } else {
      resolved.push(segment);
    }
  }
  return resolved.length >= CORE_ROOT.length && CORE_ROOT.every((segment, i) => resolved[i] === segment);
}

/**
 * A triple-slash reference that reaches outside src/core/ or the ES standard
 * library, if any. A reference tag with no types, lib, or path attribute is
 * reported whole, since it is not one the checker knows to be safe.
 */
function forbiddenReference(filePath: string, comment: string): string | undefined {
  const tag = TRIPLE_SLASH_REFERENCE.exec(comment);
  if (tag === null) return undefined;
  const attribute = REFERENCE_ATTRIBUTE.exec(tag[1] ?? '');
  if (attribute === null) return comment.slice(comment.indexOf('<')).trim();
  const [, kind, , value = ''] = attribute;
  if (kind === 'lib') return /^es/i.test(value) ? undefined : value;
  if (kind === 'path') {
    if (value.startsWith('/')) return value;
    const specifier = value.startsWith('.') ? value : `./${value}`;
    return staysInsideCore(filePath, specifier) ? undefined : value;
  }
  return value;
}

function violationsInFile(path: string, source: string): Found[] {
  const found: Found[] = [];

  // Blank out comments (noting forbidden triple-slash references as we go),
  // keeping strings so import specifiers survive.
  const code = source.replace(COMMENT_OR_STRING, (match, comment: string | undefined, _string: string | undefined, index: number) => {
    if (comment === undefined) return match;
    const reference = forbiddenReference(path, comment);
    if (reference !== undefined) found.push({ index, name: reference });
    return blank(match);
  });

  for (const match of code.matchAll(MODULE_SPECIFIER)) {
    const specifier = match[2] ?? match[4] ?? match[6];
    if (specifier !== undefined && !staysInsideCore(path, specifier)) {
      found.push({ index: match.index, name: specifier });
    }
  }

  // Then blank out string contents too, so only code is searched for globals.
  const codeOnly = code.replace(
    COMMENT_OR_STRING,
    (match) => match.charAt(0) + blank(match.slice(1, -1)) + match.charAt(match.length - 1),
  );
  for (const match of codeOnly.matchAll(FORBIDDEN_GLOBAL)) {
    const name = match[1] ?? match[2];
    if (name !== undefined) found.push({ index: match.index, name });
  }

  return found.sort((a, b) => a.index - b.index);
}

/**
 * Every import from outside src/core/ (including npm packages, Node built-ins,
 * type-only imports, and triple-slash references), and every use of a DOM or
 * Node global, in each file in the order they appear.
 */
export function findCoreBoundaryViolations(files: readonly SourceFile[]): CoreBoundaryViolation[] {
  return files.flatMap(({ path, source }) =>
    violationsInFile(path, source).map(({ name }) => ({ file: path, found: name })),
  );
}
