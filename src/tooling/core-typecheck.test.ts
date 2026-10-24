// @vitest-environment node
// tsconfig.core.json type-checks src/core/ with only the ES standard library,
// so DOM and Node APIs fail to compile there (review round 1 of TASK-1).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findCoreBoundaryViolations } from './core-boundary';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const tsc = join(repoRoot, 'node_modules', '.bin', 'tsc');
// Probes live inside the repo (node_modules is gitignored) so type resolution,
// including node_modules/@types, matches a real file in src/core/.
const probeRoot = join(repoRoot, 'node_modules', '.cache', 'core-typecheck');

/** Runs tsc on a project file; returns its exit code and output. */
function typecheck(project: string): { code: number; output: string } {
  try {
    const output = execFileSync(tsc, ['--noEmit', '-p', project], { cwd: repoRoot, encoding: 'utf8' });
    return { code: 0, output };
  } catch (error) {
    if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
      const stdout = 'stdout' in error && typeof error.stdout === 'string' ? error.stdout : '';
      return { code: error.status, output: stdout };
    }
    throw error;
  }
}

/** Type-checks one source file under the src/core/ compiler settings. */
function typecheckAsCore(source: string) {
  mkdirSync(probeRoot, { recursive: true });
  const dir = mkdtempSync(join(probeRoot, 'probe-'));
  try {
    writeFileSync(join(dir, 'probe.ts'), source);
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({ extends: join(repoRoot, 'tsconfig.core.json'), include: [], files: ['probe.ts'] }),
    );
    return typecheck(join(dir, 'tsconfig.json'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('src/core/ type-check without DOM or Node types', () => {
  it('the real src/core/ files compile', () => {
    expect(typecheck('tsconfig.core.json')).toEqual({ code: 0, output: '' });
  }, 30_000);

  it('plain standard-library code compiles', () => {
    expect(typecheckAsCore(`export const xs = new Map<string, number>([['a', 1]]);\n`).code).toBe(0);
  }, 30_000);

  it.each([
    ['the document global', `export const t = document.title;\n`],
    ['globalThis.localStorage', `export const s = globalThis.localStorage;\n`],
    ['a DOM type', `export let el: HTMLElement | undefined;\n`],
    ['the Node process global', `export const env = process.env;\n`],
  ])('fails on %s', (_label, source) => {
    expect(typecheckAsCore(source).code).not.toBe(0);
  }, 30_000);
});

describe('src/core/ type-check and boundary scan together (review round 2)', () => {
  // A types reference brings Node types in even with "types": [], so the
  // type-check alone accepts this; the boundary scan is what catches it.
  const source = '/// <reference resolution-mode="import" types="node" />\nexport const env = process.env;\n';

  it('a reordered types reference to node is flagged by the boundary scan', () => {
    expect(findCoreBoundaryViolations([{ path: 'src/core/probe.ts', source }])).toEqual([
      { file: 'src/core/probe.ts', found: 'node' },
      { file: 'src/core/probe.ts', found: 'process' },
    ]);
  });

  it('the type-check alone does not catch it, which is why both checks run', () => {
    expect(typecheckAsCore(source).code).toBe(0);
  }, 30_000);
});
