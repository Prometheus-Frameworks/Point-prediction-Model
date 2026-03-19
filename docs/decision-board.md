# Decision board

The decision board is a deterministic aggregation layer that turns fused projections, prediction intervals, diagnostics, and market-comparison outputs into a single ranked surface for downstream consumers.

## Purpose

The board exists to answer a practical question: **which WR/TE outputs actually matter right now?**

Instead of forcing downstream systems to separately interpret:

- fused point projections,
- uncertainty intervals,
- regression-up and regression-down diagnostics,
- stickiness and fragility context, and
- market disagreement,

this layer produces one machine-readable row per player/scenario with consistent scores, tiers, tags, and reasons.

## Decision-board row fields

Each row can expose:

- `fusedPointPrediction`
- `intervalLower` / `intervalUpper` / `intervalWidth90`
- `marketEdgeScore`
- `regressionUpScore`
- `regressionDownScore`
- `stickinessScore`
- `fragilityScore`
- `compositeSignalScore`
- `actionabilityScore`
- `trustworthinessScore`
- `actionTier`
- `direction`
- `decisionTags`
- `decisionReasons`

## Direction

Directional output is intentionally simple:

- `UPSIDE`
- `DOWNSIDE`
- `NEUTRAL`

Direction is derived from a weighted directional signal that considers trust-adjusted market disagreement, net regression pressure (`up - down`), and the signed fused scenario delta. Small mixed signals resolve to `NEUTRAL` instead of forcing a fake conviction call.

## Action tiers

The board uses five tiers:

- `ELITE_SIGNAL`: high-conviction, high-confidence rows with strong composite signal and enough trust to matter immediately.
- `STRONG_SIGNAL`: meaningful directional signal with usable confidence, but not at the absolute top of the surface.
- `WATCHLIST`: directional signal exists, but it needs more confirmation or better market support.
- `CAUTION`: something notable is present, but uncertainty, fragility, or mixed evidence limits usefulness.
- `PASS`: low-value noise, weak magnitude, or neutral output that should usually be ignored downstream.

## Trustworthiness vs. actionability

These two scores are related but not interchangeable.

### Trustworthiness

Trustworthiness estimates how much confidence the system should place in the row **before deciding whether the row is important enough to act on**.

It is boosted by:

- projection stickiness,
- fusion confidence, and
- market trust adjustment support.

It is penalized by:

- wide prediction intervals,
- fragility, and
- noisy event context.

### Actionability

Actionability estimates whether a consumer should actually care right now.

It depends on:

- composite signal magnitude,
- trustworthiness,
- directional clarity, and
- market disagreement magnitude.

It is penalized when the interval is too wide or the signal resolves to `NEUTRAL`.

In short:

- **trustworthiness** asks, “how believable is this row?”
- **actionability** asks, “is this believable row important enough to escalate?”

## Deterministic tags and reasons

The board also emits machine-readable tags such as:

- `HIGH_CONFIDENCE_UPSIDE`
- `USAGE_BACKED_EDGE`
- `EVENT_BOOST_WITH_CAUTION`
- `FRAGILE_EFFICIENCY_RISK`
- `MARKET_DISAGREEMENT_STRONG`
- `WIDE_INTERVAL_LIMITATION`
- `STICKY_ROLE_SUPPORT`
- `LOW_ACTIONABILITY_NOISE`

And it emits deterministic bullet reasons that summarize:

- the direction and score stack,
- whether the market disagrees,
- whether diagnostics lean up or down,
- whether an event is materially driving the output, and
- whether uncertainty controls are suppressing conviction.

## Ranking and filtering

The ranking layer supports:

- deterministic sorting,
- direction filtering,
- tag inclusion/exclusion filters,
- minimum score thresholds, and
- batch ranking with stable rank assignment.

Default sort priority favors:

1. action tier,
2. actionability,
3. composite signal,
4. trustworthiness,
5. absolute market-edge magnitude,
6. fused point projection.

## Limitations

This layer is intentionally deterministic and modular, but it still has limits:

- it is not a new learned model family,
- it does not discover hidden nonlinear interactions beyond the upstream signals it receives,
- score weights are policy choices rather than statistically optimized coefficients,
- downstream consumers should not mistake a high score for certainty,
- strong event-driven projections can still be downgraded sharply by uncertainty and fragility,
- missing market inputs reduce the amount of disagreement context available.

The decision board should be treated as a **policy layer over existing outputs**, not as a replacement for upstream modeling and interval estimation.
