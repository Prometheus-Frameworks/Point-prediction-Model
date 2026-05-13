import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
  PROJECTION_RUN_MANIFEST_ARTIFACT_VERSION,
  REPLACEMENT_BASELINES_ARTIFACT_VERSION,
  ROS_PLAYER_PROJECTION_ARTIFACT_VERSION,
  WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
  writeProjectionArtifacts,
} from '../src/public/index.js';
import type {
  ProjectionInputCoverageArtifact,
  ProjectionRunManifestArtifact,
  ReplacementBaselinesArtifact,
  RosPlayerProjectionArtifactRow,
  WeeklyPlayerProjectionArtifactRow,
} from '../src/public/index.js';

const sourceDatasetRefs = [{ dataset_id: 'fixture-weekly-opportunity', version: '2026-week-01', uri: 'file://fixture/opportunity.json' }];
const identityRef = { identity_artifact_id: 'fixture-identity-map', version: 'identity-v1', uri: 'file://fixture/identity.json' };
const modelRefs = [{ model_id: 'fixture-weekly-model', version: 'model-v1', uri: 'file://fixture/model.json' }];

const manifest: ProjectionRunManifestArtifact = {
  artifact_type: 'projection_run_manifest',
  artifact_version: PROJECTION_RUN_MANIFEST_ARTIFACT_VERSION,
  generated_at: '2026-05-13T00:00:00.000Z',
  run_id: 'fixture-run-001',
  input_contract_version: 'tiber-data-projection-input-v1',
  scoring_contract_version: 'weekly-scoring-v1',
  tiber_data_schema_version: 'fixture-tiber-schema-v1',
  source_dataset_refs: sourceDatasetRefs,
  identity_ref: identityRef,
  model_refs: modelRefs,
  outputs: [
    {
      artifact_id: 'fixture-weekly-player-projections',
      artifact_type: 'weekly_player_projection',
      artifact_version: WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
      uri: 'file://fixture/weekly-player-projections.jsonl',
      row_count: 2,
    },
    {
      artifact_id: 'fixture-ros-player-projections',
      artifact_type: 'ros_player_projection',
      artifact_version: ROS_PLAYER_PROJECTION_ARTIFACT_VERSION,
      uri: 'file://fixture/ros-player-projections.jsonl',
      row_count: 1,
    },
  ],
  warnings: [{ code: 'FIXTURE_WARNING', message: 'Fixture upstream warning.' }],
  missing_fields: [],
};

const weeklyRows: WeeklyPlayerProjectionArtifactRow[] = [
  {
    artifact_type: 'weekly_player_projection',
    artifact_version: WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
    run_id: 'fixture-run-001',
    player_id: 'fixture-player-1',
    team: 'KC',
    position: 'WR',
    season: 2026,
    week: 1,
    expected_points: 17.4,
    replacement_points: 10.1,
    vorp: 7.3,
    floor: 10.2,
    median: 17.1,
    ceiling: 24.8,
    confidence_band: 'HIGH',
    volatility_tag: 'MODERATE',
    fragility_tag: 'LOW',
    role_notes: ['Fixture role note carried from scoring output.'],
    input_refs: { source_dataset_refs: sourceDatasetRefs, identity_ref: identityRef, model_refs: modelRefs },
  },
  {
    artifact_type: 'weekly_player_projection',
    artifact_version: WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
    run_id: 'fixture-run-001',
    player_id: 'fixture-player-2',
    team: 'DET',
    position: 'RB',
    season: 2026,
    week: 1,
    expected_points: 14.2,
    replacement_points: 9.1,
    vorp: 5.1,
    floor: 8.8,
    median: 14,
    ceiling: 20.7,
    confidence_band: 'MEDIUM',
    volatility_tag: 'STABLE',
    fragility_tag: 'MEDIUM',
    role_notes: [],
    input_refs: { source_dataset_refs: sourceDatasetRefs, identity_ref: identityRef, model_refs: modelRefs },
  },
];

const rosRows: RosPlayerProjectionArtifactRow[] = [
  {
    artifact_type: 'ros_player_projection',
    artifact_version: ROS_PLAYER_PROJECTION_ARTIFACT_VERSION,
    run_id: 'fixture-run-001',
    player_id: 'fixture-player-1',
    team: 'KC',
    position: 'WR',
    remaining_weeks: 16,
    ros_expected_points: 278.4,
    ros_vorp: 116.8,
    floor: 163.2,
    median: 273.6,
    ceiling: 396.8,
    confidence_band: 'HIGH',
    volatility_tag: 'MODERATE',
    fragility_tag: 'LOW',
    role_notes: ['Fixture ROS note.'],
    input_refs: { source_dataset_refs: sourceDatasetRefs, identity_ref: identityRef, model_refs: modelRefs },
  },
];

const replacementBaselines: ReplacementBaselinesArtifact = {
  artifact_type: 'replacement_baselines',
  artifact_version: REPLACEMENT_BASELINES_ARTIFACT_VERSION,
  run_id: 'fixture-run-001',
  baselines: {
    QB: { replacement_points: 18.2, replacement_rank: 12, sample_size: 32 },
    RB: { replacement_points: 10.4, replacement_rank: 30, sample_size: 80 },
    WR: { replacement_points: 9.8, replacement_rank: 36, sample_size: 96 },
    TE: { replacement_points: 7.1, replacement_rank: 12, sample_size: 40 },
  },
};

const coverage: ProjectionInputCoverageArtifact = {
  artifact_type: 'projection_input_coverage',
  artifact_version: PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
  run_id: 'fixture-run-001',
  total_players: 3,
  mapped_players: 2,
  skipped_players: 1,
  missing_fields: [],
  adapter_warnings: [{ code: 'FIXTURE_ADAPTER_WARNING', message: 'Fixture adapter warning.' }],
};

const tempDirs: string[] = [];

const makeOutputDir = async (leaf = 'artifacts'): Promise<string> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'projection-artifacts-'));
  tempDirs.push(tempDir);
  return path.join(tempDir, leaf);
};

const readJson = async <T>(filePath: string): Promise<T> => JSON.parse(await readFile(filePath, 'utf8')) as T;

const readJsonl = async <T>(filePath: string): Promise<T[]> => {
  const contents = await readFile(filePath, 'utf8');
  return contents
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((tempDir) => rm(tempDir, { recursive: true, force: true })));
});

describe('writeProjectionArtifacts', () => {
  it('writes valid projection artifacts with deterministic filenames and row counts', async () => {
    const outputDir = await makeOutputDir();

    const result = await writeProjectionArtifacts({
      output_dir: outputDir,
      manifest,
      weekly_player_projections: weeklyRows,
      ros_player_projections: rosRows,
      replacement_baselines: replacementBaselines,
      projection_input_coverage: coverage,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.output_dir).toBe(path.resolve(outputDir));
    expect(result.data.written_artifacts).toEqual([
      { artifact_type: 'projection_run_manifest', path: path.join(path.resolve(outputDir), 'projection-run-manifest.json'), row_count: 1 },
      { artifact_type: 'weekly_player_projection', path: path.join(path.resolve(outputDir), 'weekly-player-projections.jsonl'), row_count: 2 },
      { artifact_type: 'ros_player_projection', path: path.join(path.resolve(outputDir), 'ros-player-projections.jsonl'), row_count: 1 },
      { artifact_type: 'replacement_baselines', path: path.join(path.resolve(outputDir), 'replacement-baselines.json'), row_count: 1 },
      { artifact_type: 'projection_input_coverage', path: path.join(path.resolve(outputDir), 'projection-input-coverage.json'), row_count: 1 },
    ]);
  });

  it('creates the output directory, writes pretty JSON, and writes one JSON object per JSONL line', async () => {
    const outputDir = await makeOutputDir('nested/artifacts');

    const result = await writeProjectionArtifacts({
      output_dir: outputDir,
      manifest,
      weekly_player_projections: weeklyRows,
      ros_player_projections: rosRows,
      replacement_baselines: replacementBaselines,
      projection_input_coverage: coverage,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await expect(stat(outputDir)).resolves.toMatchObject({ isDirectory: expect.any(Function) });

    const manifestPath = path.join(outputDir, 'projection-run-manifest.json');
    const manifestContents = await readFile(manifestPath, 'utf8');
    expect(manifestContents).toContain('\n  "artifact_type": "projection_run_manifest"');
    expect(await readJson<ProjectionRunManifestArtifact>(manifestPath)).toEqual(manifest);
    expect(await readJson<ReplacementBaselinesArtifact>(path.join(outputDir, 'replacement-baselines.json'))).toEqual(replacementBaselines);
    expect(await readJson<ProjectionInputCoverageArtifact>(path.join(outputDir, 'projection-input-coverage.json'))).toEqual(coverage);

    const weeklyContents = await readFile(path.join(outputDir, 'weekly-player-projections.jsonl'), 'utf8');
    const weeklyLines = weeklyContents.trim().split('\n');
    expect(weeklyLines).toHaveLength(weeklyRows.length);
    expect(weeklyLines.every((line) => line.startsWith('{') && line.endsWith('}'))).toBe(true);
    expect(await readJsonl<WeeklyPlayerProjectionArtifactRow>(path.join(outputDir, 'weekly-player-projections.jsonl'))).toEqual(weeklyRows);
    expect(await readJsonl<RosPlayerProjectionArtifactRow>(path.join(outputDir, 'ros-player-projections.jsonl'))).toEqual(rosRows);
  });

  it('writes explicit empty JSONL files when weekly or ROS arrays are provided empty', async () => {
    const outputDir = await makeOutputDir();

    const result = await writeProjectionArtifacts({
      output_dir: outputDir,
      manifest,
      weekly_player_projections: [],
      ros_player_projections: [],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.written_artifacts).toEqual([
      { artifact_type: 'projection_run_manifest', path: path.join(path.resolve(outputDir), 'projection-run-manifest.json'), row_count: 1 },
      { artifact_type: 'weekly_player_projection', path: path.join(path.resolve(outputDir), 'weekly-player-projections.jsonl'), row_count: 0 },
      { artifact_type: 'ros_player_projection', path: path.join(path.resolve(outputDir), 'ros-player-projections.jsonl'), row_count: 0 },
    ]);
    expect(await readFile(path.join(outputDir, 'weekly-player-projections.jsonl'), 'utf8')).toBe('');
    expect(await readFile(path.join(outputDir, 'ros-player-projections.jsonl'), 'utf8')).toBe('');
  });

  it('prevents partial writes when validation fails', async () => {
    const outputDir = await makeOutputDir();
    const invalidRows = [{ ...weeklyRows[0], run_id: '' }];

    const result = await writeProjectionArtifacts({
      output_dir: outputDir,
      manifest,
      weekly_player_projections: invalidRows,
      replacement_baselines: replacementBaselines,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PROJECTION_ARTIFACT_RUN_ID_MISSING',
          details: expect.objectContaining({ artifact_type: 'weekly_player_projection', row_index: 0 }),
        }),
      ]),
    );
    await expect(stat(path.join(outputDir, 'projection-run-manifest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(outputDir)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not add FORGE grading or tiering fields to writer results or persisted artifacts', async () => {
    const outputDir = await makeOutputDir();

    const result = await writeProjectionArtifacts({ output_dir: outputDir, manifest, weekly_player_projections: weeklyRows });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const serializedResult = JSON.stringify(result.data);
    const serializedManifest = await readFile(path.join(outputDir, 'projection-run-manifest.json'), 'utf8');
    const serializedRows = await readFile(path.join(outputDir, 'weekly-player-projections.jsonl'), 'utf8');
    for (const serialized of [serializedResult, serializedManifest, serializedRows]) {
      expect(serialized).not.toMatch(/forge|grade|tier/i);
    }
  });

  it('stays limited to local artifact writing without network, database, queue, or legacy ingestion hooks', async () => {
    const writerSource = await readFile(path.join(process.cwd(), 'src/artifacts/writeProjectionArtifacts.ts'), 'utf8');

    expect(writerSource).not.toMatch(/\bfetch\b|http:|https:|axios|request\(/i);
    expect(writerSource).not.toMatch(/database|postgres|sqlite|redis|queue|kafka|sqs/i);
    expect(writerSource).not.toMatch(/parseScenario|loadScenario|legacy/i);
  });
});
