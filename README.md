# Point Prediction Model

## Purpose
Point Prediction Model is a deterministic TypeScript engine for projecting WR/TE PPR fantasy points, re-running those projections across multiple event-driven scenarios, and ingesting raw external transaction/news-style inputs into clean canonical events before the projection engine runs.

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
- CLI and HTTP API entrypoints are kept separate so the modeling package stays reusable
- Read-only frontend prototype lives in `app/web/`
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
- `app/web/` contains the standalone frontend app.

## Local development

### Backend CLI
```bash
npm install
npm run dev
```

Optional CLI examples:
```bash
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

### Backend API
```bash
npm install
npm run dev:api
```

Local API examples:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/decision-board/mock
curl http://localhost:3000/api/scenarios
```

### Frontend
```bash
cd app/web
npm install
npm run dev
```

The frontend reads `VITE_API_BASE_URL` for future API-backed views, but it can continue rendering mock data during this separation-focused phase.

## Railway deployment
This repo is intended to run as two separate Railway services from the same repository.

### API service
- **Root Directory:** `/`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:api`

Environment:
- `PORT` is provided by Railway.
- Copy `.env.example` for local parity when running the API outside Railway.

### Frontend service
- **Root Directory:** `app/web`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview -- --host 0.0.0.0 --port $PORT`

Environment:
- `VITE_API_BASE_URL` should point to the deployed API service URL.
- Copy `app/web/.env.example` for local development defaults.

## Environment variables
### API service
- `PORT=3000` locally by default, or Railway-provided `PORT` in deployment.

### Frontend service
- `VITE_API_BASE_URL=http://localhost:3000` for local development.
- Future frontend API calls should read from `VITE_API_BASE_URL` instead of hardcoding backend URLs.

## Project boundaries
- Backend/library/API code lives under `src/`.
- Frontend code lives under `app/web/`.
- Backend must not import from `app/web/`.
- Frontend must not import runtime server code from `src/server.ts`.
- Frontend should consume backend functionality over HTTP responses, not backend internals.
- The root package is responsible only for backend/library CLI and API workflows.
- The frontend package keeps its own `dev`, `build`, and `preview` lifecycle inside `app/web/`.

## API behavior
- The API server entrypoint lives at `src/server.ts`.
- The server listens on `process.env.PORT` and falls back to `3000` locally.
- Minimal CORS is enabled for `/health` and `/api/*` so the local frontend can call the API during development.
- `GET /health` returns a Railway-friendly JSON health payload.
- `GET /api/decision-board/mock` returns the seeded mock decision-board dataset built from the existing service-layer sample output.
- `GET /api/scenarios` returns an index of the seeded scenario registry.
- `POST /api/project/scenarios` accepts a `ProjectionScenario[]` payload or `{ "scenarios": [...] }` and returns `projectBatch(...)` results.

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
- `app/web/README.md` for frontend-specific workflows

## How to test
```bash
npm test
npm run build
```

## Entry points
- `npm run dev` / `npm start` keep the CLI workflow in `src/index.ts`.
- `npm run dev:api` / `npm run start:api` run the Hono API server in `src/server.ts`.
- `cd app/web && npm run dev` / `npm run build` / `npm run preview` stay within the frontend package.

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
