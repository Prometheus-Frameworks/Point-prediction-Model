# Uncertainty-aware prediction intervals

## What PR10 adds

The WR/TE baseline model now supports deterministic prediction intervals derived from historical residual behavior rather than from a second learned model. Interval assignment is designed to be honest about where the baseline is stable and where it is fragile.

Public prediction payloads can now include:

- `pointPrediction`
- `lower50` / `upper50`
- `lower80` / `upper80`
- `lower90` / `upper90`
- `uncertaintyBucket`
- `intervalMethod`

## Methodology

PR10 uses residual-based empirical intervals.

1. Run the existing learned WR/TE baseline through the rolling backtest harness.
2. Collect historical residuals (`actual - prediction`) from out-of-sample test windows.
3. Bucket each prediction context using deterministic metadata that already exists in the feature row.
4. Estimate empirical residual quantiles for each bucket.
5. Reuse the bucket quantiles to assign intervals to future predictions.

No ensemble, neural net, quantile regressor, or second learned model is introduced.

## Context buckets

Buckets are formed from the following dimensions:

- position (`WR` vs `TE`)
- prediction tier (`low`, `mid`, `high`)
- event context (`event` vs `non-event`)
- sample tier (`low`, `medium`, `high` reliability/sample support)
- experience tier (`rookie` vs `veteran`)

When a fully specific bucket has too few historical examples, the system falls back to broader buckets and then to a global residual bucket.

## Why this approach

The goal is not to look precise. The goal is to communicate realistic uncertainty using the model family that already exists.

Residual intervals are useful here because they:

- stay consistent with the existing backtest harness
- are deterministic and easy to audit
- surface instability in sparse or event-heavy contexts
- avoid over-claiming confidence when the baseline historically misses badly

## Limitations

Residual-based intervals are still limited.

- They depend on the quality and size of historical backtest residuals.
- Sparse buckets will fall back to broader contexts, which can produce wider but less tailored intervals.
- They assume future error behavior will roughly resemble historical error behavior.
- They do not model distribution shift explicitly.
- Coverage measured on the same residual pool used to build intervals can look slightly optimistic; prefer forward backtests when possible.

## Operational guidance

- Favor wider intervals when sample support is thin.
- Treat bucket assignment as model diagnostics, not just presentation metadata.
- If a subgroup keeps under-covering nominal intervals, expose it and investigate feature gaps before adding model complexity.

## Artifact handling

Uncertainty metadata can travel in either of two deterministic forms:

- embedded on the baseline model artifact as `uncertaintyMetadata`
- stored as a companion uncertainty artifact containing residual bucket definitions and calibration summary metadata

That keeps interval assignment compatible with the current artifact save/load flow without introducing a new learned model family.
