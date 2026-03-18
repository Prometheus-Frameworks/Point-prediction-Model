# Formulas and Adjustment Logic

## Baseline pass-catcher projection
- `targetsPerGame = routesPerGame * targetsPerRouteRun`
- `receptionsPerGame = targetsPerGame * catchRate`
- `yardsPerGame = targetsPerGame * yardsPerTarget`
- `tdsPerGame = targetsPerGame * tdPerTarget`
- `pprPointsPerGame = receptionsPerGame + yardsPerGame * 0.1 + tdsPerGame * 6 + rushPointsPerGame`

## Shared adjustment rule
The engine changes the variables that feed the baseline formula, then recomputes projection output.

## Event-specific logic
### `PLAYER_TRADE`
- Reuses PR1-style team-context multipliers.
- `routesPerGame` responds to play volume and pass rate.
- `targetsPerRouteRun` responds to target competition.
- `catchRate` and `yardsPerTarget` respond to QB efficiency.
- `tdPerTarget` responds to passing touchdown environment.

### `TEAMMATE_INJURY`
- Mostly boosts `targetsPerRouteRun`.
- Gives only a slight `routesPerGame` increase.
- Adds a small `tdPerTarget` boost for vacated scoring chances.

### `PLAYER_SIGNING`
- Mostly reduces `targetsPerRouteRun` through extra competition.
- Slightly reduces routes and touchdown share.
- Allows only a very small efficiency movement.

### `ROOKIE_ADDED`
- Applies a modest competition penalty.
- Keeps route and efficiency changes small.
- Deliberately preserves more uncertainty than cleaner event types.

## Confidence scoring rules
The confidence score is a deterministic weighted formula:
- sample size contribution from `player.sampleSizeGames`
- event clarity contribution from `event.clarity`
- event-type reliability bonus
- penalty for each materially changed variable beyond the first two
- penalty for event severity extremes, which imply more volatility

The final value is clamped to `0-100` and mapped to:
- `LOW` for scores below `55`
- `MEDIUM` for scores `55-74`
- `HIGH` for scores `75+`
