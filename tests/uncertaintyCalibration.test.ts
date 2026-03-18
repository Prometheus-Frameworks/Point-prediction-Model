import { describe, expect, it } from 'vitest';
import {
  assignPredictionInterval,
  estimateResidualBands,
  evaluateCalibration,
  evaluateCalibrationService,
  evaluateSubgroupStability,
  evaluateSubgroupStabilityService,
  historicalSampleDataset,
  predictWithIntervalsService,
  predictWrTeBaselineModelValue,
  trainWrTeBaselineModel,
} from '../src/public/index.js';

const buildResidualInputs = async () => {
  const trainRows = historicalSampleDataset.slice(0, 4);
  const testRows = historicalSampleDataset.slice(4);
  const trained = await trainWrTeBaselineModel(trainRows, {
    createdAt: '2026-03-18T00:00:00.000Z',
    config: {
      nEstimators: 6,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
    },
  });

  return {
    trained,
    inputs: testRows.map((row) => ({
      row,
      actual: row.target_fantasy_points_ppr,
      pointPrediction: predictWrTeBaselineModelValue(trained.artifact, row),
    })),
  };
};

describe('uncertainty, calibration, and subgroup layer', () => {
  it('estimates deterministic residual bands from historical residuals', async () => {
    const { inputs } = await buildResidualInputs();
    const artifact = estimateResidualBands(inputs, {
      generatedAt: '2026-03-18T00:00:00.000Z',
      minimumBucketSize: 1,
    });

    expect(artifact.artifactVersion).toBe('wrte-baseline-uncertainty-v1');
    expect(artifact.residualBucketDefinitions.some((definition) => definition.bucketId === 'global')).toBe(true);
    expect(artifact.residualBucketDefinitions[0]?.sampleSize).toBeGreaterThan(0);
  });

  it('assigns interval bands with width ordering 90 > 80 > 50', async () => {
    const { inputs } = await buildResidualInputs();
    const artifact = estimateResidualBands(inputs, {
      generatedAt: '2026-03-18T00:00:00.000Z',
      minimumBucketSize: 1,
    });
    const interval = assignPredictionInterval(artifact, inputs[0].row, inputs[0].pointPrediction);

    expect(interval.upper50 - interval.lower50).toBeLessThanOrEqual(interval.upper80 - interval.lower80);
    expect(interval.upper80 - interval.lower80).toBeLessThanOrEqual(interval.upper90 - interval.lower90);
    expect(interval.uncertaintyBucket.length).toBeGreaterThan(0);
  });

  it('builds calibration and subgroup reports from interval-aware predictions', async () => {
    const { inputs } = await buildResidualInputs();
    const artifact = estimateResidualBands(inputs, {
      generatedAt: '2026-03-18T00:00:00.000Z',
      minimumBucketSize: 1,
    });

    const calibration = evaluateCalibration(inputs, artifact, '2026-03-18T00:00:00.000Z');
    const subgroup = evaluateSubgroupStability(inputs, artifact, '2026-03-18T00:00:00.000Z');

    expect(calibration.buckets.length).toBeGreaterThan(0);
    expect(calibration.overall.coverage90).not.toBeNull();
    expect(calibration.reliability.notes.length).toBeGreaterThan(0);
    expect(subgroup.groups.some((group) => group.family === 'position' && group.subgroup === 'wr')).toBe(true);
    expect(subgroup.groups.some((group) => group.family === 'experience' && group.subgroup === 'rookie')).toBe(true);
  });

  it('wraps interval prediction, calibration, and subgroup stability in service envelopes', async () => {
    const trainRows = historicalSampleDataset.slice(0, 4);
    const testRows = historicalSampleDataset.slice(4);
    const trained = await trainWrTeBaselineModel(trainRows, {
      createdAt: '2026-03-18T00:00:00.000Z',
      config: {
        nEstimators: 6,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });

    const calibrationResult = await evaluateCalibrationService(historicalSampleDataset, {
      trainWeeks: 2,
      testWeeks: 1,
      stepWeeks: 1,
      minTrainRows: 2,
      generatedAt: '2026-03-18T00:00:00.000Z',
      modelConfig: trained.artifact.config,
      minimumBucketSize: 1,
    });

    expect(calibrationResult.ok).toBe(true);
    if (!calibrationResult.ok) {
      return;
    }

    const predictionResult = await predictWithIntervalsService(testRows, {
      artifact: trained.artifact,
      uncertaintyArtifact: calibrationResult.data.uncertaintyArtifact,
    });

    expect(predictionResult.ok).toBe(true);
    if (!predictionResult.ok) {
      return;
    }

    expect((predictionResult.data.predictions[0]?.upper50 ?? 0) - (predictionResult.data.predictions[0]?.lower50 ?? 0)).toBeLessThanOrEqual(
      (predictionResult.data.predictions[0]?.upper90 ?? 0) - (predictionResult.data.predictions[0]?.lower90 ?? 0),
    );
    expect(predictionResult.data.predictions[0]?.uncertaintyBucket).not.toBe('unavailable');

    const subgroupResult = await evaluateSubgroupStabilityService(historicalSampleDataset, {
      trainWeeks: 2,
      testWeeks: 1,
      stepWeeks: 1,
      minTrainRows: 2,
      generatedAt: '2026-03-18T00:00:00.000Z',
      modelConfig: trained.artifact.config,
      uncertaintyArtifact: calibrationResult.data.uncertaintyArtifact,
      minimumBucketSize: 1,
    });

    expect(subgroupResult.ok).toBe(true);
    if (!subgroupResult.ok) {
      return;
    }

    expect(subgroupResult.data.report.groups.some((group) => group.family === 'event')).toBe(true);
    expect(calibrationResult.data.uncertaintyArtifact.calibrationSummary?.sampleSize).toBeGreaterThan(0);
  });
});
