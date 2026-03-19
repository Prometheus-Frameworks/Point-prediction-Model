import { buildDecisionBoardService } from '../../services/buildDecisionBoardService.js';
import { rankDecisionBoardService } from '../../services/rankDecisionBoardService.js';
import { sampleFeatureRows } from '../../features/examples/sampleFeatureRows.js';
import type { ProjectionDiagnosticOutput } from '../../diagnostics/types/diagnosticOutput.js';
import type { WrTeFeatureRow } from '../../features/types/featureRow.js';
import type { FusedProjection } from '../../fusion/types/fusedProjection.js';
import type { MarketEdgeOutput, MarketProjectionInput } from '../../market/types/edgeOutput.js';
import type { WrTeBaselinePrediction } from '../../models_ml/types/prediction.js';
import type { IntervalPrediction } from '../../models_ml/types/uncertainty.js';

const makePrediction = (row: WrTeFeatureRow, pointPrediction: number, intervalWidth90: number): WrTeBaselinePrediction => ({
  rowId: row.scenario_id,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.player_position,
  predictedPpr: pointPrediction,
  pointPrediction,
  lower50: pointPrediction - Math.max(1.4, intervalWidth90 * 0.18),
  upper50: pointPrediction + Math.max(1.4, intervalWidth90 * 0.18),
  lower80: pointPrediction - Math.max(2.2, intervalWidth90 * 0.3),
  upper80: pointPrediction + Math.max(2.2, intervalWidth90 * 0.3),
  lower90: pointPrediction - intervalWidth90 / 2,
  upper90: pointPrediction + intervalWidth90 / 2,
  uncertaintyBucket: 'decision-board-example',
  intervalMethod: 'residual-empirical-v1',
});

const makeDiagnostics = (
  row: WrTeFeatureRow,
  prediction: WrTeBaselinePrediction,
  overrides: Partial<ProjectionDiagnosticOutput> = {},
): ProjectionDiagnosticOutput => ({
  row,
  prediction,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.player_position,
  scenarioId: row.scenario_id,
  regressionUpScore: 24,
  regressionDownScore: 12,
  stickinessScore: 58,
  fragilityScore: 24,
  intervalWidth90: prediction.upper90 - prediction.lower90,
  intervalWidth80: prediction.upper80 - prediction.lower80,
  componentScores: {
    usageProductionGap: { score: 14, direction: 'up', usageComposite: 63, productionComposite: 53, gap: 10 },
    efficiencyFragility: { score: 4, direction: 'neutral', efficiencyComposite: 55, roleSupportComposite: 54, fragilityGap: 1 },
    tdRegressionRisk: { upScore: 16, downScore: 10, tdRate: 0.05, redZoneShare: 0.18, projectedTdPointsShare: 0.15 },
    volumeStability: { stabilityScore: 58, fragilityScore: 24, volumeComposite: 60, volatilityComposite: 42 },
    projectionStickiness: { stickinessScore: 58, fragilityScore: 24, intervalWidth: prediction.upper90 - prediction.lower90, contextualInstability: 30 },
  },
  flags: [],
  explanationBullets: [],
  ...overrides,
});

const makeFusedIntervals = (
  prediction: WrTeBaselinePrediction,
  fusedPointPrediction: number,
  width90: number,
): IntervalPrediction => ({
  pointPrediction: fusedPointPrediction,
  lower50: fusedPointPrediction - Math.max(1.5, width90 * 0.18),
  upper50: fusedPointPrediction + Math.max(1.5, width90 * 0.18),
  lower80: fusedPointPrediction - Math.max(2.3, width90 * 0.3),
  upper80: fusedPointPrediction + Math.max(2.3, width90 * 0.3),
  lower90: fusedPointPrediction - width90 / 2,
  upper90: fusedPointPrediction + width90 / 2,
  uncertaintyBucket: prediction.uncertaintyBucket,
  intervalMethod: prediction.intervalMethod,
});

const makeFusedProjection = (
  row: WrTeFeatureRow,
  options: {
    baselinePointPrediction: number;
    fusedPointPrediction: number;
    scenarioDelta: number;
    appliedDelta: number;
    intervalWidth90: number;
    diagnostics: Partial<ProjectionDiagnosticOutput>;
    fusionConfidenceScore?: number;
  },
): FusedProjection => {
  const baselinePrediction = makePrediction(row, options.baselinePointPrediction, Math.max(7, options.intervalWidth90 - 1));
  const baselineDiagnostics = makeDiagnostics(row, baselinePrediction);
  const fusedDiagnostics = makeDiagnostics(row, makePrediction(row, options.fusedPointPrediction, options.intervalWidth90), options.diagnostics);

  return {
    rowId: row.scenario_id,
    scenarioId: row.scenario_id,
    playerId: row.player_id,
    playerName: row.player_name,
    position: row.player_position,
    eventType: row.event_type === 'NONE' ? undefined : row.event_type,
    baselinePointPrediction: options.baselinePointPrediction,
    scenarioDelta: options.scenarioDelta,
    appliedDelta: options.appliedDelta,
    fusedPointPrediction: options.fusedPointPrediction,
    baselineIntervals: baselinePrediction,
    fusedIntervals: makeFusedIntervals(baselinePrediction, options.fusedPointPrediction, options.intervalWidth90),
    baselinePrediction,
    scenarioResult: {
      scenarioId: row.scenario_id,
      scenarioTitle: row.projection_label,
      scenarioDescription: `${row.player_name} decision-board example.`,
      scenarioTags: ['decision-board', row.player_position.toLowerCase()],
      eventType: row.event_type === 'NONE' ? undefined : row.event_type,
      confidenceBand: 'MEDIUM',
      confidenceScore: 72,
      player: {
        id: row.player_id,
        name: row.player_name,
        position: row.player_position,
        team: row.player_team,
        sampleSizeGames: row.player_games_season,
        routesPerGame: row.usage_routes_pg_season,
        targetsPerRouteRun: row.usage_tprr_trailing5,
        catchRate: row.efficiency_catch_rate_trailing5,
        yardsPerTarget: row.efficiency_yards_per_target_trailing5,
        tdPerTarget: row.efficiency_td_per_target_trailing5,
        rushPointsPerGame: 0,
      },
      priorTeam: {
        team: row.player_team,
        quarterback: 'Sample QB',
        targetCompetitionIndex: row.team_target_competition_index,
        qbEfficiencyIndex: row.team_qb_efficiency_index,
        passTdEnvironmentIndex: 100,
        playVolumeIndex: row.team_play_volume_index,
        passRateIndex: 100,
      },
      currentTeam: {
        team: row.player_team,
        quarterback: 'Sample QB',
        targetCompetitionIndex: Math.max(1, row.team_target_competition_index - Math.round(options.appliedDelta * 2)),
        qbEfficiencyIndex: row.team_qb_efficiency_index,
        passTdEnvironmentIndex: 101,
        playVolumeIndex: row.team_play_volume_index,
        passRateIndex: 101,
      },
      event: row.event_type === 'NONE'
        ? undefined
        : {
          type: row.event_type,
          description: `${row.player_name} sample event.`,
          effectiveWeek: row.week,
          severity: row.event_severity,
          clarity: row.event_clarity,
        },
      baseline: {
        targetsPerGame: row.usage_targets_pg_season,
        receptionsPerGame: row.usage_targets_pg_season * row.efficiency_catch_rate_trailing5,
        yardsPerGame: row.usage_targets_pg_season * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: row.usage_targets_pg_season * row.efficiency_td_per_target_trailing5,
        rushPointsPerGame: 0,
        pprPointsPerGame: options.baselinePointPrediction,
      },
      adjusted: {
        targetsPerGame: row.usage_targets_pg_season + options.appliedDelta * 0.35,
        receptionsPerGame: (row.usage_targets_pg_season + options.appliedDelta * 0.35) * row.efficiency_catch_rate_trailing5,
        yardsPerGame: (row.usage_targets_pg_season + options.appliedDelta * 0.35) * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: Math.max(0.04, (row.usage_targets_pg_season + options.appliedDelta * 0.35) * row.efficiency_td_per_target_trailing5),
        rushPointsPerGame: 0,
        pprPointsPerGame: options.fusedPointPrediction,
      },
      delta: {
        targetsPerGame: options.appliedDelta * 0.35,
        receptionsPerGame: options.appliedDelta * 0.35 * row.efficiency_catch_rate_trailing5,
        yardsPerGame: options.appliedDelta * 0.35 * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: options.appliedDelta * 0.35 * row.efficiency_td_per_target_trailing5,
        rushPointsPerGame: 0,
        pprPointsPerGame: options.fusedPointPrediction - options.baselinePointPrediction,
      },
      deltaPprPointsPerGame: options.fusedPointPrediction - options.baselinePointPrediction,
      explanation: ['Decision-board sample scenario result.'],
    },
    fusionPolicy: 'weighted-fusion-v1',
    fusionConfidence: {
      score: options.fusionConfidenceScore ?? 72,
      band: 'MEDIUM',
      eventConfidenceWeight: 0.72,
      eventUncertainty: 0.28,
      boundedDelta: false,
      rationale: ['Example fusion confidence for decision-board docs and tests.'],
    },
    diagnostics: {
      baseline: baselineDiagnostics,
      fused: fusedDiagnostics,
      notes: ['Decision-board sample diagnostics.'],
    },
    notes: ['Decision-board sample projection.'],
  };
};

const makeMarketEdge = (
  row: WrTeFeatureRow,
  modelPoints: number,
  consensusPoints: number,
  trustAdjustedEdgeScore: number,
): MarketEdgeOutput => {
  const projection: MarketProjectionInput = {
    rowId: row.scenario_id,
    playerId: row.player_id,
    playerName: row.player_name,
    modelPoints,
    row,
  };

  return {
    rowId: row.scenario_id,
    playerId: row.player_id,
    playerName: row.player_name,
    source: 'sample-market',
    consensusPoints,
    consensusRank: 0,
    timestamp: '2026-03-19T00:00:00.000Z',
    modelPoints: projection.modelPoints,
    rawDelta: modelPoints - consensusPoints,
    rawEdgeScore: trustAdjustedEdgeScore,
    edgeDirection: modelPoints > consensusPoints ? 'above_market' : modelPoints < consensusPoints ? 'below_market' : 'in_line',
    trustAdjustedEdgeScore,
    flags: [],
    explanation: ['Decision-board sample edge explanation.'],
    trustAdjustment: {
      intervalWidth90: 8,
      intervalWidthPenalty: 0,
      fragilityPenalty: 0,
      eventUncertaintyPenalty: 0,
      calibrationPenalty: 0,
      subgroupPenalty: 0,
      totalPenalty: 0,
      confidenceMultiplier: 0.92,
      matchedSubgroups: ['position:wr'],
    },
  };
};

const strongUpside = makeFusedProjection(sampleFeatureRows.stableVeteranWr, {
  baselinePointPrediction: 16.9,
  fusedPointPrediction: 19.4,
  scenarioDelta: 2.7,
  appliedDelta: 2.5,
  intervalWidth90: 8.2,
  diagnostics: { regressionUpScore: 31, regressionDownScore: 9, stickinessScore: 71, fragilityScore: 19 },
  fusionConfidenceScore: 84,
});

const uncertaintyDowngrade = makeFusedProjection(sampleFeatureRows.teammateInjuryBeneficiary, {
  baselinePointPrediction: 14.7,
  fusedPointPrediction: 16.2,
  scenarioDelta: 2.4,
  appliedDelta: 1.5,
  intervalWidth90: 14.4,
  diagnostics: { regressionUpScore: 28, regressionDownScore: 14, stickinessScore: 50, fragilityScore: 42, flags: ['INTERVAL_WIDE_HIGH_UNCERTAINTY'] },
  fusionConfidenceScore: 61,
});

const downsideWarning = makeFusedProjection(sampleFeatureRows.volatileTe, {
  baselinePointPrediction: 12.4,
  fusedPointPrediction: 10.3,
  scenarioDelta: -2.1,
  appliedDelta: -2.1,
  intervalWidth90: 11.4,
  diagnostics: { regressionUpScore: 10, regressionDownScore: 37, stickinessScore: 34, fragilityScore: 61, flags: ['EFFICIENCY_AHEAD_OF_ROLE'] },
  fusionConfidenceScore: 55,
});

const neutralPass = makeFusedProjection(sampleFeatureRows.rookieWr, {
  baselinePointPrediction: 11.8,
  fusedPointPrediction: 12,
  scenarioDelta: 0.2,
  appliedDelta: 0.2,
  intervalWidth90: 13.2,
  diagnostics: { regressionUpScore: 16, regressionDownScore: 14, stickinessScore: 32, fragilityScore: 45, flags: ['INTERVAL_WIDE_HIGH_UNCERTAINTY'] },
  fusionConfidenceScore: 46,
});

const eventDrivenCaution = makeFusedProjection(sampleFeatureRows.tradedWr, {
  baselinePointPrediction: 13.1,
  fusedPointPrediction: 15.1,
  scenarioDelta: 2.8,
  appliedDelta: 2,
  intervalWidth90: 13.8,
  diagnostics: { regressionUpScore: 24, regressionDownScore: 18, stickinessScore: 44, fragilityScore: 49, flags: ['PROJECTION_FRAGILE_EVENT_DRIVEN'] },
  fusionConfidenceScore: 58,
});

const decisionBoardResult = buildDecisionBoardService({
  fusedProjections: [
    strongUpside,
    uncertaintyDowngrade,
    downsideWarning,
    neutralPass,
    eventDrivenCaution,
  ],
  marketEdges: [
    makeMarketEdge(sampleFeatureRows.stableVeteranWr, 19.4, 16.2, 24),
    makeMarketEdge(sampleFeatureRows.teammateInjuryBeneficiary, 16.2, 14.1, 14),
    makeMarketEdge(sampleFeatureRows.volatileTe, 10.3, 12.8, -22),
    makeMarketEdge(sampleFeatureRows.rookieWr, 12, 11.9, 2),
    makeMarketEdge(sampleFeatureRows.tradedWr, 15.1, 13.4, 16),
  ],
  generatedAt: '2026-03-19T00:00:00.000Z',
});

export const sampleDecisionBoardRun = decisionBoardResult.ok
  ? rankDecisionBoardService(decisionBoardResult.data.rows, { generatedAt: decisionBoardResult.data.generatedAt })
  : decisionBoardResult;
