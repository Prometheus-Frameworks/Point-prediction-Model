# WR/TE weekly PPR learned baseline

## What PR8 adds

The repository now includes a first learned baseline model for WR/TE weekly PPR prediction under `src/models_ml/`. It is designed to be modular, typed, deterministic, and benchmark-oriented.

## Main modules

- `types/`: config, artifact, and prediction contracts.
- `training/`: matrix prep and model fitting.
- `inference/`: artifact loading and prediction.
- `evaluation/`: learned-model versus benchmark comparisons.
- `examples/`: sample end-to-end training run.

## Service entrypoints

Three service-layer entrypoints are provided:

- `trainBaselineModelService`
- `predictBaselineModelService`
- `runModelBacktestService`

These mirror the existing service envelope pattern so callers receive structured success/failure payloads instead of raw exceptions.

## Backtesting behavior

`runModelBacktestService` uses the existing rolling time-aware windows. For every window it:

1. trains the learned baseline only on the training rows,
2. predicts the held-out rows,
3. scores the learned model and the three simple baselines on the same holdout,
4. emits both the existing backtest report shape and an explicit comparison table per window.

## Feature-importance sanity checks

The learned baseline emits gain-based feature-importance rows with:

- feature name,
- split count,
- accumulated gain.

This is mainly for sanity checking that the model is responding to usage/efficiency/team-context features instead of behaving like an opaque black box.

## Recommended usage

- Use the historical dataset builder to create leak-safe labeled rows.
- Train a baseline artifact and save it for reproducible experiments.
- Run the model backtest service to verify whether the learned baseline beats the simple heuristics.
- Inspect feature-importance output before trusting improvements.

## Known limitations

This baseline should be treated as a starting point rather than a final production model. It does **not** yet include:

- hyperparameter tuning,
- richer categorical identity handling,
- artifact registry/version migration tooling,
- uncertainty estimates,
- automated thresholding for “ship/no-ship” decisions.
