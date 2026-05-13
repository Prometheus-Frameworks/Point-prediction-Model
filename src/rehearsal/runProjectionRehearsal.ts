import path from 'node:path';
import { writeProjectionArtifacts, type WrittenProjectionArtifact } from '../artifacts/writeProjectionArtifacts.js';
import { toWeeklyScoringRequest } from '../adapters/tiberData/toWeeklyScoringRequest.js';
import {
  PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
  PROJECTION_RUN_MANIFEST_ARTIFACT_VERSION,
  WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
  type ProjectionInputCoverageArtifact,
  type ProjectionRunManifestArtifact,
  type ProjectionRunOutputRef,
  type WeeklyPlayerProjectionArtifactRow,
} from '../contracts/projectionArtifacts.js';
import type { LeagueContextInput, PlayerOpportunityInput, ScoredPlayerOutput } from '../contracts/scoring.js';
import type { TiberDataProjectionInputBundle } from '../contracts/tiberDataProjectionInput.js';
import { scoreWeeklyBatchService } from '../services/scoring/scoreWeeklyBatchService.js';
import { serviceFailure, serviceSuccess, type ServiceResult, type ServiceWarning } from '../services/result.js';
import { fixtureTiberDataProjectionBundle } from './fixtures/projectionRehearsalFixtures.js';

export interface RunProjectionRehearsalInput {
  bundle?: TiberDataProjectionInputBundle;
  league_context?: LeagueContextInput;
  output_dir?: string;
  run_id?: string;
  generated_at?: string;
}

export interface ProjectionRehearsalResult {
  run_id: string;
  generated_at: string;
  output_dir: string;
  mapped_players: number;
  skipped_players: number;
  written_artifacts: WrittenProjectionArtifact[];
  warnings: ServiceWarning[];
}

const DEFAULT_REHEARSAL_RUN_ID = 'fixture-projection-rehearsal-run-001';
const DEFAULT_REHEARSAL_GENERATED_AT = '2026-05-13T00:00:00.000Z';
const WEEKLY_SCORING_CONTRACT_VERSION = 'weekly-scoring-v1';

const artifactUri = (outputDir: string, filename: string): string => `file://${path.join(path.resolve(outputDir), filename)}`;

const buildOutputRefs = (runId: string, outputDir: string, weeklyRowCount: number): ProjectionRunOutputRef[] => [
  {
    artifact_id: `${runId}-weekly-player-projections`,
    artifact_type: 'weekly_player_projection',
    artifact_version: WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
    uri: artifactUri(outputDir, 'weekly-player-projections.jsonl'),
    row_count: weeklyRowCount,
  },
  {
    artifact_id: `${runId}-projection-input-coverage`,
    artifact_type: 'projection_input_coverage',
    artifact_version: PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
    uri: artifactUri(outputDir, 'projection-input-coverage.json'),
    row_count: 1,
  },
];

const findPlayerInput = (players: PlayerOpportunityInput[], scoredPlayer: ScoredPlayerOutput): PlayerOpportunityInput | undefined =>
  players.find((player) => player.player_id === scoredPlayer.player_id);

const buildWeeklyRows = (
  runId: string,
  bundle: TiberDataProjectionInputBundle,
  scoredPlayers: ScoredPlayerOutput[],
): WeeklyPlayerProjectionArtifactRow[] =>
  scoredPlayers.map((player) => {
    const playerInput = findPlayerInput(bundle.player_opportunities, player);

    return {
      artifact_type: 'weekly_player_projection',
      artifact_version: WEEKLY_PLAYER_PROJECTION_ARTIFACT_VERSION,
      run_id: runId,
      player_id: player.player_id,
      team: player.team,
      position: player.position,
      ...(playerInput?.season === undefined ? {} : { season: playerInput.season }),
      ...(playerInput?.week === undefined ? {} : { week: playerInput.week }),
      expected_points: player.expected_points,
      replacement_points: player.replacement_points,
      vorp: player.vorp,
      floor: player.floor,
      median: player.median,
      ceiling: player.ceiling,
      confidence_band: player.confidence_band,
      volatility_tag: player.volatility_tag,
      fragility_tag: player.fragility_tag,
      role_notes: player.role_notes,
      input_refs: {
        source_dataset_refs: bundle.source_dataset_refs,
        identity_ref: bundle.identity_ref,
        league_context_ref: {
          artifact_id: `${runId}-fixture-league-context`,
        },
        scoring_output_ref: {
          artifact_id: `${runId}-weekly-scoring-output`,
        },
      },
    };
  });

export const runProjectionRehearsal = async (
  input: RunProjectionRehearsalInput = {},
): Promise<ServiceResult<ProjectionRehearsalResult>> => {
  const runId = input.run_id ?? DEFAULT_REHEARSAL_RUN_ID;
  const generatedAt = input.generated_at ?? DEFAULT_REHEARSAL_GENERATED_AT;
  const outputDir = input.output_dir ?? path.join('artifacts', 'rehearsal', runId);
  const fixtureBundle = input.bundle ?? fixtureTiberDataProjectionBundle;
  const governedBundle: TiberDataProjectionInputBundle = {
    ...fixtureBundle,
    league_context: input.league_context ?? fixtureBundle.league_context,
  };

  const adapterResult = toWeeklyScoringRequest(governedBundle);
  if (!adapterResult.ok) return adapterResult;

  const scoringResult = scoreWeeklyBatchService(adapterResult.data.request);
  if (!scoringResult.ok) return scoringResult;

  const weeklyRows = buildWeeklyRows(runId, governedBundle, scoringResult.data.players);
  const mappedPlayers = adapterResult.data.report.player_count;
  const totalPlayers = governedBundle.player_opportunities.length;
  const skippedPlayers = Math.max(0, totalPlayers - mappedPlayers);
  const warnings = [...adapterResult.warnings, ...scoringResult.warnings];

  const projectionInputCoverage: ProjectionInputCoverageArtifact = {
    artifact_type: 'projection_input_coverage',
    artifact_version: PROJECTION_INPUT_COVERAGE_ARTIFACT_VERSION,
    run_id: runId,
    total_players: totalPlayers,
    mapped_players: mappedPlayers,
    skipped_players: skippedPlayers,
    missing_fields: adapterResult.data.report.missing_fields,
    adapter_warnings: adapterResult.data.report.warnings,
  };

  const manifest: ProjectionRunManifestArtifact = {
    artifact_type: 'projection_run_manifest',
    artifact_version: PROJECTION_RUN_MANIFEST_ARTIFACT_VERSION,
    generated_at: generatedAt,
    run_id: runId,
    input_contract_version: adapterResult.data.report.input_contract_version,
    scoring_contract_version: WEEKLY_SCORING_CONTRACT_VERSION,
    tiber_data_schema_version: adapterResult.data.report.tiber_data_schema_version,
    source_dataset_refs: adapterResult.data.report.source_dataset_refs,
    identity_ref: adapterResult.data.report.identity_ref,
    model_refs: [],
    outputs: buildOutputRefs(runId, outputDir, weeklyRows.length),
    warnings,
    missing_fields: adapterResult.data.report.missing_fields,
  };

  const writeResult = await writeProjectionArtifacts({
    output_dir: outputDir,
    manifest,
    weekly_player_projections: weeklyRows,
    projection_input_coverage: projectionInputCoverage,
  });
  if (!writeResult.ok) return serviceFailure(writeResult.errors, warnings.concat(writeResult.warnings));

  return serviceSuccess(
    {
      run_id: runId,
      generated_at: generatedAt,
      output_dir: writeResult.data.output_dir,
      mapped_players: mappedPlayers,
      skipped_players: skippedPlayers,
      written_artifacts: writeResult.data.written_artifacts,
      warnings,
    },
    warnings,
  );
};
