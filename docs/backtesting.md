# Backtesting

## Philosophy

Backtesting in this repo is intentionally time-aware and conservative. Random train/test splits are not allowed because they would overstate forecast quality for weekly fantasy prediction.

## Split utilities

### `timeSeriesSplit`

Use this helper when you want one canonical train/validation/test partition by explicit season-week ranges.

### `rollingBacktestWindows`

Use this helper when you want repeated walk-forward evaluation windows. Each window contains:

- a contiguous training range
- an optional gap in weeks
- a contiguous test range
- deterministic row membership ordered by season/week

## Benchmarks

PR7 includes transparent non-ML baselines only:

- `baselineMeanModel`: position mean from the training window, with overall mean fallback.
- `baselineRecentTrendModel`: weighted recent fantasy-point and usage trend heuristic.
- `baselineUsageModel`: heuristic PPR estimate from targets, catch rate, yards per target, and touchdown rate.

These benchmarks exist to set a floor for future learned models. They are intentionally simple and auditable.

## Evaluation metrics

The evaluation layer computes:

- MAE
- RMSE
- Pearson correlation
- rank correlation
- grouped metrics by position
- grouped metrics by event presence (`NONE` vs event-driven rows)

## Reporting

`generateBacktestReport` summarizes:

- overall metrics by model
- metrics for each rolling window
- grouped metrics by position and event presence
- top misses / largest absolute errors

## Service entrypoint

`runBacktestService` builds rolling windows, scores every benchmark on each window, evaluates predictions, and returns a report through the standard service envelope.
