import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PlayerOpportunityInput } from '../contracts/scoring.js';
import type { ProjectionInputCoverageArtifact } from '../contracts/projectionArtifacts.js';
import {
  tiberDataOptionalPlayerOpportunityFields,
  tiberDataRequiredPlayerOpportunityFields,
  type TiberDataProjectionInputBundle,
} from '../contracts/tiberDataProjectionInput.js';
import { serviceFailure, serviceSuccess, type ServiceResult, type ServiceWarning } from '../services/result.js';
import { runProjectionRehearsal } from './runProjectionRehearsal.js';

export interface RunTiberDataFixtureRehearsalInput {
  fixture_path: string;
  output_dir?: string;
  run_id?: string;
  generated_at?: string;
}

export interface TiberDataFixtureRehearsalSummary {
  run_id: string;
  generated_at: string;
  fixture_path: string;
  output_dir: string;
  player_count: number;
  mapped_players: number;
  skipped_players: number;
  warning_count: number;
  missing_field_count: number;
  written_artifacts: Array<{ artifact_type: string; path: string; row_count: number }>;
  warnings: ServiceWarning[];
}

const supportedPlayerFields = new Set<string>([
  ...tiberDataRequiredPlayerOpportunityFields,
  ...tiberDataOptionalPlayerOpportunityFields,
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deriveFixtureRunId = (fixturePath: string): string => {
  const stem = path.basename(fixturePath, path.extname(fixturePath));
  const weeklyMatch = /^weekly_projection_input_fixture_(\d{4})_w(\d{2})$/.exec(stem);
  if (weeklyMatch !== null) return `tiber-data-fixture-${weeklyMatch[1]}-w${weeklyMatch[2]}`;

  return `tiber-data-fixture-${stem.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
};

const readFixtureJson = async (fixturePath: string): Promise<ServiceResult<unknown>> => {
  if (typeof fixturePath !== 'string' || fixturePath.trim().length === 0) {
    return serviceFailure({ code: 'TIBER_DATA_FIXTURE_PATH_INVALID', message: 'fixture_path is required.' });
  }

  try {
    const contents = await readFile(fixturePath, 'utf8');
    return serviceSuccess(JSON.parse(contents) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return serviceFailure({
        code: 'TIBER_DATA_FIXTURE_JSON_INVALID',
        message: 'TIBER-Data fixture JSON could not be parsed.',
        details: { fixture_path: fixturePath, message: error.message },
      });
    }

    return serviceFailure({
      code: 'TIBER_DATA_FIXTURE_READ_FAILED',
      message: 'TIBER-Data fixture could not be read from the local filesystem.',
      details: error instanceof Error ? { fixture_path: fixturePath, name: error.name, message: error.message } : { fixture_path: fixturePath, error },
    });
  }
};

const unsupportedPlayerFields = (player: unknown): string[] => {
  if (!isRecord(player)) return [];
  return Object.keys(player).filter((field) => !supportedPlayerFields.has(field));
};

const stripUnsupportedPlayerFields = (player: unknown): unknown => {
  if (!isRecord(player)) return player;

  const stripped: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(player)) {
    if (supportedPlayerFields.has(field)) stripped[field] = value;
  }

  return stripped as unknown as PlayerOpportunityInput;
};

const collectUnsupportedPlayerFieldWarnings = (bundle: Record<string, unknown>): ServiceWarning[] => {
  const warnings: ServiceWarning[] = [];

  for (const collectionName of ['player_opportunities', 'comparison_pool'] as const) {
    const collection = bundle[collectionName];
    if (!Array.isArray(collection)) continue;

    const unsupportedFields = new Map<string, string[]>();
    collection.forEach((player, index) => {
      const fields = unsupportedPlayerFields(player);
      if (fields.length === 0) return;

      const playerId = isRecord(player) && typeof player.player_id === 'string' && player.player_id.trim().length > 0 ? player.player_id : `index:${index}`;
      unsupportedFields.set(playerId, fields);
    });

    if (unsupportedFields.size > 0) {
      warnings.push({
        code: 'TIBER_DATA_FIXTURE_PLAYER_FIELDS_IGNORED',
        message: `Unsupported ${collectionName} fields were omitted before scoring; no scoring math consumes them in this rehearsal.`,
        details: {
          collection: collectionName,
          fields_by_player: Object.fromEntries(unsupportedFields),
        },
      });
    }
  }

  return warnings;
};

const collectTopLevelContextWarnings = (bundle: Record<string, unknown>): ServiceWarning[] => {
  if (bundle.projection_context === undefined) return [];

  return [
    {
      code: 'TIBER_DATA_FIXTURE_PROJECTION_CONTEXT_IGNORED',
      message: 'projection_context is preserved in the fixture input but is not part of the current scoring contract, so it is not consumed for scoring.',
      details: { field: 'projection_context' },
    },
  ];
};

const sanitizeFixtureBundleForScoring = (fixture: unknown): { bundle: TiberDataProjectionInputBundle; warnings: ServiceWarning[] } => {
  if (!isRecord(fixture)) return { bundle: fixture as TiberDataProjectionInputBundle, warnings: [] };

  const warnings = [...collectTopLevelContextWarnings(fixture), ...collectUnsupportedPlayerFieldWarnings(fixture)];
  const sanitized: Record<string, unknown> = { ...fixture };

  if (Array.isArray(fixture.player_opportunities)) {
    sanitized.player_opportunities = fixture.player_opportunities.map(stripUnsupportedPlayerFields);
  }

  if (Array.isArray(fixture.comparison_pool)) {
    sanitized.comparison_pool = fixture.comparison_pool.map(stripUnsupportedPlayerFields);
  }

  sanitized.adapter_warnings = [...(Array.isArray(fixture.adapter_warnings) ? fixture.adapter_warnings : []), ...warnings];

  return { bundle: sanitized as unknown as TiberDataProjectionInputBundle, warnings };
};

const readCoverageArtifact = async (outputDir: string): Promise<ServiceResult<ProjectionInputCoverageArtifact>> => {
  try {
    const contents = await readFile(path.join(outputDir, 'projection-input-coverage.json'), 'utf8');
    return serviceSuccess(JSON.parse(contents) as ProjectionInputCoverageArtifact);
  } catch (error) {
    return serviceFailure({
      code: 'TIBER_DATA_FIXTURE_COVERAGE_READ_FAILED',
      message: 'Projection input coverage artifact could not be read after rehearsal.',
      details: error instanceof Error ? { name: error.name, message: error.message } : error,
    });
  }
};

export const runTiberDataFixtureRehearsal = async (
  input: RunTiberDataFixtureRehearsalInput,
): Promise<ServiceResult<TiberDataFixtureRehearsalSummary>> => {
  if (typeof input.fixture_path !== 'string' || input.fixture_path.trim().length === 0) {
    return serviceFailure({ code: 'TIBER_DATA_FIXTURE_PATH_INVALID', message: 'fixture_path is required.' });
  }

  const resolvedFixturePath = path.resolve(input.fixture_path);
  const fixtureResult = await readFixtureJson(resolvedFixturePath);
  if (!fixtureResult.ok) return fixtureResult;

  const { bundle } = sanitizeFixtureBundleForScoring(fixtureResult.data);
  const runId = input.run_id ?? deriveFixtureRunId(resolvedFixturePath);
  const generatedAt = input.generated_at ?? new Date().toISOString();
  const outputDir = input.output_dir ?? path.join('artifacts', 'rehearsal', runId);

  const rehearsalResult = await runProjectionRehearsal({
    bundle,
    output_dir: outputDir,
    run_id: runId,
    generated_at: generatedAt,
  });
  if (!rehearsalResult.ok) return rehearsalResult;

  const coverageResult = await readCoverageArtifact(rehearsalResult.data.output_dir);
  if (!coverageResult.ok) return serviceFailure(coverageResult.errors, rehearsalResult.warnings.concat(coverageResult.warnings));

  const summary: TiberDataFixtureRehearsalSummary = {
    run_id: rehearsalResult.data.run_id,
    generated_at: rehearsalResult.data.generated_at,
    fixture_path: resolvedFixturePath,
    output_dir: rehearsalResult.data.output_dir,
    player_count: coverageResult.data.total_players,
    mapped_players: rehearsalResult.data.mapped_players,
    skipped_players: rehearsalResult.data.skipped_players,
    warning_count: rehearsalResult.data.warnings.length,
    missing_field_count: coverageResult.data.missing_fields.length,
    written_artifacts: rehearsalResult.data.written_artifacts,
    warnings: rehearsalResult.data.warnings,
  };

  return serviceSuccess(summary, rehearsalResult.warnings);
};
