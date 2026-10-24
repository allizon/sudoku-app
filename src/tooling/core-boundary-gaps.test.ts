// @vitest-environment node
// Boundary cases found in review round 1 of TASK-1: backtick specifiers,
// triple-slash references, globals reached through globalThis/self/window,
// imports that resolve to src/core/ itself, and non-.ts files in src/core/.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCoreBoundaryViolations } from './core-boundary';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const coreDir = join(repoRoot, 'src', 'core');

function violationsIn(path: string, source: string) {
  return findCoreBoundaryViolations([{ path, source }]);
}

describe('core boundary checker: backtick specifiers', () => {
  it.each([
    ['a dynamic import with a backtick literal', 'const m = await import(`react`);', 'react'],
    ['a require with a backtick literal', 'const fs = require(`fs`);', 'fs'],
  ])('flags %s', (_label, source, specifier) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([
      { file: 'src/core/puzzle.ts', found: specifier },
    ]);
  });

  it('allows a dynamic import of a sibling with a backtick literal', () => {
    expect(violationsIn('src/core/puzzle.ts', 'const m = await import(`./cell`);')).toEqual([]);
  });
});

describe('core boundary checker: triple-slash references', () => {
  it.each([
    ['a types reference', '/// <reference types="react" />', 'react'],
    ['a DOM lib reference', '/// <reference lib="dom" />', 'dom'],
    ['a path reference outside src/core/', '/// <reference path="../ui/globals.d.ts" />', '../ui/globals.d.ts'],
  ])('flags %s', (_label, source, found) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([{ file: 'src/core/puzzle.ts', found }]);
  });

  it.each([
    ['an ES lib reference', '/// <reference lib="es2023" />'],
    ['a path reference inside src/core/', '/// <reference path="./cell.d.ts" />'],
    ['an ordinary comment that mentions a reference', '// see <reference types="react" />'],
  ])('allows %s', (_label, source) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([]);
  });
});

describe('core boundary checker: DOM and Node globals', () => {
  it.each([
    ['globalThis.localStorage', `globalThis.localStorage.setItem('k', 'v');`, 'localStorage'],
    ['globalThis.document', `export const d = globalThis.document;`, 'document'],
    ['self.fetch', `self.fetch('/x');`, 'fetch'],
    ['window.localStorage', `window.localStorage.clear();`, 'localStorage'],
    ['fetch', `fetch('/x');`, 'fetch'],
    ['indexedDB', `indexedDB.open('db');`, 'indexedDB'],
    ['XMLHttpRequest', `new XMLHttpRequest();`, 'XMLHttpRequest'],
    ['process', `export const env = process.env;`, 'process'],
  ])('flags %s', (_label, source, found) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([{ file: 'src/core/puzzle.ts', found }]);
  });

  it('does not flag a property of another object with a global name', () => {
    expect(violationsIn('src/core/puzzle.ts', `export const f = options.fetch;`)).toEqual([]);
  });

  it('does not flag global names inside strings or comments', () => {
    const source = `// uses no document\nexport const s = 'window and fetch';`;
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([]);
  });
});

describe('core boundary checker: imports that resolve to src/core/ itself', () => {
  it.each([
    ['src/core/puzzle.ts', `import { x } from '.';`],
    ['src/core/puzzle.ts', `import { x } from './';`],
    ['src/core/puzzle.ts', `import { x } from '../core';`],
    ['src/core/puzzle.ts', `import { x } from '../core/cell';`],
    ['src/core/parse/format.ts', `import { x } from '..';`],
  ])('allows %s importing %s', (path, source) => {
    expect(violationsIn(path, source)).toEqual([]);
  });

  it('flags an import of src/ from src/core/', () => {
    expect(violationsIn('src/core/puzzle.ts', `import { x } from '..';`)).toEqual([
      { file: 'src/core/puzzle.ts', found: '..' },
    ]);
  });
});

describe('core boundary on the real src/core/ files: JavaScript and other module extensions', () => {
  it('no non-test .js, .jsx, .mjs, .cjs, .mts, or .cts file in src/core/ crosses the boundary', () => {
    const files = readdirSync(coreDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .filter((file) => /\.(?:jsx?|mjs|cjs|mts|cts)$/.test(file) && !/\.test\.[cm]?[jt]sx?$/.test(file))
      .map((file) => ({
        path: relative(repoRoot, file).split('\\').join('/'),
        source: readFileSync(file, 'utf8'),
      }));
    expect(findCoreBoundaryViolations(files)).toEqual([]);
  });
});
