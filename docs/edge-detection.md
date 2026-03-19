# Edge detection

## Overview

The edge-detection layer takes a raw model-vs-consensus disagreement and applies trust adjustments before surfacing the result to downstream systems.

The objective is simple: **do not treat every disagreement as equally actionable**.

Outputs include:

- `rawEdgeScore`
- `trustAdjustedEdgeScore`
- `edgeDirection`
- machine-readable `flags`
- human-readable `explanation`
- a `trustAdjustment` breakdown with explicit penalty components

## How trust-adjusted edge scores work

Raw edges are based on the absolute points delta, with an optional rank bonus when both model rank and consensus rank are available.

Trust adjustment then reduces confidence when supporting evidence is weak.

### Penalty sources

The scorer currently downgrades edge confidence when available inputs indicate:

- **wide uncertainty intervals**: large 90% prediction ranges reduce confidence that the point estimate is stable,
- **high fragility**: diagnostics with elevated fragility reduce the trust multiplier,
- **event uncertainty**: low-clarity or high-severity event-driven projections are penalized,
- **weak calibration support**: poor overall interval coverage or bucket bias lowers confidence,
- **weak subgroup support**: shaky relevant subgroups such as event, rookie, or low-sample buckets reduce confidence.

The final `trustAdjustedEdgeScore` is the raw score multiplied by a deterministic confidence multiplier.

## Flags

The layer emits machine-readable flags designed for downstream systems.

Current flags:

- `EDGE_ABOVE_MARKET_STRONG`
- `EDGE_BELOW_MARKET_STRONG`
- `EDGE_WEAK_HIGH_UNCERTAINTY`
- `EDGE_SUPPORTED_BY_USAGE`
- `EDGE_UNSUPPORTED_FRAGILE_EFFICIENCY`
- `EDGE_EVENT_DRIVEN_CAUTION`

These flags make it easier to:

- rank alerts,
- suppress noisy disagreements,
- highlight edges supported by volume,
- label fragile efficiency-driven fades, and
- call out event-driven signals that deserve manual review.

## Downstream usage guidance

Downstream consumers can use the outputs in several ways:

- surface `trustAdjustedEdgeScore` instead of the raw score in alerting systems,
- use `rawDelta` and `edgeDirection` for sorting and grouping,
- filter or de-prioritize edges with `EDGE_WEAK_HIGH_UNCERTAINTY`,
- require corroborating flags like `EDGE_SUPPORTED_BY_USAGE` before escalating,
- display `explanation` bullets in analyst tooling or audit logs.

## Realistic scenarios included

`src/market/examples/sampleConsensusComparison.ts` includes deterministic examples for:

- a strong above-market edge,
- a strong below-market edge,
- an edge downgraded because uncertainty is high,
- an event-driven edge with caution.

## Limitations

This PR does not add live market ingestion, new learned model families, or any UI layer.

Trust adjustment is only as strong as the inputs provided. If interval, calibration, subgroup, or diagnostics data are missing, the scorer preserves deterministic output but cannot apply the same degree of context-aware downgrading.
