# Composite signals

The composite signal layer is the core ranking input for the decision board. Its job is to capture directional strength without blindly averaging every upstream output.

## How composite scores are formed

The composite signal score combines several pieces with explicit roles:

1. **Market component**
   - Uses trust-adjusted market-edge magnitude when available.
   - Strong disagreement matters more than tiny market deltas.

2. **Regression component**
   - Uses the net of `regressionUpScore - regressionDownScore`.
   - This preserves directional pressure instead of treating up/down diagnostics as independent positive signals.

3. **Fusion component**
   - Uses the signed applied scenario delta from the fusion layer.
   - This captures whether the event-aware overlay is materially moving the projection.

4. **Support / penalty modifiers**
   - Stickiness adds support.
   - Fragility subtracts support.
   - Wide intervals subtract support.
   - Aligned market/regression/fusion directions receive a bonus.
   - Mixed directions receive a penalty.

This means the board does **not** simply average everything together. A row can score well only when the major components either align or remain strong enough to overcome the penalty structure.

## Why not average all outputs?

A plain average would be misleading because:

- `regressionUpScore` and `regressionDownScore` are directional opposites,
- stickiness and fragility are not independent “positive” features,
- interval width should mostly act as a suppressor, not as another additive score,
- event deltas should influence the score without overwhelming the learned baseline,
- market disagreement should matter more when it is large and trust-adjusted.

## Trustworthiness penalties

Trustworthiness is explicitly designed to penalize:

- wide 90% intervals,
- high fragility,
- noisy or low-clarity event contexts.

It is also supported by:

- stickier roles,
- higher fusion confidence,
- stronger market trust adjustment multipliers.

## Actionability construction

Actionability is downstream-facing. It converts signal + confidence into a practical “should I care?” score.

It increases with:

- larger composite signals,
- higher trustworthiness,
- larger market disagreement.

It decreases with:

- wide intervals,
- neutral direction,
- weak overall support.

A row can therefore have a decent composite signal but still land in `WATCHLIST` or `CAUTION` if confidence is not high enough.

## Deterministic aggregation limitations

This aggregation layer has important deterministic limitations:

- weights are hand-authored policy constants,
- thresholds are easier to audit but not automatically optimal,
- the layer assumes upstream diagnostics are already calibrated enough to compare on stable scales,
- missing market rows cause the composite to rely more heavily on diagnostics and fusion,
- future model families may require re-tuning of these deterministic thresholds.

The intended use is to provide a transparent, typed, machine-friendly surface for ranking and filtering—not to create a hidden black-box model behind the model.
