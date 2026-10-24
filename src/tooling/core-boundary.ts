// Checks the src/core/ boundary (AGENTS.md "Stack and architecture"): files in
// src/core/ import only from src/core/ itself and use no DOM APIs. Used by
// core-boundary.test.ts; not imported by the app.

/** A source file, its path relative to the repo root with POSIX separators. */
export type SourceFile = { readonly path: string; readonly source: string };

/** One boundary violation: the file, and the import specifier or DOM global found in it. */
export type CoreBoundaryViolation = { readonly file: string; readonly found: string };

const CORE_ROOT = ['src', 'core'];

const DOM_GLOBALS = ['document', 'window', 'navigator', 'localStorage', 'sessionStorage'];

// Comments, then string literals. Template literals are treated as a single
// string, which is close enough for spotting imports and globals.
const COMMENT_OR_STRING =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)/g;

// Each alternative captures its quote and its specifier:
//   import … from 'x' / export … from 'x'   (static import or re-export)
//   import 'x'                              (side-effect import)
//   import('x') / require('x')              (dynamic import or require)
const MODULE_SPECIFIER =
  /(?<![\w$.])(?:import|export)\b[^'"`;()]*?\bfrom\s*(['"])([^'"\n]*)\1|(?<![\w$.])import\s*(['"])([^'"\n]*)\3|(?<![\w$.])(?:import|require)\s*\(\s*(['"])([^'"\n]*)\5\s*\)/g;

const DOM_GLOBAL = new RegExp(`(?<![\\w$.])(?:${DOM_GLOBALS.join('|')})(?![\\w$])`, 'g');

/** Replaces every character except newlines with a space, keeping offsets intact. */
const blank = (text: string) => text.replace(/[^\n]/g, ' ');

/** The source with comments blanked out; strings kept so import specifiers survive. */
function withoutComments(source: string): string {
  return source.replace(COMMENT_OR_STRING, (match, comment: string | undefined) =>
    comment === undefined ? match : blank(match),
  );
}

/** The source with string contents blanked out too, so only code remains. */
function withoutStrings(code: string): string {
  return code.replace(
    COMMENT_OR_STRING,
    (match) => match.charAt(0) + blank(match.slice(1, -1)) + match.charAt(match.length - 1),
  );
}

/** Whether a specifier imported from `filePath` resolves to somewhere inside src/core/. */
function staysInsideCore(filePath: string, specifier: string): boolean {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return false;
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
  return CORE_ROOT.every((segment, i) => resolved[i] === segment) && resolved.length > CORE_ROOT.length;
}

/**
 * Every import from outside src/core/ (including npm packages, Node built-ins,
 * and type-only imports) and every use of a DOM global, in each file in the
 * order they appear.
 */
export function findCoreBoundaryViolations(files: readonly SourceFile[]): CoreBoundaryViolation[] {
  return files.flatMap(({ path, source }) => {
    const code = withoutComments(source);
    const found: { index: number; name: string }[] = [];

    for (const match of code.matchAll(MODULE_SPECIFIER)) {
      const specifier = match[2] ?? match[4] ?? match[6];
      if (specifier !== undefined && !staysInsideCore(path, specifier)) {
        found.push({ index: match.index, name: specifier });
      }
    }
    for (const match of withoutStrings(code).matchAll(DOM_GLOBAL)) {
      found.push({ index: match.index, name: match[0] });
    }

    return found.sort((a, b) => a.index - b.index).map(({ name }) => ({ file: path, found: name }));
  });
}
