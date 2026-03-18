# Formulas

## Baseline pass-catcher projection
The baseline model uses player-level usage and efficiency rates.

- `targetsPerGame = routesPerGame * targetsPerRouteRun`
- `receptions = targetsPerGame * catchRate`
- `yards = targetsPerGame * yardsPerTarget`
- `TDs = targetsPerGame * tdPerTarget`
- `PPR points = receptions + yards * 0.1 + TDs * 6 + rushPointsPerGame`

## Trade adjustment philosophy
Trade events should change the inputs that drive fantasy scoring rather than directly adding or subtracting fantasy points.

### Inputs adjusted by team context
- **Play volume + pass rate** adjust `routesPerGame` through a combined volume multiplier.
- **Target competition** adjusts `targetsPerRouteRun`.
- **Quarterback efficiency** adjusts both `catchRate` and `yardsPerTarget`.
- **Passing touchdown environment** adjusts `tdPerTarget`.

## Bounded multiplier framework
Each adjustment is derived from the relative change between the old and new team indices.

`rawDelta = (newIndex - oldIndex) / oldIndex`

`multiplier = clamp(1 + rawDelta * sensitivity, 1 - cap, 1 + cap)`

This keeps the MVP deterministic and prevents unrealistic swings from any single team-context dimension.
