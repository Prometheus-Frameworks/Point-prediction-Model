import { describe, expect, it } from 'vitest';
import {
  assignActionTier,
  buildDecisionBoardService,
  buildDecisionReasons,
  buildDecisionTags,
  filterDecisionBoard,
  rankDecisionBoard,
  rankDecisionBoardService,
  sampleFeatureRows,
  scoreActionability,
  scoreCompositeSignal,
  scoreTrustworthiness,
  sortDecisionBoard,
  type DecisionBoardRow,
  type FusedProjection,
  type MarketEdgeOutput,
  type ProjectionDiagnosticOutput,
  type WrTeBaselinePrediction,
  type WrTeFeatureRow,
} from '../src/public/index.js';
import type { IntervalPrediction } from '../src/models_ml/types/uncertainty.js';

const makePrediction = (row: WrTeFeatureRow, pointPrediction: number, intervalWidth90: number): WrTeBaselinePrediction => ({
  rowId: row.scenario_id,
  playerId: row.player_id,
  playerName: row.player_name,
  position: row.player_position,
  predictedPpr: pointPrediction,
  pointPrediction,
  lower50: pointPrediction - Math.max(1.2, intervalWidth90 * 0.18),
  upper50: pointPrediction + Math.max(1.2, intervalWidth90 * 0.18),
  lower80: pointPrediction - Math.max(2.1, intervalWidth90 * 0.3),
  upper80: pointPrediction + Math.max(2.1, intervalWidth90 * 0.3),
  lower90: pointPrediction - intervalWidth90 / 2,
  upper90: pointPrediction + intervalWidth90 / 2,
  uncertaintyBucket: 'decision-board-test',
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
  regressionDownScore: 10,
  stickinessScore: 60,
  fragilityScore: 20,
  intervalWidth90: prediction.upper90 - prediction.lower90,
  intervalWidth80: prediction.upper80 - prediction.lower80,
  componentScores: {
    usageProductionGap: { score: 14, direction: 'up', usageComposite: 64, productionComposite: 54, gap: 10 },
    efficiencyFragility: { score: 3, direction: 'neutral', efficiencyComposite: 56, roleSupportComposite: 55, fragilityGap: 1 },
    tdRegressionRisk: { upScore: 15, downScore: 11, tdRate: 0.05, redZoneShare: 0.18, projectedTdPointsShare: 0.16 },
    volumeStability: { stabilityScore: 60, fragilityScore: 20, volumeComposite: 62, volatilityComposite: 40 },
    projectionStickiness: { stickinessScore: 60, fragilityScore: 20, intervalWidth: prediction.upper90 - prediction.lower90, contextualInstability: 28 },
  },
  flags: [],
  explanationBullets: [],
  ...overrides,
});

const makeIntervals = (prediction: WrTeBaselinePrediction, pointPrediction: number, intervalWidth90: number): IntervalPrediction => ({
  pointPrediction,
  lower50: pointPrediction - Math.max(1.3, intervalWidth90 * 0.18),
  upper50: pointPrediction + Math.max(1.3, intervalWidth90 * 0.18),
  lower80: pointPrediction - Math.max(2.2, intervalWidth90 * 0.3),
  upper80: pointPrediction + Math.max(2.2, intervalWidth90 * 0.3),
  lower90: pointPrediction - intervalWidth90 / 2,
  upper90: pointPrediction + intervalWidth90 / 2,
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
    diagnostics?: Partial<ProjectionDiagnosticOutput>;
    fusionConfidenceScore?: number;
  },
): FusedProjection => {
  const baselinePrediction = makePrediction(row, options.baselinePointPrediction, Math.max(6.8, options.intervalWidth90 - 1));
  const fusedPrediction = makePrediction(row, options.fusedPointPrediction, options.intervalWidth90);
  const baselineDiagnostics = makeDiagnostics(row, baselinePrediction);
  const fusedDiagnostics = makeDiagnostics(row, fusedPrediction, options.diagnostics);
  const baseTargets = row.usage_targets_pg_season;

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
    fusedIntervals: makeIntervals(baselinePrediction, options.fusedPointPrediction, options.intervalWidth90),
    baselinePrediction,
    scenarioResult: {
      scenarioId: row.scenario_id,
      scenarioTitle: row.projection_label,
      scenarioDescription: `${row.player_name} decision board test scenario.`,
      scenarioTags: ['decision-board'],
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
        quarterback: 'Test QB',
        targetCompetitionIndex: row.team_target_competition_index,
        qbEfficiencyIndex: row.team_qb_efficiency_index,
        passTdEnvironmentIndex: 100,
        playVolumeIndex: row.team_play_volume_index,
        passRateIndex: 100,
      },
      currentTeam: {
        team: row.player_team,
        quarterback: 'Test QB',
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
          description: `${row.player_name} event overlay.`,
          effectiveWeek: row.week,
          severity: row.event_severity,
          clarity: row.event_clarity,
        },
      eventType: row.event_type === 'NONE' ? undefined : row.event_type,
      baseline: {
        targetsPerGame: baseTargets,
        receptionsPerGame: baseTargets * row.efficiency_catch_rate_trailing5,
        yardsPerGame: baseTargets * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: baseTargets * row.efficiency_td_per_target_trailing5,
        rushPointsPerGame: 0,
        pprPointsPerGame: options.baselinePointPrediction,
      },
      adjusted: {
        targetsPerGame: baseTargets + options.appliedDelta * 0.4,
        receptionsPerGame: (baseTargets + options.appliedDelta * 0.4) * row.efficiency_catch_rate_trailing5,
        yardsPerGame: (baseTargets + options.appliedDelta * 0.4) * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: Math.max(0.05, (baseTargets + options.appliedDelta * 0.4) * row.efficiency_td_per_target_trailing5),
        rushPointsPerGame: 0,
        pprPointsPerGame: options.fusedPointPrediction,
      },
      delta: {
        targetsPerGame: options.appliedDelta * 0.4,
        receptionsPerGame: options.appliedDelta * 0.4 * row.efficiency_catch_rate_trailing5,
        yardsPerGame: options.appliedDelta * 0.4 * row.efficiency_yards_per_target_trailing5,
        tdsPerGame: options.appliedDelta * 0.4 * row.efficiency_td_per_target_trailing5,
        rushPointsPerGame: 0,
        pprPointsPerGame: options.fusedPointPrediction - options.baselinePointPrediction,
      },
      deltaPprPointsPerGame: options.fusedPointPrediction - options.baselinePointPrediction,
      confidenceScore: 74,
      confidenceBand: 'MEDIUM',
      explanation: ['Decision board test scenario result.'],
    },
    fusionPolicy: 'weighted-fusion-v1',
    fusionConfidence: {
      score: options.fusionConfidenceScore ?? 76,
      band: 'MEDIUM',
      eventConfidenceWeight: 0.76,
      eventUncertainty: 0.24,
      boundedDelta: false,
      rationale: ['Decision board test confidence.'],
    },
    diagnostics: {
      baseline: baselineDiagnostics,
      fused: fusedDiagnostics,
      notes: ['Decision board test diagnostics.'],
    },
    notes: ['Decision board test fused projection.'],
  };
};

const makeMarketEdge = (
  row: WrTeFeatureRow,
  modelPoints: number,
  consensusPoints: number,
  trustAdjustedEdgeScore: number,
): MarketEdgeOutput => ({
  rowId: row.scenario_id,
  playerId: row.player_id,
  playerName: row.player_name,
  source: 'decision-board-test',
  consensusPoints,
  consensusRank: 0,
  timestamp: '2026-03-19T00:00:00.000Z',
  modelPoints,
  rawDelta: modelPoints - consensusPoints,
  rawEdgeScore: trustAdjustedEdgeScore,
  edgeDirection: modelPoints > consensusPoints ? 'above_market' : modelPoints < consensusPoints ? 'below_market' : 'in_line',
  trustAdjustedEdgeScore,
  flags: [],
  explanation: [],
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
});

const strongUpsideInput = {
  row: sampleFeatureRows.stableVeteranWr,
  fusedProjection: makeFusedProjection(sampleFeatureRows.stableVeteranWr, {
    baselinePointPrediction: 16.8,
    fusedPointPrediction: 19.5,
    scenarioDelta: 2.9,
    appliedDelta: 2.7,
    intervalWidth90: 8.1,
    diagnostics: { regressionUpScore: 34, regressionDownScore: 8, stickinessScore: 72, fragilityScore: 18 },
    fusionConfidenceScore: 86,
  }),
  marketEdge: makeMarketEdge(sampleFeatureRows.stableVeteranWr, 19.5, 16.2, 24),
};
strongUpsideInput.fusedProjection.diagnostics.fused = makeDiagnostics(
  strongUpsideInput.row,
  makePrediction(strongUpsideInput.row, 19.5, 8.1),
  { regressionUpScore: 34, regressionDownScore: 8, stickinessScore: 72, fragilityScore: 18 },
);

const uncertaintyInput = {
  row: sampleFeatureRows.teammateInjuryBeneficiary,
  fusedProjection: makeFusedProjection(sampleFeatureRows.teammateInjuryBeneficiary, {
    baselinePointPrediction: 14.6,
    fusedPointPrediction: 16.2,
    scenarioDelta: 2.1,
    appliedDelta: 1.6,
    intervalWidth90: 14.6,
    diagnostics: { regressionUpScore: 29, regressionDownScore: 14, stickinessScore: 49, fragilityScore: 42, flags: ['INTERVAL_WIDE_HIGH_UNCERTAINTY'] },
    fusionConfidenceScore: 60,
  }),
  marketEdge: makeMarketEdge(sampleFeatureRows.teammateInjuryBeneficiary, 16.2, 14.1, 14),
};

const downsideInput = {
  row: sampleFeatureRows.volatileTe,
  fusedProjection: makeFusedProjection(sampleFeatureRows.volatileTe, {
    baselinePointPrediction: 12.4,
    fusedPointPrediction: 10.1,
    scenarioDelta: -2.3,
    appliedDelta: -2.3,
    intervalWidth90: 11.2,
    diagnostics: { regressionUpScore: 9, regressionDownScore: 38, stickinessScore: 32, fragilityScore: 63, flags: ['EFFICIENCY_AHEAD_OF_ROLE'] },
    fusionConfidenceScore: 54,
  }),
  marketEdge: makeMarketEdge(sampleFeatureRows.volatileTe, 10.1, 12.8, -22),
};

const neutralInput = {
  row: sampleFeatureRows.rookieWr,
  fusedProjection: makeFusedProjection(sampleFeatureRows.rookieWr, {
    baselinePointPrediction: 11.8,
    fusedPointPrediction: 12,
    scenarioDelta: 0.2,
    appliedDelta: 0.2,
    intervalWidth90: 13.5,
    diagnostics: { regressionUpScore: 16, regressionDownScore: 15, stickinessScore: 31, fragilityScore: 46, flags: ['INTERVAL_WIDE_HIGH_UNCERTAINTY'] },
    fusionConfidenceScore: 45,
  }),
  marketEdge: makeMarketEdge(sampleFeatureRows.rookieWr, 12, 11.9, 2),
};

const eventCautionInput = {
  row: sampleFeatureRows.tradedWr,
  fusedProjection: makeFusedProjection(sampleFeatureRows.tradedWr, {
    baselinePointPrediction: 13.1,
    fusedPointPrediction: 15.1,
    scenarioDelta: 2.7,
    appliedDelta: 2,
    intervalWidth90: 13.8,
    diagnostics: { regressionUpScore: 25, regressionDownScore: 18, stickinessScore: 44, fragilityScore: 49, flags: ['PROJECTION_FRAGILE_EVENT_DRIVEN'] },
    fusionConfidenceScore: 58,
  }),
  marketEdge: makeMarketEdge(sampleFeatureRows.tradedWr, 15.1, 13.3, 16),
};

describe('decision board layer', () => {
  it('scores composite strength and direction from fused, regression, and market signals', () => {
    const strong = scoreCompositeSignal({
      row: strongUpsideInput.row,
      diagnostics: strongUpsideInput.fusedProjection.diagnostics.fused,
      fusedProjection: strongUpsideInput.fusedProjection,
      marketEdge: strongUpsideInput.marketEdge,
    });
    const downside = scoreCompositeSignal({
      row: downsideInput.row,
      diagnostics: downsideInput.fusedProjection.diagnostics.fused,
      fusedProjection: downsideInput.fusedProjection,
      marketEdge: downsideInput.marketEdge,
    });
    const neutral = scoreCompositeSignal({
      row: neutralInput.row,
      diagnostics: neutralInput.fusedProjection.diagnostics.fused,
      fusedProjection: neutralInput.fusedProjection,
      marketEdge: neutralInput.marketEdge,
    });

    expect(strong.score).toBeGreaterThan(75);
    expect(strong.direction).toBe('UPSIDE');
    expect(downside.score).toBeGreaterThan(55);
    expect(downside.direction).toBe('DOWNSIDE');
    expect(neutral.direction).toBe('NEUTRAL');
  });

  it('penalizes trustworthiness for wide intervals and fragility', () => {
    const strong = scoreTrustworthiness({
      row: strongUpsideInput.row,
      diagnostics: strongUpsideInput.fusedProjection.diagnostics.fused,
      fusedProjection: strongUpsideInput.fusedProjection,
      marketEdge: strongUpsideInput.marketEdge,
    });
    const weak = scoreTrustworthiness({
      row: uncertaintyInput.row,
      diagnostics: uncertaintyInput.fusedProjection.diagnostics.fused,
      fusedProjection: uncertaintyInput.fusedProjection,
      marketEdge: uncertaintyInput.marketEdge,
    });

    expect(strong.score).toBeGreaterThan(70);
    expect(weak.score).toBeLessThan(strong.score);
    expect(weak.breakdown.intervalPenalty).toBeGreaterThan(0);
    expect(weak.breakdown.fragilityPenalty).toBeGreaterThan(0);
  });

  it('scores actionability from signal magnitude plus confidence and assigns tiers', () => {
    const strongComposite = scoreCompositeSignal({
      row: strongUpsideInput.row,
      diagnostics: strongUpsideInput.fusedProjection.diagnostics.fused,
      fusedProjection: strongUpsideInput.fusedProjection,
      marketEdge: strongUpsideInput.marketEdge,
    });
    const strongTrust = scoreTrustworthiness({
      row: strongUpsideInput.row,
      diagnostics: strongUpsideInput.fusedProjection.diagnostics.fused,
      fusedProjection: strongUpsideInput.fusedProjection,
      marketEdge: strongUpsideInput.marketEdge,
    });
    const elite = scoreActionability({
      compositeSignalScore: strongComposite.score,
      trustworthinessScore: strongTrust.score,
      direction: strongComposite.direction,
      marketEdgeScore: strongUpsideInput.marketEdge.trustAdjustedEdgeScore,
      intervalWidth90: strongUpsideInput.fusedProjection.diagnostics.fused.intervalWidth90,
    });

    const neutralActionability = scoreActionability({
      compositeSignalScore: 32,
      trustworthinessScore: 28,
      direction: 'NEUTRAL',
      marketEdgeScore: 1.5,
      intervalWidth90: 14,
    });

    expect(elite.score).toBeGreaterThan(75);
    expect(elite.tier).toBe('ELITE_SIGNAL');
    expect(neutralActionability.tier).toBe('PASS');
    expect(assignActionTier(66, 58, 62, 'UPSIDE')).toBe('STRONG_SIGNAL');
  });

  it('builds deterministic tags and reasons', () => {
    const boardResult = buildDecisionBoardService({
      fusedProjections: [strongUpsideInput.fusedProjection, eventCautionInput.fusedProjection],
      marketEdges: [strongUpsideInput.marketEdge, eventCautionInput.marketEdge],
      generatedAt: '2026-03-19T00:00:00.000Z',
    });

    expect(boardResult.ok).toBe(true);
    if (!boardResult.ok) {
      return;
    }

    const strong = boardResult.data.rows.find((row) => row.rowId === strongUpsideInput.row.scenario_id);
    const caution = boardResult.data.rows.find((row) => row.rowId === eventCautionInput.row.scenario_id);

    expect(strong?.decisionTags).toEqual(expect.arrayContaining([
      'HIGH_CONFIDENCE_UPSIDE',
      'USAGE_BACKED_EDGE',
      'MARKET_DISAGREEMENT_STRONG',
      'STICKY_ROLE_SUPPORT',
    ]));
    expect(caution?.decisionTags).toContain('EVENT_BOOST_WITH_CAUTION');

    expect(strong?.decisionReasons[0]).toContain('UPSIDE signal');
    expect(strong?.decisionReasons.join(' ')).toContain('Market edge');
  });

  it('sorts, filters, and ranks batch boards deterministically', () => {
    const result = buildDecisionBoardService({
      fusedProjections: [
        strongUpsideInput.fusedProjection,
        uncertaintyInput.fusedProjection,
        downsideInput.fusedProjection,
        neutralInput.fusedProjection,
        eventCautionInput.fusedProjection,
      ],
      marketEdges: [
        strongUpsideInput.marketEdge,
        uncertaintyInput.marketEdge,
        downsideInput.marketEdge,
        neutralInput.marketEdge,
        eventCautionInput.marketEdge,
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const sorted = sortDecisionBoard(result.data.rows);
    expect(sorted[0]?.rowId).toBe(strongUpsideInput.row.scenario_id);

    const upsideOnly = filterDecisionBoard(result.data.rows, {
      directions: ['UPSIDE'],
      minimumActionabilityScore: 45,
    });
    expect(upsideOnly.every((row) => row.direction === 'UPSIDE')).toBe(true);

    const ranked = rankDecisionBoard(result.data.rows, { excludeTags: ['LOW_ACTIONABILITY_NOISE'] });
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked.at(-1)?.decisionTags).not.toContain('LOW_ACTIONABILITY_NOISE');
  });

  it('wraps build and rank outputs in service envelopes', () => {
    const boardResult = buildDecisionBoardService({
      fusedProjections: [strongUpsideInput.fusedProjection, downsideInput.fusedProjection, neutralInput.fusedProjection],
      marketEdges: [strongUpsideInput.marketEdge, downsideInput.marketEdge],
      generatedAt: '2026-03-19T00:00:00.000Z',
    });

    expect(boardResult.ok).toBe(true);
    if (!boardResult.ok) {
      return;
    }

    expect(boardResult.data.rows).toHaveLength(3);
    expect(boardResult.data.unmatchedFusedProjectionRowIds).toContain(neutralInput.row.scenario_id);
    expect(boardResult.data.generatedAt).toBe('2026-03-19T00:00:00.000Z');

    const rankResult = rankDecisionBoardService(boardResult.data.rows, {
      directions: ['UPSIDE', 'DOWNSIDE'],
      generatedAt: '2026-03-19T00:00:00.000Z',
    });

    expect(rankResult.ok).toBe(true);
    if (!rankResult.ok) {
      return;
    }

    expect(rankResult.data.rows[0]?.rank).toBe(1);
    expect(rankResult.data.rows.some((row) => row.direction === 'NEUTRAL')).toBe(false);
    expect(rankResult.data.generatedAt).toBe('2026-03-19T00:00:00.000Z');
  });
});
