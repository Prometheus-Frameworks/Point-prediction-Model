# Event adjustment fusion policy

## Chosen policy

The default fusion policy is a two-step deterministic blend:

- `weighted-fusion-v1` attenuates the raw scenario delta using event confidence, clarity, and severity.
- `bounded-fusion-v1` then caps the weighted delta using both a share of the baseline point prediction and a share of the baseline 90% interval width.

This prevents raw event deltas from dominating the learned baseline.

## Weighting logic

The weighted stage combines:

- scenario confidence score from the deterministic event engine
- event clarity
- event severity

The blended weight is clamped to a deterministic floor and ceiling so even very noisy events still have a small effect and very strong events still remain controlled.

## Bounding logic

The bounded stage computes two caps:

- `maxDeltaShareOfBaseline`: limits event movement relative to the model baseline level
- `maxDeltaShareOfIntervalWidth90`: limits event movement relative to the baseline uncertainty envelope

The tighter of the two caps is applied. This is the guardrail that keeps the scenario engine from fully hijacking the learned model.

## Interval adjustment logic

After fusion:

1. The interval center shifts to the fused point prediction.
2. The interval widths start from the baseline interval widths.
3. Extra width is added from two deterministic sources:
   - fused delta magnitude
   - event uncertainty derived from fusion weight and event clarity

The 90% band receives the largest widening, with smaller widening for the 80% and 50% bands.

## Diagnostics refresh

Diagnostics are rerun with the fused interval-aware prediction so interval width, stickiness, and fragility reflect the adjusted projection context instead of only the untouched baseline output.

## First-pass limitations

- No learned meta-model is used for blending.
- Event uncertainty is heuristic rather than statistically fit.
- The same feature row is reused when diagnostics are recomputed.
- Policy tuning is global rather than position-specific or event-specific.
