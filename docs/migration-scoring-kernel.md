# Migration note: scenario sandbox → Tiber scoring kernel

## Old repository shape
The original repository centered the execution path around deterministic scenario handling and event adjustment dispatch:
- `src/models/scenarios/*`
- `src/models/adjustments/*`
- `src/io/*`
- `src/ingestion/*`
- `src/data/scenarios/*`
- scenario-first services (`projectBatch`, `projectScenario`, `projectFromRawEvents`, etc.)

## New mission
The repository now treats **in-season fantasy scoring** as the primary product surface:
- xFPG calculators by position
- replacement baseline generation
- VORP calculation
- range outputs (floor/median/ceiling)
- confidence/volatility/fragility indicators
- practical service layer for weekly + ROS scoring

## New primary scoring path
1. Contracts and inputs in `src/contracts/scoring.ts`
2. Deterministic calculators in `src/calculators/`
3. Service orchestration in `src/services/scoring/`
4. HTTP access via `src/api/routes/scoring.ts`
5. Package exports through `src/public/index.ts`

## Legacy quarantine
Scenario-first modules are preserved for compatibility but demoted from core identity. See `src/legacy/README.md` and `src/legacy/index.ts`.

## Frontend status
`app/web/` remains available, but is not part of the engine’s primary architecture.
