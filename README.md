# Point Prediction Model

## Purpose
Point Prediction Model is a deterministic TypeScript engine for projecting WR/TE PPR fantasy points and re-running those projections across multiple event-driven scenarios.

## Supported events
- `PLAYER_TRADE`
- `TEAMMATE_INJURY`
- `PLAYER_SIGNING`
- `ROOKIE_ADDED`

## Scope and constraints
- WR/TE only
- No database
- No scraping or live news ingestion
- No API routes or UI
- No ML, Monte Carlo, or simulation
- Deterministic, typed, modular adjustment logic

## Architecture summary
- `src/models/baseline/` computes baseline PPR projections.
- `src/models/adjustments/handlers/` contains deterministic event-specific input adjustments.
- `src/models/adjustments/dispatchEventAdjustment.ts` routes each event to its handler.
- `src/models/adjustments/confidenceScore.ts` generates rule-based confidence scores and bands.
- `src/models/scenarios/` holds the scenario registry and runner.
- `src/data/scenarios/` seeds reusable scenario definitions.

## How to run
```bash
npm install
npm run dev
npm run dev -- all
npm run dev -- waddle-to-broncos
```

The default `npm run dev` command lists available scenarios and runs the default subset.

## How to test
```bash
npm test
npm run build
```

## How to add scenarios
1. Create a new file in `src/data/scenarios/` that exports a `ProjectionScenario`.
2. Fill in `metadata`, `player`, `previousTeamContext`, `newTeamContext`, and `event`.
3. Keep the event deterministic and bounded by changing underlying player inputs rather than fantasy points directly.
4. Register the scenario in `src/models/scenarios/registry.ts`.
5. Add or update tests if the scenario introduces new edge cases.
