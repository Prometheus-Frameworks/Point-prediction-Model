# WR/TE baseline model training

## Model choice

PR8 adds a deterministic gradient-boosted regression-tree baseline for weekly WR/TE PPR prediction. The implementation stays inside the TypeScript codebase so it can reuse the existing feature engine, labeled historical dataset builder, and leak-safe rolling backtest harness without introducing native runtime dependencies.

This is intentionally a **single** learned baseline:

- no ensembles of different model families,
- no neural networks,
- no hyperparameter search framework,
- no live-serving routes.

## Training flow

1. Build WR/TE labeled rows with `buildHistoricalDataset`.
2. Convert labeled rows into a locked training matrix with `prepareTrainingMatrix`.
3. Train the baseline model with `trainWrTeBaselineModel` or `trainBaselineModelService`.
4. Optionally save the JSON artifact to disk.
5. Re-load the artifact with `loadModelArtifact` and score rows with `predictWrTeBaselineModel`.
6. Evaluate the learned model against `baseline-mean`, `baseline-recent-trend`, and `baseline-usage` with `evaluateModelAgainstBenchmarks` or `runModelBacktestService`.

## Training matrix details

The matrix-prep layer is intentionally opinionated and stable:

- **stable feature ordering** from the WR/TE feature schema groups plus `season` and `week`,
- **schema locking** so inference uses the exact same column order,
- **missing-value handling** through deterministic numeric mean imputation learned from training data,
- **basic categorical handling** through one-hot encoding for `player_position` and `event_type`.

## Artifact structure

Each saved artifact contains:

- the trained gradient-boosted tree model,
- the locked feature schema and feature order,
- the training config,
- training metadata such as sample size and season/week coverage,
- feature-importance summaries,
- an evaluation summary when available.

## Benchmark comparison philosophy

The learned model is not meant to hide behind a single headline metric. Public outputs should make it obvious whether the model improves on the simple benchmark set:

- `baseline-mean`,
- `baseline-recent-trend`,
- `baseline-usage`.

For that reason the comparison layer reports:

- MAE,
- RMSE,
- Pearson correlation,
- rank correlation,
- by-position metrics,
- deltas versus the mean baseline.

## Limitations of the first baseline model

This first learned baseline is intentionally narrow:

- WR/TE only,
- regression trees only,
- no uncertainty intervals,
- no calibration layer,
- no automated tuning,
- no team/player identity one-hot explosion,
- feature importance is split/gain-based sanity checking rather than a full explainability stack.
