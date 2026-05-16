import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ProjectionInputCoverageArtifact, ProjectionRunManifestArtifact } from '../src/contracts/projectionArtifacts.js';
import { TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION, type TiberDataProjectionInputBundle } from '../src/contracts/tiberDataProjectionInput.js';
import { runTiberDataFixtureRehearsal } from '../src/rehearsal/runTiberDataFixtureRehearsal.js';

const makeWorkDir = async (): Promise<string> => mkdtemp(path.join(os.tmpdir(), 'tiber-data-fixture-rehearsal-'));

const writeFixture = async (workDir: string, fixture: unknown, filename = 'weekly_projection_input_fixture_2026_w01.json'): Promise<string> => {
  const fixturePath = path.join(workDir, filename);
  await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  return fixturePath;
};

const readJson = async <T>(filePath: string): Promise<T> => JSON.parse(await readFile(filePath, 'utf8')) as T;

const readJsonl = async <T>(filePath: string): Promise<T[]> => {
  const contents = await readFile(filePath, 'utf8');
  if (contents.trim().length === 0) return [];
  return contents.trim().split('\n').map((line) => JSON.parse(line) as T);
};

const makeTiberDataOwnedFixture = (includeUnsupportedContext = true): TiberDataProjectionInputBundle & Record<string, unknown> => ({
  input_contract_version: TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION,
  tiber_data_schema_version: 'tiber-data-pr106-fixture-schema-v1',
  source_dataset_refs: [
    {
      dataset_id: 'tiber-data-pr106-weekly-projection-input-fixture',
      version: '2026-w01',
      uri: 'file://TIBER-Data/data/projection-input-fixtures/weekly_projection_input_fixture_2026_w01.json',
    },
  ],
  identity_ref: {
    identity_artifact_id: 'tiber-data-pr106-identity-fixture',
    version: '2026-w01',
    uri: 'file://TIBER-Data/artifacts/identity/fixture-2026-w01.json',
  },
  projection_context: includeUnsupportedContext
    ? {
        season: 2026,
        week: 1,
        team_pass_rate_environment: { MIN: 0.61 },
        team_pace: { MIN: 1.04 },
        offensive_environment: { MIN: 'fixture-neutral' },
      }
    : undefined,
  league_context: {
    teams: 12,
    starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
    flex_allocation: { RB: 0.35, WR: 0.55, TE: 0.1 },
  },
  player_opportunities: [
    {
      player_id: 'tiber-pr106-wr-1',
      player_name: 'TIBER PR106 Fixture Receiver',
      team: 'MIN',
      position: 'WR',
      season: 2026,
      week: 1,
      games_sampled: 14,
      route_participation: 0.9,
      routes_pg: 35.5,
      targets_per_route: 0.27,
      first_read_target_share: 0.3,
      air_yards_per_target: 10.5,
      end_zone_targets_pg: 0.5,
      red_zone_target_share: 0.22,
      catch_rate: 0.66,
      yards_per_target: 8.9,
      role_stability: 0.8,
      td_dependency: 0.42,
      injury_risk: 0.25,
      ...(includeUnsupportedContext
        ? {
            team_pass_rate_environment: 0.61,
            team_pace: 1.04,
            offensive_environment: 'fixture-neutral',
          }
        : {}),
    },
  ],
  missing_fields: [
    {
      field: 'receiving_td_rate',
      severity: 'optional',
      reason: 'TIBER-Data fixture intentionally omits receiver TD rate.',
      player_id: 'tiber-pr106-wr-1',
      impact: 'Adapter must keep the gap visible and not synthesize a substitute.',
    },
  ],
  adapter_warnings: [
    {
      code: 'TIBER_DATA_PR106_FIXTURE_ONLY',
      message: 'TIBER-Data PR106 fixture is bounded and non-production.',
    },
  ],
});

describe('TIBER-Data fixture rehearsal flow', () => {
  it('consumes a TIBER-Data-owned fixture shape and writes projection artifacts', async () => {
    const workDir = await makeWorkDir();
    const fixturePath = await writeFixture(workDir, makeTiberDataOwnedFixture());
    const outputDir = path.join(workDir, 'artifacts');

    const result = await runTiberDataFixtureRehearsal({
      fixture_path: fixturePath,
      output_dir: outputDir,
      generated_at: '2026-05-14T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toMatchObject({
      run_id: 'tiber-data-fixture-2026-w01',
      generated_at: '2026-05-14T00:00:00.000Z',
      fixture_path: path.resolve(fixturePath),
      player_count: 1,
      mapped_players: 1,
      skipped_players: 0,
    });
    expect(result.data.warning_count).toBe(result.data.warnings.length);
    expect(result.data.missing_field_count).toBeGreaterThanOrEqual(1);
    expect(result.data.written_artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact_type: 'projection_run_manifest', row_count: 1 }),
        expect.objectContaining({ artifact_type: 'weekly_player_projection', row_count: 1 }),
        expect.objectContaining({ artifact_type: 'projection_input_coverage', row_count: 1 }),
      ]),
    );

    for (const artifact of result.data.written_artifacts) {
      await expect(stat(artifact.path)).resolves.toMatchObject({ isFile: expect.any(Function) });
    }
  });

  it('preserves source refs, identity refs, missing fields, and adapter warnings in artifacts', async () => {
    const workDir = await makeWorkDir();
    const fixture = makeTiberDataOwnedFixture();
    const fixturePath = await writeFixture(workDir, fixture);
    const outputDir = path.join(workDir, 'artifacts');

    const result = await runTiberDataFixtureRehearsal({ fixture_path: fixturePath, output_dir: outputDir });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const manifest = await readJson<ProjectionRunManifestArtifact>(path.join(outputDir, 'projection-run-manifest.json'));
    const coverage = await readJson<ProjectionInputCoverageArtifact>(path.join(outputDir, 'projection-input-coverage.json'));
    const rows = await readJsonl<Record<string, unknown>>(path.join(outputDir, 'weekly-player-projections.jsonl'));

    expect(manifest.source_dataset_refs).toEqual(fixture.source_dataset_refs);
    expect(manifest.identity_ref).toEqual(fixture.identity_ref);
    expect(rows[0].input_refs).toMatchObject({
      source_dataset_refs: fixture.source_dataset_refs,
      identity_ref: fixture.identity_ref,
    });
    expect(coverage.missing_fields).toEqual(expect.arrayContaining([expect.objectContaining(fixture.missing_fields?.[0])]));
    expect(coverage.adapter_warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'TIBER_DATA_PR106_FIXTURE_ONLY' }),
        expect.objectContaining({ code: 'TIBER_DATA_FIXTURE_PROJECTION_CONTEXT_IGNORED' }),
        expect.objectContaining({ code: 'TIBER_DATA_FIXTURE_PLAYER_FIELDS_IGNORED' }),
      ]),
    );
  });

  it('does not let extra context fields affect scoring yet', async () => {
    const workDir = await makeWorkDir();
    const withContextPath = await writeFixture(workDir, makeTiberDataOwnedFixture(true), 'weekly_projection_input_fixture_2026_w01.json');
    const withoutContextPath = await writeFixture(workDir, makeTiberDataOwnedFixture(false), 'weekly_projection_input_fixture_2026_w01_no_context.json');

    const withContextResult = await runTiberDataFixtureRehearsal({ fixture_path: withContextPath, output_dir: path.join(workDir, 'with-context') });
    const withoutContextResult = await runTiberDataFixtureRehearsal({ fixture_path: withoutContextPath, output_dir: path.join(workDir, 'without-context') });

    expect(withContextResult.ok).toBe(true);
    expect(withoutContextResult.ok).toBe(true);
    if (!withContextResult.ok || !withoutContextResult.ok) return;

    const withContextRows = await readJsonl<Record<string, unknown>>(path.join(withContextResult.data.output_dir, 'weekly-player-projections.jsonl'));
    const withoutContextRows = await readJsonl<Record<string, unknown>>(path.join(withoutContextResult.data.output_dir, 'weekly-player-projections.jsonl'));

    expect(withContextRows[0]).not.toHaveProperty('team_pass_rate_environment');
    expect(withContextRows[0]).not.toHaveProperty('team_pace');
    expect(withContextRows[0]).not.toHaveProperty('offensive_environment');
    expect(withContextRows[0].expected_points).toBe(withoutContextRows[0].expected_points);
    expect(withContextRows[0].floor).toBe(withoutContextRows[0].floor);
    expect(withContextRows[0].ceiling).toBe(withoutContextRows[0].ceiling);
  });

  it('fails cleanly for an invalid local fixture path', async () => {
    const workDir = await makeWorkDir();
    const result = await runTiberDataFixtureRehearsal({ fixture_path: path.join(workDir, 'missing.json') });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'TIBER_DATA_FIXTURE_READ_FAILED' })]));
  });

  it('fails malformed optional values through adapter validation without coercion', async () => {
    const workDir = await makeWorkDir();
    const fixture = makeTiberDataOwnedFixture();
    fixture.player_opportunities = [
      {
        ...fixture.player_opportunities[0],
        catch_rate: '0.66',
      },
    ] as unknown as TiberDataProjectionInputBundle['player_opportunities'];
    const fixturePath = await writeFixture(workDir, fixture);

    const result = await runTiberDataFixtureRehearsal({ fixture_path: fixturePath, output_dir: path.join(workDir, 'artifacts') });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TIBER_DATA_OPTIONAL_FIELD_INVALID',
          message: 'player_opportunities[0].catch_rate must be a finite number when supplied.',
        }),
      ]),
    );
  });
});
