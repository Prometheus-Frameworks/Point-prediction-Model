import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const tsxPath = path.resolve('node_modules/.bin/tsx');
const cwd = path.resolve('.');

describe('CLI integration', () => {
  it('prints a compact comparison table for file-based runs', () => {
    const output = execFileSync(tsxPath, ['src/index.ts', 'file', './src/examples/scenarios.sample.json'], {
      cwd,
      encoding: 'utf8',
    });

    expect(output).toContain('scenarioId');
    expect(output).toContain('sample-bowers-vacated-targets');
    expect(output).toContain('sample-wr-new-signing');
  });
});
