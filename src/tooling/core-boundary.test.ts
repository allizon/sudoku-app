// @vitest-environment node
// The src/core/ boundary (TASK-1, AC #3 and #4): files in src/core/ import only
// from src/core/ itself. React, the DOM, the UI, npm packages, and Node built-ins
// are all outside the boundary.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCoreBoundaryViolations } from './core-boundary';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const coreDir = join(repoRoot, 'src', 'core');

/** One file in src/core/, its path relative to the repo root, POSIX separators. */
const coreFile = (name: string, source: string) => ({ path: `src/core/${name}`, source });

function violationsIn(path: string, source: string) {
  return findCoreBoundaryViolations([{ path, source }]);
}

describe('core boundary checker: catches imports from outside src/core/', () => {
  it.each([
    ['an import of React', `import { useState } from 'react';`, 'react'],
    ['an import of react-dom', `import { createRoot } from 'react-dom/client';`, 'react-dom/client'],
    ['a default import of React', `import React from 'react';`, 'react'],
    ['a namespace import', `import * as R from 'react';`, 'react'],
    ['a type-only import of React', `import type { ReactNode } from 'react';`, 'react'],
    ['a side-effect import', `import 'react';`, 'react'],
    ['an import from the UI', `import { App } from '../ui/App';`, '../ui/App'],
    ['an import that climbs out and back past src/core/', `import { x } from '../../src/ui/x';`, '../../src/ui/x'],
    ['an import of any npm package', `import { z } from 'zod';`, 'zod'],
    ['an import of a Node built-in (node: prefix)', `import { readFileSync } from 'node:fs';`, 'node:fs'],
    ['an import of a Node built-in (bare name)', `import { join } from 'path';`, 'path'],
    ['a re-export from outside', `export { App } from '../ui/App';`, '../ui/App'],
    ['a star re-export from outside', `export * from 'react';`, 'react'],
    ['a dynamic import from outside', `const m = await import('react');`, 'react'],
    ['a require from outside', `const r = require('react');`, 'react'],
    [
      'an import spread over several lines',
      `import {\n  useState,\n  useEffect,\n} from "react";`,
      'react',
    ],
  ])('flags %s', (_label, source, specifier) => {
    const violations = violationsIn('src/core/puzzle.ts', source);
    expect(violations).toEqual([{ file: 'src/core/puzzle.ts', found: specifier }]);
  });

  it('flags a bad import in a nested src/core/ folder that climbs out', () => {
    const violations = violationsIn('src/core/parse/format.ts', `import { x } from '../../ui/x';`);
    expect(violations).toEqual([{ file: 'src/core/parse/format.ts', found: '../../ui/x' }]);
  });

  it('reports every violation in a file, not only the first', () => {
    const source = `import React from 'react';\nimport { App } from '../ui/App';\nimport { cell } from './cell';`;
    const violations = violationsIn('src/core/puzzle.ts', source);
    expect(violations).toEqual([
      { file: 'src/core/puzzle.ts', found: 'react' },
      { file: 'src/core/puzzle.ts', found: '../ui/App' },
    ]);
  });

  it('reports violations across several files, naming each file', () => {
    const violations = findCoreBoundaryViolations([
      coreFile('a.ts', `import 'react';`),
      coreFile('b.ts', `import { ok } from './a';`),
      coreFile('c.ts', `import { App } from '../ui/App';`),
    ]);
    expect(violations).toEqual([
      { file: 'src/core/a.ts', found: 'react' },
      { file: 'src/core/c.ts', found: '../ui/App' },
    ]);
  });
});

describe('core boundary checker: allows imports that stay inside src/core/', () => {
  it.each([
    ['a sibling import', `import { cell } from './cell';`],
    ['a sibling import with an extension', `import { cell } from './cell.ts';`],
    ['an import from a nested folder', `import { parse } from './parse/format';`],
    ['a type-only sibling import', `import type { Cell } from './cell';`],
    ['a re-export from a sibling', `export * from './cell';`],
    ['a dynamic import of a sibling', `const m = await import('./cell');`],
    ['a file with no imports', `export const SIZE = 9;`],
  ])('allows %s', (_label, source) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([]);
  });

  it('allows a nested file to import back up to src/core/', () => {
    expect(violationsIn('src/core/parse/format.ts', `import { cell } from '../cell';`)).toEqual([]);
  });
});

describe('core boundary checker: catches DOM APIs used in src/core/', () => {
  it.each([
    ['document', `export const el = document.createElement('div');`],
    ['window', `export const w = window.innerWidth;`],
    ['navigator', `export const lang = navigator.language;`],
    ['localStorage', `localStorage.setItem('k', 'v');`],
    ['sessionStorage', `sessionStorage.getItem('k');`],
  ])('flags use of the %s global', (name, source) => {
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([
      { file: 'src/core/puzzle.ts', found: name },
    ]);
  });

  it('does not flag names that merely contain a DOM global name', () => {
    const source = `export const windowSize = 3;\nexport const documentation = 'x';`;
    expect(violationsIn('src/core/puzzle.ts', source)).toEqual([]);
  });
});

describe('core boundary on the real src/core/ files', () => {
  /** Every non-test .ts/.tsx file under src/core/, recursively. */
  function readCoreSourceFiles() {
    return readdirSync(coreDir, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .map((file) => ({
        path: relative(repoRoot, file).split('\\').join('/'),
        source: readFileSync(file, 'utf8'),
      }));
  }

  it('src/core/ holds at least one source file to check', () => {
    expect(readCoreSourceFiles().length).toBeGreaterThan(0);
  });

  it('no file in src/core/ imports from outside src/core/ or uses DOM APIs', () => {
    expect(findCoreBoundaryViolations(readCoreSourceFiles())).toEqual([]);
  });

  it('the same check fails when a deliberately bad file is added to the real src/core/ files', () => {
    const withBadFile = [...readCoreSourceFiles(), coreFile('bad.ts', `import React from 'react';`)];
    expect(findCoreBoundaryViolations(withBadFile)).toEqual([{ file: 'src/core/bad.ts', found: 'react' }]);
  });
});
