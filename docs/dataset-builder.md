# Dataset builder

## Purpose

PR7 adds a historical dataset layer for WR/TE weekly prediction work. The layer produces labeled rows from historical feature inputs without training a production model yet.

## Labeled row structure

Each `WrTeLabeledRow` starts with the existing `WrTeFeatureRow` fields and adds:

- `labeled_row_version` and `row_id` for deterministic row identity.
- `label_season`, `label_week`, and `label_played_at` for explicit target-week tracking.
- Weekly PPR target fields:
  - `target_fantasy_points_ppr`
  - `target_receptions`
  - `target_receiving_yards`
  - `target_touchdowns`
- `build_metadata`, including:
  - the original input id
  - build timestamp
  - projection cutoff timestamp
  - prior-game count used in the row
  - event presence flag
  - leak-check status

## Leak-prevention rules

The historical builders enforce the same prior-only philosophy as the feature engine:

1. Feature windows must end strictly before the projection timestamp.
2. Prior games must occur strictly before the projection timestamp.
3. The labeled game must occur strictly after the projection timestamp.
4. No target week may differ from the projected `season/week` pair.
5. Window endpoints and prior games must also precede the actual labeled game.

If any of those invariants fail, dataset construction raises a clear validation error so future training PRs cannot quietly backfill leaked data.

## Builder flow

- `buildLabeledRow` validates one historical input and returns one labeled row.
- `buildHistoricalDataset` sorts inputs chronologically, validates each row, rejects duplicate row ids, and returns a deterministic dataset.
- `buildHistoricalDatasetService` wraps the builder in the repo’s standard service envelope.

## How future model-training PRs should use this layer

Future model-training PRs should:

1. Build historical labeled rows through this layer first.
2. Use only `timeSeriesSplit` or `rollingBacktestWindows` for evaluation.
3. Compare any learned model to the baseline benchmarks before claiming improvement.
4. Keep training and inference code separate from dataset generation so leak checks remain easy to audit.
