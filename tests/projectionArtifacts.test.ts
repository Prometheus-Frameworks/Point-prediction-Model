import { describe, expect, it } from 'vitest';
import {
  PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
  PROJECTION_RUN_MANIFEST_ARTIFACT_VERSION,
  REPLACEMENT_BASELINES_ARTIFACT_VERSION,
  WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
  validateProjectionInputCoverageArtifact,
  validateProjectionRunManifest,
  validateReplacementBaselinesArtifact,
  validateWeeklyPlayerProjectionArtifactRow,
} from '../src/public/index.js';
import * as projectionArtifactContracts from '../src/contracts/projectionArtifacts.js';
import type {
  ProjectionInputCoverageArtifact,
  ProjectionRunManifestArtifact,
  ReplacementBaselinesArtifact,
  WeeklyPlayerProjectionArtifactRow,
} from '../src/public/index.js';

const sourceDatasetRefs = [{ dataset_id: 'fixture-weekly-opportunity', version: '2026-week-01', uri: 's3://fixture/opportunity.json' }];
const identityRef = { identity_artifact_id: 'fixture-identity-map', version: 'identity-v1', uri: 's3://fixture/identity.json' };
const modelRefs = [{ model_id: 'fixture-weekly-model', version: 'model-v1', uri: 's3://fixture/model.json' }];

const validManifest: ProjectionRunManifestArtifact = {
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
      uri: 's3://fixture/weekly-player-projections.jsonl',
      row_count: 1,
    },
  ],
  warnings: [{ code: 'FIXTURE_WARNING', message: 'Fixture upstream warning.' }],
  missing_fields: [
    {
      field: 'receiving_td_rate',
      severity: 'optional',
      reason: 'Fixture upstream bundle did not include receiving TD rate.',
      player_id: 'fixture-player-1',
      impact: 'Scoring adapter did not synthesize this value.',
    },
  ],
};

const validWeeklyRow: WeeklyPlayerProjectionArtifactRow = {
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
  input_refs: {
    source_dataset_refs: sourceDatasetRefs,
    identity_ref: identityRef,
    model_refs: modelRefs,
  },
};

const validBaselines: ReplacementBaselinesArtifact = {
  artifact_type: 'replacement_baselines',
  artifact_version: REPLACEMENT_BASELINES_ARTIFACT_VERSION,
  run_id: 'fixture-run-001',
  league_context_ref: { artifact_id: 'fixture-league-context', artifact_type: 'projection_run_manifest' },
  baselines: {
    QB: { replacement_points: 18.2, replacement_rank: 12, sample_size: 32 },
    RB: { replacement_points: 10.4, replacement_rank: 30, sample_size: 80 },
    WR: { replacement_points: 9.8, replacement_rank: 36, sample_size: 96 },
    TE: { replacement_points: 7.1, replacement_rank: 12, sample_size: 40 },
  },
};

describe('projection artifact contracts', () => {
  it('validates a valid projection run manifest', () => {
    const result = validateProjectionRunManifest(validManifest);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBe(validManifest);
  });

  it('validates a valid weekly player projection row', () => {
    const result = validateWeeklyPlayerProjectionArtifactRow(validWeeklyRow);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBe(validWeeklyRow);
  });

  it('fails invalid rows when required artifact identity, version, and run_id fields are missing', () => {
    const invalidRow = {
      ...validWeeklyRow,
      artifact_type: undefined,
      artifact_version: undefined,
      run_id: '',
    };

    const result = validateWeeklyPlayerProjectionArtifactRow(invalidRow);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'PROJECTION_ARTIFACT_IDENTITY_INVALID' }),
        expect.objectContaining({ code: 'PROJECTION_ARTIFACT_VERSION_INVALID' }),
        expect.objectContaining({ code: 'PROJECTION_ARTIFACT_RUN_ID_MISSING' }),
      ]),
    );
  });

  it('requires numeric projection fields to be finite numbers', () => {
    const invalidRow = {
      ...validWeeklyRow,
      expected_points: Number.NaN,
      replacement_points: Number.POSITIVE_INFINITY,
      vorp: '7.3',
      floor: Number.NEGATIVE_INFINITY,
    };

    const result = validateWeeklyPlayerProjectionArtifactRow(invalidRow);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'expected_points must be a finite number.' }),
        expect.objectContaining({ message: 'replacement_points must be a finite number.' }),
        expect.objectContaining({ message: 'vorp must be a finite number.' }),
        expect.objectContaining({ message: 'floor must be a finite number.' }),
      ]),
    );
  });

  it('requires replacement baseline artifacts to include all scoring positions', () => {
    const invalidBaselines = {
      ...validBaselines,
      baselines: {
        QB: validBaselines.baselines.QB,
        RB: validBaselines.baselines.RB,
        WR: validBaselines.baselines.WR,
      },
    };

    const result = validateReplacementBaselinesArtifact(invalidBaselines);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PROJECTION_ARTIFACT_REQUIRED_FIELD_MISSING',
          message: 'baselines.TE is required.',
        }),
      ]),
    );
  });

  it('preserves coverage artifact missing-field and warning structures', () => {
    const coverage: ProjectionInputCoverageArtifact = {
      artifact_type: 'projection_input_coverage',
      artifact_version: PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
      run_id: 'fixture-run-001',
      total_players: 3,
      mapped_players: 2,
      skipped_players: 1,
      missing_fields: validManifest.missing_fields,
      adapter_warnings: validManifest.warnings,
    };

    const result = validateProjectionInputCoverageArtifact(coverage);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.missing_fields).toBe(validManifest.missing_fields);
    expect(result.data.adapter_warnings).toBe(validManifest.warnings);
    expect(result.data.missing_fields[0]).toEqual(
      expect.objectContaining({
        field: 'receiving_td_rate',
        severity: 'optional',
        reason: 'Fixture upstream bundle did not include receiving TD rate.',
        player_id: 'fixture-player-1',
      }),
    );
  });

  it('does not introduce artifact writer or IO exports', () => {
    expect(Object.keys(projectionArtifactContracts).sort()).not.toEqual(
      expect.arrayContaining([
        'writeProjectionArtifacts',
        'exportProjectionArtifacts',
        'saveProjectionArtifacts',
        'loadProjectionArtifacts',
      ]),
    );
  });
});
