# Tiber Fantasy Scoring Engine

## Mission
This repository is now a **scoring-first kernel** for in-season fantasy football decisions. The core output is practical player-level scoring with deterministic, typed interfaces built around:
- xFPG / expected fantasy points
- replacement-level baselines
- VORP
- weekly and ROS scoring utilities
- range outputs (`floor`, `median`, `ceiling`)
- stability indicators (`confidence_band`, `volatility_tag`, `fragility_tag`)

## Architecture (scoring-first)
- `src/contracts/` canonical request/output contracts
- `src/core/` scoring constants and shared math helpers
- `src/calculators/xfpg/` position-native xFPG calculators (QB / RB / WR-TE)
- `src/calculators/replacement/` replacement baseline calculators
- `src/calculators/vorp/` VORP calculators
- `src/calculators/range/` floor/median/ceiling and stability profile calculators
- `src/services/scoring/` single-player, batch, rankings, replacement, and ROS services
- `src/api/routes/scoring.ts` service API routes

## Legacy modules
Scenario-first infrastructure is preserved but intentionally demoted from the primary execution identity:
- `src/models/scenarios/`
- `src/models/adjustments/`
- `src/ingestion/`
- `src/io/`
- scenario-oriented services in `src/services/`

See `docs/migration-scoring-kernel.md` and `src/legacy/README.md`.

## API endpoints (primary)
- `POST /api/scoring/weekly/player`
- `POST /api/scoring/weekly/batch`
- `POST /api/scoring/replacement`
- `POST /api/scoring/weekly/rankings`
- `POST /api/scoring/ros`

Legacy scenario endpoints are still available for compatibility.

## Development
```bash
npm install
npm run build
npm test
npm run dev:api
```

## Frontend
`app/web/` is retained as a non-core/legacy companion app and is not the architectural center of this repository.
