import { mkdtemp, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ProjectionInputCoverageArtifact, ProjectionRunManifestArtifact } from '../src/contracts/projectionArtifacts.js';
import type { TiberDataProjectionInputBundle } from '../src/contracts/tiberDataProjectionInput.js';
import { fixtureTiberDataProjectionBundle } from '../src/rehearsal/fixtures/projectionRehearsalFixtures.js';
import { runProjectionRehearsal } from '../src/rehearsal/runProjectionRehearsal.js';

const makeOutputDir = async (): Promise<string> => path.join(await mkdtemp(path.join(os.tmpdir(), 'projection-rehearsal-')), 'artifacts');

const readJson = async <T>(filePath: string): Promise<T> => JSON.parse(await readFile(filePath, 'utf8')) as T;

const readJsonl = async <T>(filePath: string): Promise<T[]> => {
  const contents = await readFile(filePath, 'utf8');
  if (contents.trim().length === 0) return [];
  return contents.trim().split('\n').map((line) => JSON.parse(line) as T);
};

const makeInvalidFixtureBundle = (): TiberDataProjectionInputBundle => ({
  ...fixtureTiberDataProjectionBundle,
  player_opportunities: [
    {
      ...fixtureTiberDataProjectionBundle.player_opportunities[0],
      player_name: '',
    },
  ],
});

describe('projection rehearsal flow', () => {
  it('runs the full fixture-only governed projection rehearsal and writes artifacts', async () => {
    const outputDir = await makeOutputDir();

    const result = await runProjectionRehearsal({ output_dir: outputDir });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      run_id: 'fixture-projection-rehearsal-run-001',
      generated_at: '2026-05-13T00:00:00.000Z',
      output_dir: path.resolve(outputDir),
      mapped_players: fixtureTiberDataProjectionBundle.player_opportunities.length,
      skipped_players: 0,
    });
    expect(result.data.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'FIXTURE_ONLY_NON_SOURCE_TRUTH' })]));
    expect(result.data.written_artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact_type: 'projection_run_manifest', row_count: 1 }),
        expect.objectContaining({ artifact_type: 'weekly_player_projection', row_count: fixtureTiberDataProjectionBundle.player_opportunities.length }),
        expect.objectContaining({ artifact_type: 'projection_input_coverage', row_count: 1 }),
      ]),
    );

    for (const artifact of result.data.written_artifacts) {
      await expect(stat(artifact.path)).resolves.toMatchObject({ isFile: expect.any(Function) });
    }
  });

  it('persists a manifest that references the written projection outputs', async () => {
    const outputDir = await makeOutputDir();

    const result = await runProjectionRehearsal({ output_dir: outputDir, run_id: 'fixture-rehearsal-manifest-test' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const manifestPath = path.join(outputDir, 'projection-run-manifest.json');
    const manifest = await readJson<ProjectionRunManifestArtifact>(manifestPath);
    const writtenPathsByType = new Map(result.data.written_artifacts.map((artifact) => [artifact.artifact_type, artifact.path]));

    expect(manifest.outputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          artifact_id: 'fixture-rehearsal-manifest-test-weekly-player-projections',
          artifact_type: 'weekly_player_projection',
          row_count: fixtureTiberDataProjectionBundle.player_opportunities.length,
          uri: `file://${writtenPathsByType.get('weekly_player_projection')}`,
        }),
        expect.objectContaining({
          artifact_id: 'fixture-rehearsal-manifest-test-projection-input-coverage',
          artifact_type: 'projection_input_coverage',
          row_count: 1,
          uri: `file://${writtenPathsByType.get('projection_input_coverage')}`,
        }),
      ]),
    );
  });

  it('coverage artifact reflects missing fixture fields without synthesizing source values', async () => {
    const outputDir = await makeOutputDir();

    const result = await runProjectionRehearsal({ output_dir: outputDir });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const coverage = await readJson<ProjectionInputCoverageArtifact>(path.join(outputDir, 'projection-input-coverage.json'));
    const weeklyRows = await readJsonl<Record<string, unknown>>(path.join(outputDir, 'weekly-player-projections.jsonl'));

    expect(coverage).toMatchObject({
      total_players: fixtureTiberDataProjectionBundle.player_opportunities.length,
      mapped_players: fixtureTiberDataProjectionBundle.player_opportunities.length,
      skipped_players: 0,
    });
    expect(coverage.missing_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'receiving_td_rate', severity: 'optional', player_id: 'fixture-rehearsal-wr-1' }),
        expect.objectContaining({ field: 'pass_attempts_pg', severity: 'optional', player_id: 'fixture-rehearsal-rb-1' }),
      ]),
    );
    expect(coverage.adapter_warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'TIBER_DATA_OPTIONAL_FIELDS_MISSING' })]));
    expect(weeklyRows).toHaveLength(fixtureTiberDataProjectionBundle.player_opportunities.length);
  });

  it('fails safely for invalid fixture bundles before writing artifacts', async () => {
    const outputDir = await makeOutputDir();

    const result = await runProjectionRehearsal({ output_dir: outputDir, bundle: makeInvalidFixtureBundle() });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'TIBER_DATA_REQUIRED_FIELD_INVALID' })]));
    await expect(stat(path.join(outputDir, 'projection-run-manifest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(outputDir)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('stays a local fixture rehearsal without remote, storage, or grading hooks', async () => {
    const rehearsalSource = await readFile(path.join(process.cwd(), 'src/rehearsal/runProjectionRehearsal.ts'), 'utf8');
    const fixtureSource = await readFile(path.join(process.cwd(), 'src/rehearsal/fixtures/projectionRehearsalFixtures.ts'), 'utf8');
    const serialized = `${rehearsalSource}\n${fixtureSource}`;

    expect(serialized).not.toMatch(/\bfetch\b|http:|https:|axios|XMLHttpRequest/i);
    expect(serialized).not.toMatch(/database|postgres|sqlite|redis|queue|kafka|sqs/i);
    expect(serialized).not.toMatch(/forge|grade|tier/i);
  });
});
