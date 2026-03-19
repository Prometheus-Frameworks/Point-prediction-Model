# Market comparison

## Overview

The market comparison layer compares each WR/TE projection against a consensus-style baseline input rather than assuming every model disagreement is automatically actionable.

A comparison record lines up one model projection with one consensus input using `rowId`, then emits:

- `modelPoints`
- `consensusPoints`
- `rawDelta`
- `rawEdgeScore`
- `edgeDirection`

This layer is deterministic and typed, and it does **not** depend on live market scraping or any external API. Consensus inputs are expected to be supplied by downstream systems or batch pipelines.

## Consensus input contract

`src/market/types/consensusInput.ts` defines a generic contract that works for sportsbook-style baselines, rank aggregators, internal market snapshots, or manually curated files.

Required fields:

- `rowId`
- `playerId`
- `playerName`
- `source`
- `consensusPoints`

Optional fields:

- `consensusRank`
- `timestamp`

## What consensus comparison means

Consensus comparison measures how far the repo's projection sits above or below the supplied baseline.

- Positive `rawDelta` means the model is **above** the market.
- Negative `rawDelta` means the model is **below** the market.
- Small deltas are treated as `in_line` rather than forced into an edge label.

The raw comparison intentionally does **not** claim that a disagreement is correct or tradable. It only describes the size and direction of the disagreement.

## Services

Two service-layer entrypoints are available:

- `compareProjectionToConsensusService`: joins projections and consensus inputs by `rowId`, then returns raw comparison outputs plus unmatched identifiers.
- `scoreMarketEdgesService`: performs the same join, then computes trust-adjusted scores, flags, and explanations.

Both services are structured for downstream automation and return standard service envelopes.

## Limitations

This layer does not use live market state, injury-feed polling, or timestamp freshness modeling beyond the optional consensus timestamp field.

That means non-live consensus inputs can become stale in at least three ways:

1. the baseline may have moved after the file was created,
2. player context may have changed after the projection snapshot, and
3. the consensus source may represent a partial market instead of a broad average.

Downstream systems should treat the comparison as a snapshot-to-snapshot evaluation, not as proof of current executable value.
