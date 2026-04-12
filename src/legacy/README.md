# Legacy scenario-first modules

This folder documents modules that are retained for backward compatibility but are no longer the primary engine path.

Primary scoring path now lives in:
- `src/contracts/`
- `src/calculators/`
- `src/services/scoring/`
- `src/api/routes/scoring.ts`

Legacy modules remain under their historical locations (`src/models/scenarios`, `src/models/adjustments`, `src/ingestion`, `src/io`, and scenario-oriented services) and should be considered compatibility surfaces while downstream consumers migrate.
