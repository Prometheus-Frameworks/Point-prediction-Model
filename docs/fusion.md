# Fusion layer

## Why fusion is needed

The repository now has two useful but incomplete projection systems:

- the learned WR/TE baseline model, which is stable and calibrated from historical feature relationships
- the deterministic scenario/event engine, which reacts quickly to trades, injuries, signings, and rookie additions

Used separately, each system leaves a gap. The learned model can under-react to fresh roster news, while the scenario engine can overreact if its deterministic deltas are applied directly. The fusion layer bridges that gap by starting from the model baseline and then applying a controlled portion of the scenario delta with explicit interval and diagnostic updates.

## First-pass policy

The default policy is `bounded-fusion-v1`.

1. Generate the learned baseline point prediction and baseline empirical intervals.
2. Run the deterministic scenario engine and extract the event-driven PPR delta.
3. Weight the delta using event confidence, event clarity, and event severity.
4. Bound the weighted delta so the event engine cannot fully hijack the learned baseline.
5. Recenter intervals on the fused point prediction and widen them when event uncertainty is meaningful.
6. Recompute diagnostics from the fused interval-aware prediction.

The implementation is deterministic and typed. No new learned model family is introduced.

## Supported event types

The first pass supports the existing event types already normalized elsewhere in the repo:

- `PLAYER_TRADE`
- `TEAMMATE_INJURY`
- `PLAYER_SIGNING`
- `ROOKIE_ADDED`

## Public fused output shape

Each fused projection exposes:

- `baselinePointPrediction`
- `scenarioDelta`
- `appliedDelta`
- `fusedPointPrediction`
- `baselineIntervals`
- `fusedIntervals`
- `fusionPolicy`
- `fusionConfidence`
- `notes`
- refreshed diagnostic output for the fused context

## Limitations of the first pass

- Fusion works on top of the current baseline model and deterministic event engine only.
- The policy uses hand-tuned deterministic caps rather than a learned blending function.
- Interval widening reflects event uncertainty heuristically; it is intentionally conservative and easy to audit.
- Diagnostics are recomputed using the same row features plus fused interval-aware outputs, so feature-level event state still comes from the existing feature row and scenario engine inputs.
