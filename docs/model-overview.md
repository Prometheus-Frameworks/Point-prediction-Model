# Model Overview

## Purpose
This MVP projects fantasy points per game for pass-catchers (wide receivers and tight ends only) and reacts to a single roster event type: `PLAYER_TRADE`.

## Architecture
- `src/types/`: Canonical interfaces for players, teams, events, and projection output.
- `src/models/baseline/wrProjection.ts`: Baseline PPR formula implementation.
- `src/models/adjustments/tradeAdjustment.ts`: Deterministic context engine that modifies player inputs when a trade occurs.
- `src/models/projection/projectPlayer.ts`: Orchestrates baseline projection, event adjustment, recalculation, and explanation output.
- `src/data/scenarios/waddleToBroncos.ts`: Hardcoded scenario data for Jaylen Waddle.
- `src/utils/`: Shared math helpers and explanation generation.
- `tests/`: Unit and scenario coverage for arithmetic, adjustment behavior, and end-to-end validity.

## MVP Boundaries
- Supports WR/TE pass-catchers only.
- No live APIs, scraping, databases, or transaction ingestion.
- No UI or service layer.
- Uses placeholder team context indices to keep the structure simple and deterministic.

## Projection Flow
1. Start from a player baseline profile.
2. Compute baseline targets, receptions, yards, touchdowns, and PPR points.
3. If a trade event exists, compare old and new team context.
4. Adjust underlying rate and volume inputs with bounded multipliers.
5. Re-run the baseline formula using adjusted inputs.
6. Return before/after outputs and human-readable explanation bullets.
