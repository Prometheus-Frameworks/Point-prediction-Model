import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  evaluateModelAgainstBenchmarks,
  historicalSampleDataset,
  loadModelArtifact,
  predictBaselineModelService,
  predictWrTeBaselineModel,
  prepareTrainingMatrix,
  runModelBacktestService,
  trainBaselineModelService,
  trainWrTeBaselineModel,
} from '../src/public/index.js';

const tempDirs: string[] = [];

const createTempDir = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'wrte-model-'));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('wr/te baseline model layer', () => {
  it('prepares a stable, schema-locked training matrix', () => {
    const rows = historicalSampleDataset.slice(0, 4);
    const first = prepareTrainingMatrix(rows);
    const second = prepareTrainingMatrix(rows, first.schema);

    expect(first.schema.featureSchemaVersion).toBe('wrte-weekly-v1');
    expect(first.schema.orderedFeatures.length).toBeGreaterThan(10);
    expect(first.schema.orderedFeatures[0]).toEqual(
      expect.objectContaining({ column: 'season', kind: 'numeric' }),
    );
    expect(first.featureMatrix).toEqual(second.featureMatrix);
    expect(first.targets).toEqual(rows.map((row) => row.target_fantasy_points_ppr));
    expect(first.schema.orderedFeatures.some((feature) => feature.kind === 'one-hot' && feature.column === 'event_type')).toBe(
      true,
    );
  });

  it('trains a deterministic learned baseline and records feature importance', async () => {
    const trainRows = historicalSampleDataset.slice(0, 4);
    const result = await trainWrTeBaselineModel(trainRows, {
      createdAt: '2026-03-18T00:00:00.000Z',
      config: {
        nEstimators: 8,
        maxDepth: 2,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });

    expect(result.artifact.model.trees).toHaveLength(8);
    expect(result.artifact.featureImportance.length).toBeGreaterThan(0);
    expect(result.artifact.trainingMetadata.sampleSize).toBe(trainRows.length);
    expect(result.predictions).toHaveLength(trainRows.length);
  });

  it('saves and reloads a model artifact for inference', async () => {
    const trainRows = historicalSampleDataset.slice(0, 4);
    const testRows = historicalSampleDataset.slice(4);
    const dir = await createTempDir();
    const artifactPath = path.join(dir, 'baseline-artifact.json');

    const trained = await trainWrTeBaselineModel(trainRows, {
      artifactOutputPath: artifactPath,
      createdAt: '2026-03-18T00:00:00.000Z',
      config: {
        nEstimators: 6,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });
    const loaded = await loadModelArtifact(artifactPath);
    const predictions = predictWrTeBaselineModel(loaded, testRows);

    expect(loaded.artifactVersion).toBe(trained.artifact.artifactVersion);
    expect(predictions).toHaveLength(testRows.length);
    expect(predictions[0]?.predictedPpr).toBeTypeOf('number');
  });

  it('evaluates the learned model against existing benchmarks', async () => {
    const result = await evaluateModelAgainstBenchmarks(
      historicalSampleDataset.slice(0, 4),
      historicalSampleDataset.slice(4),
      {
        createdAt: '2026-03-18T00:00:00.000Z',
        config: {
          nEstimators: 8,
          minSamplesSplit: 2,
          minSamplesLeaf: 1,
        },
      },
    );

    expect(result.models.map((model) => model.model)).toEqual([
      'wrte-weekly-ppr-baseline',
      'baseline-mean',
      'baseline-recent-trend',
      'baseline-usage',
    ]);
    expect(result.comparison[0]?.sampleSize).toBe(2);
    expect(result.artifact.evaluationSummary?.benchmarkComparisons).toHaveLength(4);
  });

  it('wraps training and prediction inside service envelopes', async () => {
    const dir = await createTempDir();
    const artifactPath = path.join(dir, 'service-artifact.json');

    const trainResult = await trainBaselineModelService(historicalSampleDataset.slice(0, 4), {
      artifactOutputPath: artifactPath,
      createdAt: '2026-03-18T00:00:00.000Z',
      config: {
        nEstimators: 6,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });

    expect(trainResult.ok).toBe(true);
    if (!trainResult.ok) {
      return;
    }

    const predictResult = await predictBaselineModelService(historicalSampleDataset.slice(4), {
      artifactPath,
    });

    expect(predictResult.ok).toBe(true);
    if (!predictResult.ok) {
      return;
    }

    expect(predictResult.data.predictions).toHaveLength(2);
    expect(predictResult.data.artifact.modelName).toBe('wrte-weekly-ppr-baseline');
  });

  it('runs the learned-model backtest through rolling windows', async () => {
    const result = await runModelBacktestService(historicalSampleDataset, {
      trainWeeks: 2,
      testWeeks: 1,
      stepWeeks: 1,
      minTrainRows: 2,
      generatedAt: '2026-03-18T00:00:00.000Z',
      modelConfig: {
        nEstimators: 6,
        minSamplesSplit: 2,
        minSamplesLeaf: 1,
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.report.models.map((model) => model.model)).toEqual([
      'wrte-weekly-ppr-baseline',
      'baseline-mean',
      'baseline-recent-trend',
      'baseline-usage',
    ]);
    expect(result.data.comparisons).toHaveLength(3);
    expect(result.data.comparisons[0]?.featureImportance.length).toBeGreaterThan(0);
  });
});
