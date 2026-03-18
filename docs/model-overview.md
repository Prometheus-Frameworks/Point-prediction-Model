# Model Overview

## Purpose
This project projects fantasy points per game for WR/TE pass-catchers and applies deterministic scenario adjustments for trades, injuries, signings, and rookie additions.

## Architecture
- `src/types/` defines players, teams, events, scenarios, and projection output contracts.
- `src/models/baseline/wrProjection.ts` calculates the baseline PPR breakdown from player inputs.
- `src/models/adjustments/handlers/` stores one handler per supported event type.
- `src/models/adjustments/dispatchEventAdjustment.ts` is the event dispatcher that converts a `ProjectionEvent` into common `AdjustedProjectionInputs`.
- `src/models/adjustments/confidenceScore.ts` turns rule-based inputs into a numeric score and `LOW`/`MEDIUM`/`HIGH` band.
- `src/models/projection/projectPlayer.ts` orchestrates baseline projection, dispatching, recomputation, delta generation, confidence scoring, and explanation assembly.
- `src/models/scenarios/registry.ts` and `runScenario.ts` provide reusable scenario execution.

## Event dispatcher design
1. `projectPlayer` computes the baseline projection from the untouched player profile.
2. The dispatcher receives the player, prior team context, new team context, and event.
3. The dispatcher routes to the matching handler based on `event.type`.
4. Each handler returns the same `AdjustedProjectionInputs` shape:
   - adjusted player inputs
   - multiplier audit trail
   - explanation bullets
   - materially changed variable list
5. The orchestration layer recomputes the adjusted projection and passes the changed-variable list into the confidence module.

## Design principles
- Adjust underlying variables, not fantasy points directly.
- Keep changes bounded and realistic.
- Keep rookie-driven changes more modest than clearer veteran events.
- Bias teammate-injury scenarios toward target opportunity changes.
- Bias signing scenarios toward increased competition.
- Keep the system deterministic and easily testable.
