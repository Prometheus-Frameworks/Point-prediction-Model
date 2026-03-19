import { describe, expect, it } from 'vitest';
import {
  buildEdgeExplanation,
  buildEdgeFlags,
  compareProjectionToConsensusService,
  compareToConsensus,
  deriveEdgeDirection,
  sampleFeatureRows,
  scoreMarketEdgesService,
  scoreTrustAdjustedEdge,
  type CalibrationReport,
  type ConsensusInput,
  type MarketEdgeOutput,
  type MarketProjectionInput,
  type ProjectionDiagnosticOutput,
  type SubgroupStabilityReport,
  type WrTeBaselinePrediction,
} from '../src/public/index.js';

const buildPrediction = (projection: MarketProjectionInput, intervalWidth90: number): WrTeBaselinePrediction => ({
  rowId: projection.rowId,
  playerId: projection.playerId,
  playerName: projection.playerName,
  position: projection.row?.player_position ?? 'WR',
  predictedPpr: projection.modelPoints,
  pointPrediction: projection.modelPoints,
  lower50: projection.modelPoints - Math.max(1.2, intervalWidth90 * 0.18),
  upper50: projection.modelPoints + Math.max(1.2, intervalWidth90 * 0.18),
  lower80: projection.modelPoints - Math.max(2.1, intervalWidth90 * 0.3),
  upper80: projection.modelPoints + Math.max(2.1, intervalWidth90 * 0.3),
  lower90: projection.modelPoints - intervalWidth90 / 2,
  upper90: projection.modelPoints + intervalWidth90 / 2,
  uncertaintyBucket: 'global',
  intervalMethod: 'residual-empirical-v1',
});

const buildDiagnostics = (
  projection: MarketProjectionInput,
  overrides: Partial<ProjectionDiagnosticOutput> = {},
): ProjectionDiagnosticOutput => ({
  row: projection.row ?? sampleFeatureRows.stableVeteranWr,
  prediction: projection.prediction ?? buildPrediction(projection, 8),
  playerId: projection.playerId,
  playerName: projection.playerName,
  position: projection.row?.player_position ?? 'WR',
  scenarioId: projection.rowId,
  regressionUpScore: 24,
  regressionDownScore: 12,
  stickinessScore: 58,
  fragilityScore: 22,
  intervalWidth90: 8,
  intervalWidth80: 5.4,
  componentScores: {
    usageProductionGap: { score: 12, direction: 'up', usageComposite: 61, productionComposite: 52, gap: 9 },
    efficiencyFragility: { score: 3, direction: 'neutral', efficiencyComposite: 56, roleSupportComposite: 55, fragilityGap: 1 },
    tdRegressionRisk: { upScore: 18, downScore: 16, tdRate: 0.05, redZoneShare: 0.19, projectedTdPointsShare: 0.18 },
    volumeStability: { stabilityScore: 58, fragilityScore: 22, volumeComposite: 60, volatilityComposite: 42 },
    projectionStickiness: { stickinessScore: 58, fragilityScore: 22, intervalWidth: 8, contextualInstability: 31 },
  },
  flags: [],
  explanationBullets: [],
  ...overrides,
});

const weakCalibrationReport: CalibrationReport = {
  generatedAt: '2026-03-18T00:00:00.000Z',
  sampleSize: 48,
  intervalMethod: 'residual-empirical-v1',
  overall: {
    sampleSize: 48,
    overallBias: 2.3,
    overallMae: 5.8,
    overallRmse: 7.2,
    coverage50: 0.42,
    coverage80: 0.69,
    coverage90: 0.77,
  },
  buckets: [],
  reliability: {
    meanAbsoluteBucketBias: 2.1,
    worstBucket: null,
    notes: ['Example weak support'],
  },
};

const weakSubgroupReport: SubgroupStabilityReport = {
  generatedAt: '2026-03-18T00:00:00.000Z',
  sampleSize: 48,
  intervalMethod: 'residual-empirical-v1',
  groups: [
    { family: 'position', subgroup: 'wr', label: 'WR', sampleSize: 18, averagePrediction: 13.2, averageActual: 11.8, bias: 1.4, mae: 5.1, rmse: 6.4, coverage50: 0.4, coverage80: 0.69, coverage90: 0.76 },
    { family: 'event', subgroup: 'event', label: 'Event', sampleSize: 14, averagePrediction: 13.8, averageActual: 11.6, bias: 2.2, mae: 6.3, rmse: 7.8, coverage50: 0.36, coverage80: 0.61, coverage90: 0.74 },
    { family: 'sample-size', subgroup: 'low-sample', label: 'Low sample', sampleSize: 12, averagePrediction: 12.5, averageActual: 10.3, bias: 2.2, mae: 6.1, rmse: 7.5, coverage50: 0.33, coverage80: 0.58, coverage90: 0.71 },
    { family: 'projection-tier', subgroup: 'mid', label: 'Mid projection', sampleSize: 20, averagePrediction: 12.7, averageActual: 11.4, bias: 1.3, mae: 4.9, rmse: 6.0, coverage50: 0.41, coverage80: 0.68, coverage90: 0.78 },
    { family: 'experience', subgroup: 'rookie', label: 'Rookie', sampleSize: 10, averagePrediction: 13.1, averageActual: 10.5, bias: 2.6, mae: 6.7, rmse: 8.1, coverage50: 0.31, coverage80: 0.56, coverage90: 0.7 },
  ],
};

describe('market comparison and edge detection layer', () => {
  it('compares model output to consensus and derives raw comparison metrics', () => {
    const row = sampleFeatureRows.stableVeteranWr;
    const projection: MarketProjectionInput = {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      modelPoints: 18.6,
      modelRank: 10,
      row,
    };
    const consensus: ConsensusInput = {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      source: 'Unit Test Consensus',
      consensusPoints: 15.7,
      consensusRank: 14,
      timestamp: '2026-10-10T12:05:00.000Z',
    };

    const comparison = compareToConsensus(projection, consensus);

    expect(comparison.rawDelta).toBe(2.9);
    expect(comparison.rawEdgeScore).toBe(48.6);
    expect(comparison.edgeDirection).toBe('above_market');
  });

  it('maps raw deltas into deterministic edge directions', () => {
    expect(deriveEdgeDirection(1.2)).toBe('above_market');
    expect(deriveEdgeDirection(-1.2)).toBe('below_market');
    expect(deriveEdgeDirection(0.2)).toBe('in_line');
  });

  it('downgrades raw edges when uncertainty, fragility, and support penalties stack up', () => {
    const row = sampleFeatureRows.rookieWr;
    const projection: MarketProjectionInput = {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      modelPoints: 14.2,
      row,
    };
    projection.prediction = buildPrediction(projection, 15);
    projection.diagnostics = buildDiagnostics(projection, {
      fragilityScore: 64,
      intervalWidth90: 15,
      intervalWidth80: 10.5,
      flags: ['INTERVAL_WIDE_HIGH_UNCERTAINTY', 'PROJECTION_FRAGILE_EVENT_DRIVEN'],
    });

    const comparison = compareToConsensus(projection, {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      source: 'Unit Test Consensus',
      consensusPoints: 11.5,
    });
    const scored = scoreTrustAdjustedEdge(comparison, projection, {
      calibrationReport: weakCalibrationReport,
      subgroupReport: weakSubgroupReport,
    });

    expect(scored.trustAdjustedEdgeScore).toBeLessThan(comparison.rawEdgeScore);
    expect(scored.trustAdjustment.intervalWidthPenalty).toBeGreaterThan(0);
    expect(scored.trustAdjustment.fragilityPenalty).toBeGreaterThan(0);
    expect(scored.trustAdjustment.calibrationPenalty).toBeGreaterThan(0);
    expect(scored.trustAdjustment.subgroupPenalty).toBeGreaterThan(0);
    expect(scored.trustAdjustment.matchedSubgroups).toContain('experience:rookie');
  });

  it('builds machine-readable flags for strong, weak, fragile, and event-driven edges', () => {
    const strongAboveRow = sampleFeatureRows.stableVeteranWr;
    const strongAboveProjection: MarketProjectionInput = {
      rowId: strongAboveRow.scenario_id,
      playerId: strongAboveRow.player_id,
      playerName: strongAboveRow.player_name,
      modelPoints: 18.6,
      row: strongAboveRow,
    };
    strongAboveProjection.prediction = buildPrediction(strongAboveProjection, 7.2);
    strongAboveProjection.diagnostics = buildDiagnostics(strongAboveProjection, {
      regressionUpScore: 39,
      stickinessScore: 70,
      fragilityScore: 16,
      flags: ['USAGE_AHEAD_OF_PRODUCTION', 'PROJECTION_STICKY_HIGH_VOLUME'],
    });

    const strongAboveComparison = compareToConsensus(strongAboveProjection, {
      rowId: strongAboveRow.scenario_id,
      playerId: strongAboveRow.player_id,
      playerName: strongAboveRow.player_name,
      source: 'Consensus',
      consensusPoints: 15.8,
    });
    const strongTrust = scoreTrustAdjustedEdge(strongAboveComparison, strongAboveProjection);
    const strongFlags = buildEdgeFlags({ ...strongAboveComparison, ...strongTrust, flags: [], explanation: [] } as MarketEdgeOutput, strongAboveProjection);

    expect(strongFlags).toEqual(expect.arrayContaining(['EDGE_ABOVE_MARKET_STRONG', 'EDGE_SUPPORTED_BY_USAGE']));

    const eventRow = sampleFeatureRows.rookieWr;
    const fragileProjection: MarketProjectionInput = {
      rowId: eventRow.scenario_id,
      playerId: eventRow.player_id,
      playerName: eventRow.player_name,
      modelPoints: 13.7,
      row: eventRow,
    };
    fragileProjection.prediction = buildPrediction(fragileProjection, 16);
    fragileProjection.diagnostics = buildDiagnostics(fragileProjection, {
      regressionDownScore: 44,
      fragilityScore: 61,
      intervalWidth90: 16,
      flags: ['EFFICIENCY_AHEAD_OF_ROLE', 'PROJECTION_FRAGILE_EVENT_DRIVEN'],
    });

    const fragileComparison = compareToConsensus(fragileProjection, {
      rowId: eventRow.scenario_id,
      playerId: eventRow.player_id,
      playerName: eventRow.player_name,
      source: 'Consensus',
      consensusPoints: 11.6,
    });
    const fragileTrust = scoreTrustAdjustedEdge(fragileComparison, fragileProjection, {
      calibrationReport: weakCalibrationReport,
      subgroupReport: weakSubgroupReport,
    });
    const fragileFlags = buildEdgeFlags({ ...fragileComparison, ...fragileTrust, flags: [], explanation: [] } as MarketEdgeOutput, fragileProjection);

    expect(fragileFlags).toEqual(expect.arrayContaining([
      'EDGE_WEAK_HIGH_UNCERTAINTY',
      'EDGE_UNSUPPORTED_FRAGILE_EFFICIENCY',
      'EDGE_EVENT_DRIVEN_CAUTION',
    ]));
  });

  it('generates readable edge explanations with uncertainty and event context', () => {
    const row = sampleFeatureRows.rookieWr;
    const projection: MarketProjectionInput = {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      modelPoints: 13.7,
      row,
    };
    projection.prediction = buildPrediction(projection, 16);
    projection.diagnostics = buildDiagnostics(projection, {
      fragilityScore: 61,
      intervalWidth90: 16,
      flags: ['EFFICIENCY_AHEAD_OF_ROLE', 'PROJECTION_FRAGILE_EVENT_DRIVEN'],
    });

    const comparison = compareToConsensus(projection, {
      rowId: row.scenario_id,
      playerId: row.player_id,
      playerName: row.player_name,
      source: 'Consensus',
      consensusPoints: 11.6,
    });
    const trust = scoreTrustAdjustedEdge(comparison, projection, {
      calibrationReport: weakCalibrationReport,
      subgroupReport: weakSubgroupReport,
    });
    const edge = {
      ...comparison,
      ...trust,
      flags: buildEdgeFlags({ ...comparison, ...trust, flags: [], explanation: [] } as MarketEdgeOutput, projection),
      explanation: [],
    } as MarketEdgeOutput;

    const explanation = buildEdgeExplanation(edge, projection);

    expect(explanation[0]).toContain('model 13.7 vs consensus 11.6');
    expect(explanation.join(' ')).toContain('Trust-adjusted edge falls');
    expect(explanation.join(' ')).toContain('event-driven');
  });

  it('wraps comparison and scoring in service envelopes with unmatched identifiers', () => {
    const stableRow = sampleFeatureRows.stableVeteranWr;
    const rookieRow = sampleFeatureRows.rookieWr;
    const projections: MarketProjectionInput[] = [
      {
        rowId: stableRow.scenario_id,
        playerId: stableRow.player_id,
        playerName: stableRow.player_name,
        modelPoints: 18.6,
        row: stableRow,
        prediction: buildPrediction({ rowId: stableRow.scenario_id, playerId: stableRow.player_id, playerName: stableRow.player_name, modelPoints: 18.6, row: stableRow }, 7.2),
        diagnostics: buildDiagnostics({ rowId: stableRow.scenario_id, playerId: stableRow.player_id, playerName: stableRow.player_name, modelPoints: 18.6, row: stableRow }),
      },
      {
        rowId: 'unmatched-projection',
        playerId: 'missing-player',
        playerName: 'Missing Player',
        modelPoints: 9.1,
      },
    ];
    const consensusInputs: ConsensusInput[] = [
      {
        rowId: stableRow.scenario_id,
        playerId: stableRow.player_id,
        playerName: stableRow.player_name,
        source: 'Consensus',
        consensusPoints: 15.8,
      },
      {
        rowId: rookieRow.scenario_id,
        playerId: rookieRow.player_id,
        playerName: rookieRow.player_name,
        source: 'Consensus',
        consensusPoints: 11.6,
      },
    ];

    const comparisonResult = compareProjectionToConsensusService(projections, consensusInputs);
    expect(comparisonResult.ok).toBe(true);
    if (!comparisonResult.ok) {
      return;
    }

    expect(comparisonResult.data.comparisons).toHaveLength(1);
    expect(comparisonResult.data.unmatchedProjectionRowIds).toEqual(['unmatched-projection']);
    expect(comparisonResult.data.unmatchedConsensusRowIds).toEqual([rookieRow.scenario_id]);

    const edgeResult = scoreMarketEdgesService(projections, consensusInputs, {
      calibrationReport: weakCalibrationReport,
      subgroupReport: weakSubgroupReport,
      generatedAt: '2026-03-18T00:00:00.000Z',
    });
    expect(edgeResult.ok).toBe(true);
    if (!edgeResult.ok) {
      return;
    }

    expect(edgeResult.data.edges).toHaveLength(1);
    expect(edgeResult.data.edges[0].trustAdjustedEdgeScore).toBeLessThanOrEqual(edgeResult.data.edges[0].rawEdgeScore);
    expect(edgeResult.data.generatedAt).toBe('2026-03-18T00:00:00.000Z');
  });
});
