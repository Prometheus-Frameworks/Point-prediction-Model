import { describe, expect, it } from 'vitest';
import {
  buildDiagnosticFlags,
  buildRegressionExplanation,
  combineRegressionScores,
  historicalSampleDataset,
  runProjectionDiagnosticsService,
  scoreEfficiencyFragility,
  scoreProjectionStickiness,
  scoreRegressionCandidatesService,
  scoreTdRegressionRisk,
  scoreUsageProductionGap,
  scoreVolumeStability,
  sampleFeatureRows,
  trainWrTeBaselineModel,
} from '../src/public/index.js';
import type { ProjectionDiagnosticInput } from '../src/public/index.js';
import type { WrTeBaselineUncertaintyArtifact } from '../src/models_ml/types/uncertainty.js';

const makePrediction = (input: ProjectionDiagnosticInput['row'], predictedPpr: number, lower90: number, upper90: number) => ({
  rowId: input.scenario_id,
  playerId: input.player_id,
  playerName: input.player_name,
  position: input.player_position,
  predictedPpr,
  pointPrediction: predictedPpr,
  lower50: Math.max(0, predictedPpr - 1.5),
  upper50: predictedPpr + 1.5,
  lower80: Math.max(0, predictedPpr - 3),
  upper80: predictedPpr + 3,
  lower90,
  upper90,
  uncertaintyBucket: 'diagnostics-test',
  intervalMethod: 'residual-empirical-v1' as const,
});

const stableInput: ProjectionDiagnosticInput = {
  row: sampleFeatureRows.stableVeteranWr,
  prediction: makePrediction(sampleFeatureRows.stableVeteranWr, 17.5, 14.1, 20.4),
};

const underproducingUsageInput: ProjectionDiagnosticInput = {
  row: {
    ...sampleFeatureRows.teammateInjuryBeneficiary,
    player_name: 'Underproducing Usage WR',
    usage_targets_pg_trailing5: 9.5,
    usage_target_share_trailing5: 0.3,
    usage_routes_pg_trailing5: 37,
    efficiency_fantasy_points_pg_trailing5: 12.8,
    efficiency_fantasy_points_delta_vs_baseline: -1.7,
    efficiency_td_per_target_trailing5: 0.028,
    player_role_growth_trailing3_vs_season: 0.1,
  },
  prediction: makePrediction(sampleFeatureRows.teammateInjuryBeneficiary, 15.4, 10.2, 21.3),
};

const overproducingLowUsageInput: ProjectionDiagnosticInput = {
  row: {
    ...sampleFeatureRows.volatileTe,
    player_name: 'Overproducing Low-Usage TE',
    usage_targets_pg_trailing5: 4.1,
    usage_target_share_trailing5: 0.13,
    usage_air_yards_share_trailing3: 0.14,
    efficiency_catch_rate_trailing3: 0.74,
    efficiency_yards_per_target_trailing3: 10.4,
    efficiency_yards_per_route_run_trailing3: 2.2,
    efficiency_fantasy_points_pg_trailing5: 15.8,
    efficiency_fantasy_points_delta_vs_baseline: 4.2,
    efficiency_td_per_target_trailing5: 0.125,
    player_sample_reliability: 0.32,
    player_usage_volatility_trailing5: 0.31,
  },
  prediction: makePrediction(sampleFeatureRows.volatileTe, 11.9, 5.8, 18.4),
};

const eventDrivenInput: ProjectionDiagnosticInput = {
  row: {
    ...sampleFeatureRows.tradedWr,
    player_name: 'Event-Driven WR',
    event_severity: 9,
    event_clarity: 0.62,
    event_history_count: 2,
    event_has_recent_signal: 1,
    player_recent_team_change: 1,
    player_sample_reliability: 0.36,
    player_usage_volatility_trailing5: 0.24,
  },
  prediction: makePrediction(sampleFeatureRows.tradedWr, 14.8, 7.4, 22.1),
};

describe('projection diagnostics', () => {
  it('scores usage-vs-production gaps in both directions', () => {
    const up = scoreUsageProductionGap(underproducingUsageInput);
    const down = scoreUsageProductionGap(overproducingLowUsageInput);

    expect(up.direction).toBe('up');
    expect(up.score).toBeGreaterThan(20);
    expect(down.direction).toBe('down');
    expect(down.score).toBeGreaterThan(15);
  });

  it('scores efficiency fragility and touchdown regression risk', () => {
    const fragility = scoreEfficiencyFragility(overproducingLowUsageInput);
    const tdRisk = scoreTdRegressionRisk(overproducingLowUsageInput);

    expect(fragility.direction).toBe('down');
    expect(fragility.score).toBeGreaterThan(10);
    expect(tdRisk.downScore).toBeGreaterThan(tdRisk.upScore);
  });

  it('scores volume stability and projection stickiness/fragility', () => {
    const stable = scoreVolumeStability(stableInput);
    const sticky = scoreProjectionStickiness(stableInput);
    const unstable = scoreProjectionStickiness(eventDrivenInput);

    expect(stable.stabilityScore).toBeGreaterThan(stable.fragilityScore);
    expect(sticky.stickinessScore).toBeGreaterThan(55);
    expect(unstable.fragilityScore).toBeGreaterThan(sticky.fragilityScore);
  });

  it('combines component scores into directional and stickiness outputs', () => {
    const components = {
      usageProductionGap: scoreUsageProductionGap(underproducingUsageInput),
      efficiencyFragility: scoreEfficiencyFragility(underproducingUsageInput),
      tdRegressionRisk: scoreTdRegressionRisk(underproducingUsageInput),
      volumeStability: scoreVolumeStability(underproducingUsageInput),
      projectionStickiness: scoreProjectionStickiness(underproducingUsageInput),
    };
    const combined = combineRegressionScores(components);

    expect(combined.regressionUpScore).toBeGreaterThan(combined.regressionDownScore);
    expect(combined.stickinessScore).toBeGreaterThan(0);
    expect(combined.fragilityScore).toBeGreaterThan(0);
  });

  it('builds machine-readable flags and explanation bullets', () => {
    const components = {
      usageProductionGap: scoreUsageProductionGap(overproducingLowUsageInput),
      efficiencyFragility: scoreEfficiencyFragility(overproducingLowUsageInput),
      tdRegressionRisk: scoreTdRegressionRisk(overproducingLowUsageInput),
      volumeStability: scoreVolumeStability(overproducingLowUsageInput),
      projectionStickiness: scoreProjectionStickiness(overproducingLowUsageInput),
    };
    const combined = combineRegressionScores(components);
    const flags = buildDiagnosticFlags(overproducingLowUsageInput, components, combined);
    const explanation = buildRegressionExplanation(overproducingLowUsageInput, components, combined, flags);

    expect(flags).toEqual(expect.arrayContaining(['EFFICIENCY_AHEAD_OF_ROLE', 'REGRESSION_DOWN_TD_FRAGILE']));
    expect(explanation.join(' ')).toContain('regression-down');
    expect(explanation.length).toBeGreaterThanOrEqual(3);
  });

  it('wraps diagnostics in service envelopes', async () => {
    const scoreResult = scoreRegressionCandidatesService([stableInput, underproducingUsageInput], '2026-03-18T00:00:00.000Z');
    expect(scoreResult.ok).toBe(true);
    if (!scoreResult.ok) {
      return;
    }

    expect(scoreResult.data.diagnostics).toHaveLength(2);
    expect(scoreResult.data.generatedAt).toBe('2026-03-18T00:00:00.000Z');

    const trained = await trainWrTeBaselineModel(historicalSampleDataset.slice(0, 4), {
      createdAt: '2026-03-18T00:00:00.000Z',
      config: {
        nEstimators: 4,
        maxDepth: 2,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });

    const uncertaintyArtifact: WrTeBaselineUncertaintyArtifact = {
      artifactVersion: 'wrte-baseline-uncertainty-v1',
      modelName: 'wrte-weekly-ppr-baseline',
      generatedAt: '2026-03-18T00:00:00.000Z',
      intervalMethod: 'residual-empirical-v1',
      minimumBucketSize: 1,
      bucketDimensions: ['global'],
      globalBucketId: 'global',
      residualBucketDefinitions: [
        {
          bucketId: 'global',
          label: 'Global fallback bucket',
          dimensions: ['global'],
          sampleSize: 10,
          meanResidual: 0,
          mae: 3,
          rmse: 4,
          absoluteResidualP50: 2.5,
          quantiles: {
            lower50: -1.5,
            upper50: 1.5,
            lower80: -3,
            upper80: 3,
            lower90: -5,
            upper90: 5,
          },
        },
      ],
    };

    const runResult = await runProjectionDiagnosticsService([sampleFeatureRows.stableVeteranWr, sampleFeatureRows.volatileTe], {
      artifact: trained.artifact,
      uncertaintyArtifact,
      generatedAt: '2026-03-18T00:00:00.000Z',
    });

    expect(runResult.ok).toBe(true);
    if (!runResult.ok) {
      return;
    }

    expect(runResult.data.predictions).toHaveLength(2);
    expect(runResult.data.diagnostics).toHaveLength(2);
    expect(runResult.data.diagnostics[0]?.componentScores.usageProductionGap.score).toBeTypeOf('number');
  });
});
