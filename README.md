# Point Prediction Model

## Purpose
Point Prediction Model is a deterministic TypeScript engine for projecting WR/TE PPR fantasy points, re-running those projections across multiple event-driven scenarios, and now ingesting raw external transaction/news-style inputs into clean canonical events before the projection engine runs.

## Supported canonical events
- `PLAYER_TRADE`
- `TEAMMATE_INJURY`
- `PLAYER_SIGNING`
- `ROOKIE_ADDED`

## Scope and constraints
- WR/TE only
- No database
- No scraping or live news ingestion
- No polling jobs
- No API routes in the modeling package
- Read-only frontend prototype now lives in `app/web/`
- No ML, Monte Carlo, or simulation
- Deterministic, typed, modular adjustment logic
- Projection logic stays separate from ingestion logic

## Architecture summary
- `src/models/baseline/` computes baseline PPR projections.
- `src/models/adjustments/handlers/` contains deterministic event-specific input adjustments.
- `src/models/adjustments/dispatchEventAdjustment.ts` routes each event to its handler.
- `src/models/adjustments/confidenceScore.ts` generates rule-based confidence scores and bands.
- `src/models/scenarios/` holds the scenario registry and scenario runner.
- `src/io/` loads scenario files and raw event files, validates inputs, and exports structured results.
- `src/ingestion/normalize/` converts raw external inputs into canonical `ProjectionEvent` objects.
- `src/ingestion/quality/` scores input quality and deduplicates near-identical normalized events.
- `src/ingestion/build/` converts normalized events into deterministic `ProjectionScenario` objects via seeded/mock lookups.
- `src/data/scenarios/` seeds reusable scenario definitions.
- `src/examples/` and `src/ingestion/examples/` contain sample scenario and raw-event inputs.

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
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.json
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.csv
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.json --export json
```

### CLI behavior
- `npm run dev` runs the default seeded scenarios.
- `npm run dev -- all` runs all seeded scenarios.
- `npm run dev -- scenario <id>` runs a single seeded scenario by id.
- `npm run dev -- file <path>` loads a JSON or CSV batch file, validates it, and runs each scenario.
- `npm run dev -- ingest <path>` loads raw external events, validates them, normalizes them, deduplicates them, and builds projection scenarios.
- `--export json` writes `results.json` for scenario runs, or both `normalized-events.json` and `normalized-scenarios.json` for ingest runs.
- `--export csv` writes `results.csv` for scenario runs.

Batch runs print a compact comparison table with baseline, adjusted, delta, and confidence columns so multiple scenarios are easy to compare in one terminal view. Ingest runs print a summary table of normalized events, quality labels, and deduped source counts.

## Raw ingestion flow
1. Parse raw JSON or CSV event files.
2. Validate the raw schema and fail clearly on invalid inputs.
3. Normalize each raw event into one of the supported canonical event types.
4. Score each normalized event for data quality based on completeness and certainty.
5. Deduplicate near-identical normalized events from multiple sources.
6. Build deterministic `ProjectionScenario` objects with seeded/mock player and team context lookups.
7. Feed those scenarios into the existing projection engine when needed.

## Validation rules
### Scenario files
Scenario files are validated before execution. Validation fails clearly when inputs include:
- duplicate scenario ids
- missing required fields
- unsupported event types
- invalid numeric ranges such as `catchRate`, `targetsPerRouteRun`, or `tdPerTarget`
- malformed nested structures for player, team, or event objects

### Raw event files
Raw event files are validated before normalization. Validation fails clearly when inputs include:
- duplicate raw event ids
- unsupported raw event types
- invalid ISO timestamps
- missing event-specific fields such as trade teams or related players for injury/signing/rookie events
- invalid numeric ranges such as `effectiveWeek` or `severity`

## Documentation
- `docs/model-overview.md`
- `docs/formulas.md`
- `docs/scenarios.md`
- `docs/batch-usage.md`
- `docs/ingestion.md`
- `docs/diagnostics.md`
- `docs/regression-signals.md`
- `app/web/README.md` for the read-only decision-board frontend

## Frontend decision board
A read-only React + TypeScript + Vite frontend now lives in `app/web/`. It renders a decision board with fused projections, interval summaries, diagnostics, fusion notes, and market edge context using static example data drawn from the repository's existing sample outputs.

### Run the frontend
```bash
cd app/web
npm install
npm run dev
```

### Frontend integration plan
The frontend is intentionally static in this PR. Future work should map service-layer outputs such as fused projections, diagnostics, and market-edge comparisons into the UI's display model instead of adding database or auth infrastructure.

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

### Raw event ingestion
1. Create a JSON or CSV file that matches the raw event schema documented in `docs/ingestion.md`.
2. Prefer explicit `certainty`, `effectiveWeek`, and `severity` values so the normalized event earns a higher quality score.
3. Include duplicate reports from multiple sources when you want dedupe behavior to collapse them into one canonical event.
4. Run `npm run dev -- ingest <path>` to validate, normalize, dedupe, and inspect the generated event summary.
5. Add `--export json` when you want `normalized-events.json` and `normalized-scenarios.json` artifacts for downstream review.
