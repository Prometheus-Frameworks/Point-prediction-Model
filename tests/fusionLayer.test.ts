import { describe, expect, it } from 'vitest';
import {
  applyBoundedFusion,
  applyWeightedFusion,
  defaultFusionConfig,
  fuseScenarioWithModel,
  historicalSampleDataset,
  predictWithIntervalsService,
  recomputeIntervalsAfterFusion,
  runFusedBatchService,
  runFusedProjectionService,
  runScenario,
  sampleFeatureRows,
  trainWrTeBaselineModel,
} from '../src/public/index.js';
import type { ProjectionScenario, WrTeBaselineUncertaintyArtifact } from '../src/public/index.js';

const testUncertaintyArtifact: WrTeBaselineUncertaintyArtifact = {
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
      sampleSize: 12,
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

const tradeScenario: ProjectionScenario = {
  metadata: {
    id: 'fusion-trade-scenario',
    title: 'Fusion trade scenario',
    description: 'A trade scenario used for fusion-layer tests.',
    tags: ['fusion', 'trade'],
    defaultRun: false,
  },
  player: {
    id: 'fusion-trade-player',
    name: 'Fusion Trade WR',
    position: 'WR',
    team: 'MIA',
    sampleSizeGames: 17,
    routesPerGame: 35,
    targetsPerRouteRun: 0.24,
    catchRate: 0.65,
    yardsPerTarget: 8.7,
    tdPerTarget: 0.06,
    rushPointsPerGame: 0.2,
  },
  previousTeamContext: {
    team: 'MIA',
    quarterback: 'Tua Tagovailoa',
    targetCompetitionIndex: 74,
    qbEfficiencyIndex: 106,
    passTdEnvironmentIndex: 105,
    playVolumeIndex: 102,
    passRateIndex: 103,
  },
  newTeamContext: {
    team: 'DEN',
    quarterback: 'Bo Nix',
    targetCompetitionIndex: 58,
    qbEfficiencyIndex: 97,
    passTdEnvironmentIndex: 97,
    playVolumeIndex: 99,
    passRateIndex: 97,
  },
  event: {
    type: 'PLAYER_TRADE',
    description: 'Player moves into a thinner target room.',
    effectiveWeek: 1,
    severity: 7,
    clarity: 0.82,
    fromTeam: {
      team: 'MIA',
      quarterback: 'Tua Tagovailoa',
      targetCompetitionIndex: 74,
      qbEfficiencyIndex: 106,
      passTdEnvironmentIndex: 105,
      playVolumeIndex: 102,
      passRateIndex: 103,
    },
    toTeam: {
      team: 'DEN',
      quarterback: 'Bo Nix',
      targetCompetitionIndex: 58,
      qbEfficiencyIndex: 97,
      passTdEnvironmentIndex: 97,
      playVolumeIndex: 99,
      passRateIndex: 97,
    },
  },
};

const injuryScenario: ProjectionScenario = {
  metadata: {
    id: 'fusion-injury-scenario',
    title: 'Fusion injury scenario',
    description: 'A teammate injury scenario used for fusion-layer tests.',
    tags: ['fusion', 'injury'],
    defaultRun: false,
  },
  player: {
    id: 'fusion-injury-player',
    name: 'Fusion Injury WR',
    position: 'WR',
    team: 'ATL',
    sampleSizeGames: 16,
    routesPerGame: 34,
    targetsPerRouteRun: 0.23,
    catchRate: 0.66,
    yardsPerTarget: 8.5,
    tdPerTarget: 0.065,
    rushPointsPerGame: 0.1,
  },
  previousTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 67,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 100,
    playVolumeIndex: 101,
    passRateIndex: 100,
  },
  newTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 53,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 101,
    playVolumeIndex: 101,
    passRateIndex: 101,
  },
  event: {
    type: 'TEAMMATE_INJURY',
    description: 'A high-volume teammate is sidelined.',
    effectiveWeek: 1,
    severity: 8,
    clarity: 0.74,
  },
};

const buildArtifacts = async () => {
  const trained = await trainWrTeBaselineModel(historicalSampleDataset.slice(0, 4), {
    createdAt: '2026-03-18T00:00:00.000Z',
    config: {
      nEstimators: 6,
      maxDepth: 2,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
    },
  });

  return {
    artifact: trained.artifact,
    uncertaintyArtifact: testUncertaintyArtifact,
  };
};

describe('fusion layer', () => {
  it('weights scenario deltas by event confidence and context', () => {
    const result = applyWeightedFusion({
      baselinePointPrediction: 15,
      scenarioDelta: 6,
      eventType: 'PLAYER_TRADE',
      eventConfidenceScore: 80,
      eventClarity: 0.8,
      eventSeverity: 7,
      baselineIntervalWidth90: 8,
      config: defaultFusionConfig,
    });

    expect(result.policy).toBe('weighted-fusion-v1');
    expect(result.appliedDelta).toBeCloseTo(4.68, 2);
    expect(result.appliedDelta).toBeLessThan(6);
    expect(result.confidenceWeight).toBeCloseTo(0.78, 3);
  });

  it('bounds large event deltas so they cannot hijack the learned baseline', () => {
    const result = applyBoundedFusion({
      baselinePointPrediction: 10,
      scenarioDelta: 30,
      eventType: 'PLAYER_TRADE',
      eventConfidenceScore: 80,
      eventClarity: 0.8,
      eventSeverity: 7,
      baselineIntervalWidth90: 6,
      config: defaultFusionConfig,
    });

    expect(result.policy).toBe('bounded-fusion-v1');
    expect(result.maxAllowedDelta).toBe(3.5);
    expect(result.appliedDelta).toBe(3.5);
    expect(result.notes.join(' ')).toContain('clipped');
  });

  it('widens intervals after fusion while shifting the projection center', () => {
    const baselinePrediction = {
      rowId: 'fusion-row',
      playerId: 'fusion-player',
      playerName: 'Fusion Player',
      position: 'WR' as const,
      predictedPpr: 14,
      pointPrediction: 14,
      lower50: 12.5,
      upper50: 15.5,
      lower80: 11,
      upper80: 17,
      lower90: 9,
      upper90: 19,
      uncertaintyBucket: 'global',
      intervalMethod: 'residual-empirical-v1' as const,
    };

    const result = recomputeIntervalsAfterFusion({
      baselinePrediction,
      fusedPointPrediction: 17,
      appliedDelta: 3,
      eventConfidenceWeight: 0.55,
      eventClarity: 0.6,
      config: defaultFusionConfig,
    });

    expect(result.intervals.pointPrediction).toBe(17);
    expect(result.intervals.lower90).toBeLessThan(17);
    expect(result.intervals.upper90).toBeGreaterThan(17);
    expect(result.intervals.upper90 - result.intervals.lower90).toBeGreaterThan(10);
    expect(result.notes.join(' ')).toContain('Shifted interval center');
  });

  it('builds fused outputs with baseline, fused intervals, and refreshed diagnostics', async () => {
    const { artifact, uncertaintyArtifact } = await buildArtifacts();
    const predictionResult = await predictWithIntervalsService([sampleFeatureRows.tradedWr], {
      artifact,
      uncertaintyArtifact,
    });

    expect(predictionResult.ok).toBe(true);
    if (!predictionResult.ok) {
      return;
    }

    const fused = fuseScenarioWithModel({
      row: sampleFeatureRows.tradedWr,
      baselinePrediction: predictionResult.data.predictions[0],
      scenarioResult: runScenario(tradeScenario),
    });

    expect(fused.baselinePointPrediction).toBe(predictionResult.data.predictions[0]?.pointPrediction);
    expect(fused.fusedPointPrediction).toBeCloseTo(fused.baselinePointPrediction + fused.appliedDelta, 2);
    expect(fused.fusedIntervals.pointPrediction).toBe(fused.fusedPointPrediction);
    expect(fused.diagnostics.fused.intervalWidth90).toBeGreaterThanOrEqual(fused.diagnostics.baseline.intervalWidth90);
    expect(fused.notes.length).toBeGreaterThan(3);
    expect(fused.fusionConfidence.rationale.join(' ')).toContain('Fusion weight');
  });

  it('wraps single and batch fused projections in service envelopes', async () => {
    const { artifact, uncertaintyArtifact } = await buildArtifacts();
    const singleResult = await runFusedProjectionService(
      {
        row: sampleFeatureRows.tradedWr,
        scenario: tradeScenario,
      },
      {
        artifact,
        uncertaintyArtifact,
      },
    );

    expect(singleResult.ok).toBe(true);
    if (!singleResult.ok) {
      return;
    }

    expect(singleResult.data.fusedProjection.fusionPolicy).toBe('bounded-fusion-v1');
    expect(singleResult.data.fusedProjection.scenarioDelta).not.toBe(0);
    expect(singleResult.data.fusedProjection.fusedIntervals.upper90).toBeGreaterThan(singleResult.data.fusedProjection.fusedPointPrediction);

    const batchResult = await runFusedBatchService(
      {
        rows: [sampleFeatureRows.tradedWr, sampleFeatureRows.teammateInjuryBeneficiary],
        scenarios: [tradeScenario, injuryScenario],
      },
      {
        artifact,
        uncertaintyArtifact,
      },
    );

    expect(batchResult.ok).toBe(true);
    if (!batchResult.ok) {
      return;
    }

    expect(batchResult.data.fusedProjections).toHaveLength(2);
    expect(batchResult.data.fusedProjections[0]?.baselinePointPrediction).toBe(batchResult.data.baselinePredictions[0]?.pointPrediction);
    expect(batchResult.data.fusedProjections[1]?.eventType).toBe('TEAMMATE_INJURY');
  });
});
