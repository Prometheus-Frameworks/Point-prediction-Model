import { describe, expect, it } from 'vitest';
import {
  aggregateMetrics,
  baselineMeanModel,
  baselineRecentTrendModel,
  baselineUsageModel,
  buildHistoricalDataset,
  buildHistoricalDatasetService,
  buildLabeledRow,
  evaluatePredictions,
  generateBacktestReport,
  historicalSampleDataset,
  historicalSampleInputs,
  rollingBacktestWindows,
  runBacktestService,
  timeSeriesSplit,
} from '../src/public/index.js';

describe('dataset layer', () => {
  it('creates a labeled row that extends the feature row with target metadata', () => {
    const row = buildLabeledRow(historicalSampleInputs[0]);

    expect(row.row_id).toBe('davante-like-2026-W06');
    expect(row.target_fantasy_points_ppr).toBe(23.6);
    expect(row.label_week).toBe(6);
    expect(row.build_metadata.leakChecksPassed).toBe(true);
    expect(row.player_position).toBe('WR');
  });

  it('fails clearly when historical inputs would leak future information', () => {
    expect(() =>
      buildLabeledRow({
        ...historicalSampleInputs[0],
        actual: {
          ...historicalSampleInputs[0].actual,
          playedAt: '2026-10-10T11:00:00.000Z',
        },
      }),
    ).toThrow(/Historical dataset validation failed/);
  });

  it('builds a chronologically sorted historical dataset', () => {
    const rows = buildHistoricalDataset([...historicalSampleInputs].reverse());

    expect(rows).toHaveLength(historicalSampleInputs.length);
    expect(rows.map((row) => row.week)).toEqual([4, 5, 6, 7, 7, 8]);
    expect(rows[0].row_id).toBe('rookie-alpha-2026-W04');
  });

  it('creates non-overlapping time-series train/validation/test splits', () => {
    const split = timeSeriesSplit(historicalSampleDataset, {
      train: { end: { season: 2026, week: 5 } },
      validation: { start: { season: 2026, week: 6 }, end: { season: 2026, week: 6 } },
      test: { start: { season: 2026, week: 7 }, end: { season: 2026, week: 8 } },
    });

    expect(split.train).toHaveLength(2);
    expect(split.validation).toHaveLength(1);
    expect(split.test).toHaveLength(3);
  });

  it('builds rolling backtest windows without randomization', () => {
    const windows = rollingBacktestWindows(historicalSampleDataset, {
      trainWeeks: 2,
      testWeeks: 1,
      stepWeeks: 1,
      minTrainRows: 2,
    });

    expect(windows).toHaveLength(3);
    expect(windows[0].trainWindow.start.week).toBe(4);
    expect(windows[0].testWindow.start.week).toBe(6);
    expect(windows[1].testWindow.start.week).toBe(7);
  });

  it('runs transparent benchmark predictors', () => {
    const train = historicalSampleDataset.slice(0, 3);
    const targetRow = historicalSampleDataset[3];

    const meanPrediction = baselineMeanModel(train).predict(targetRow);
    const trendPrediction = baselineRecentTrendModel(train).predict(targetRow);
    const usagePrediction = baselineUsageModel(train).predict(targetRow);

    expect(meanPrediction).toBeGreaterThan(0);
    expect(trendPrediction).toBeGreaterThan(0);
    expect(usagePrediction).toBeGreaterThan(0);
    expect(trendPrediction).not.toBe(meanPrediction);
  });

  it('computes evaluation metrics and aggregates reports', () => {
    const predictions = historicalSampleDataset.slice(0, 3).map((row, index) => ({
      model: 'demo-model',
      rowId: row.row_id,
      playerId: row.player_id,
      playerName: row.player_name,
      position: row.player_position,
      eventType: row.event_type,
      season: row.season,
      week: row.week,
      predicted: row.target_fantasy_points_ppr - index,
      actual: row.target_fantasy_points_ppr,
      absoluteError: index,
      squaredError: index ** 2,
    }));

    const metrics = evaluatePredictions(predictions);
    expect(metrics.overall.sampleSize).toBe(3);
    expect(metrics.overall.mae).toBeCloseTo(1);
    expect(metrics.byPosition.WR?.sampleSize).toBe(3);

    const report = generateBacktestReport(3, [
      {
        windowIndex: 0,
        model: 'demo-model',
        metrics,
        predictions,
        window: rollingBacktestWindows(historicalSampleDataset, {
          trainWeeks: 2,
          testWeeks: 1,
          stepWeeks: 1,
          minTrainRows: 2,
        })[0],
      },
    ], '2026-03-18T00:00:00.000Z');

    const aggregate = aggregateMetrics(
      [
        {
          windowIndex: 0,
          model: 'demo-model',
          metrics,
          predictions,
          window: rollingBacktestWindows(historicalSampleDataset, {
            trainWeeks: 2,
            testWeeks: 1,
            stepWeeks: 1,
            minTrainRows: 2,
          })[0],
        },
      ],
      'demo-model',
    );

    expect(report.models[0].topMisses[0].absoluteError).toBe(2);
    expect(aggregate.overall.rmse).toBeCloseTo(Math.sqrt(5 / 3));
  });

  it('wraps dataset building and backtesting in service envelopes', () => {
    const datasetResult = buildHistoricalDatasetService(historicalSampleInputs);
    expect(datasetResult.ok).toBe(true);
    if (!datasetResult.ok) {
      return;
    }

    const backtestResult = runBacktestService(datasetResult.data.rows, {
      trainWeeks: 2,
      testWeeks: 1,
      stepWeeks: 1,
      minTrainRows: 2,
      generatedAt: '2026-03-18T00:00:00.000Z',
    });

    expect(backtestResult.ok).toBe(true);
    if (!backtestResult.ok) {
      return;
    }

    expect(backtestResult.data.windows).toHaveLength(3);
    expect(backtestResult.data.report.models.map((model) => model.model)).toEqual([
      'baseline-mean',
      'baseline-recent-trend',
      'baseline-usage',
    ]);
    expect(backtestResult.data.report.models[0].byWindow).toHaveLength(3);
  });
});
