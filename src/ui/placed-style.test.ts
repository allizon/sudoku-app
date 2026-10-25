import { readFileSync } from 'node:fs';

const appCss = readFileSync(`${import.meta.dirname}/App.css`, 'utf8');

describe('Placed digit styling', () => {
  it('is italic, a cue that survives forced-colors mode (where color and a Given/Placed hue shift do not)', () => {
    const rule = /\.placed\b[^{}]*\{([^}]*)\}/.exec(appCss);
    expect(rule?.[1]).toMatch(/font-style:\s*italic/);
  });
});
