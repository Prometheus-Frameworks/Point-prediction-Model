# Point Prediction Model

## Purpose
Point Prediction Model is a deterministic TypeScript engine for projecting WR/TE PPR fantasy points and re-running those projections across multiple event-driven scenarios, including batch execution from scenario files.

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
- `src/models/scenarios/` holds the scenario registry and scenario runner.
- `src/io/` loads scenario files, validates inputs, and exports structured results.
- `src/data/scenarios/` seeds reusable scenario definitions.
- `src/examples/` contains sample JSON and CSV batch inputs.

## CLI usage
```bash
npm install
npm run dev
npm run dev -- all
npm run dev -- scenario waddle-to-broncos
npm run dev -- file ./src/examples/scenarios.sample.json
npm run dev -- file ./src/examples/scenarios.sample.csv
npm run dev -- file ./src/examples/scenarios.sample.json --export json
npm run dev -- file ./src/examples/scenarios.sample.csv --export csv
```

### CLI behavior
- `npm run dev` runs the default seeded scenarios.
- `npm run dev -- all` runs all seeded scenarios.
- `npm run dev -- scenario <id>` runs a single seeded scenario by id.
- `npm run dev -- file <path>` loads a JSON or CSV batch file, validates it, and runs each scenario.
- `--export json` writes `results.json`.
- `--export csv` writes `results.csv`.

Batch runs print a compact comparison table with baseline, adjusted, delta, and confidence columns so multiple scenarios are easy to compare in one terminal view.

## Validation rules
Scenario files are validated before execution. Validation fails clearly when inputs include:
- duplicate scenario ids
- missing required fields
- unsupported event types
- invalid numeric ranges such as `catchRate`, `targetsPerRouteRun`, or `tdPerTarget`
- malformed nested structures for player, team, or event objects

## Documentation
- `docs/model-overview.md`
- `docs/formulas.md`
- `docs/scenarios.md`
- `docs/batch-usage.md`

## How to test
```bash
npm test
npm run build
```

## How to add scenarios
### Seeded scenarios
1. Create a new file in `src/data/scenarios/` that exports a `ProjectionScenario`.
2. Fill in `metadata`, `player`, `previousTeamContext`, `newTeamContext`, and `event`.
3. Keep the event deterministic and bounded by changing underlying player inputs rather than fantasy points directly.
4. Register the scenario in `src/models/scenarios/registry.ts`.
5. Add or update tests if the scenario introduces new edge cases.

### Batch file scenarios
1. Prefer JSON arrays of `ProjectionScenario` objects.
2. Use the documented flattened CSV schema only as a convenience format.
3. Validate your file quickly with `npm run dev -- file <path>` before exporting results.
4. Use `--export json` or `--export csv` when you need structured outputs for comparison or downstream review.
