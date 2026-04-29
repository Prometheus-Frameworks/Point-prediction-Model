# Repo Status Audit: Point-prediction-model

## 1. Current role
This repository currently operates as a TypeScript fantasy scoring engine with two active surfaces: (a) a scoring-first API/service kernel (xFPG, replacement baselines, VORP, weekly + ROS scoring, range/confidence tags), and (b) preserved legacy scenario/event-ingestion workflows. Evidence: README mission and architecture sections, scoring route definitions, and retained legacy modules and docs. 

## 2. Intended TIBER role
In the TIBER stack, this repo should remain the owner of projection/scoring logic and scoring-oriented contracts. It should produce deterministic scoring artifacts and confidence/range outputs that downstream TIBER-Fantasy can display in manager-facing experiences. Canonical IDs/contracts/provenance should remain governed upstream by TIBER-Data; this repo should consume governed entities and emit projection outputs plus model metadata.

## 3. Current health
**Functional but messy.**

Reason: build/tests are green (118 tests across 29 files), API + CLI + service layers are present, and scoring contracts are explicit. However, repository identity is mixed: docs and code indicate an active migration from scenario-first architecture while keeping large legacy surfaces and overlapping entrypoints alive.

## 4. What works today
- Deterministic scoring API mounted through Hono, including weekly player/batch, replacement, rankings, and ROS routes.
- Root API discovery and health endpoint are implemented.
- Programmatic service export surface exists for ingestion, scenario projection, and feature-row paths.
- CLI still supports seeded scenarios and file ingestion, with optional JSON/CSV exports.
- Broad automated validation suite exists and passes locally (`npm run build`, `npm test`).

## 5. Main risks / slop zones
- **Dual identity / architectural drift:** repository positions itself as scoring-first while preserving sizable scenario-first and ingestion-first modules, increasing cognitive and maintenance overhead.
- **Potential stale docs/paths:** integration guide includes a likely typo/case mismatch import path (`Point-prediction-Model`) and still emphasizes projection pipeline examples not aligned with scoring-first messaging.
- **Boundary blur in scope:** repo contains decision board, market comparison, diagnostics, fusion, datasets/model training, and tiber presentation layers—potentially overlapping with FORGE and other TIBER repos if not contractually bounded.
- **Artifact governance unclear:** model artifact directory currently only has `.gitkeep`; no explicit governed artifact lifecycle/publish contract visible.
- **Operational/deployment clarity gap:** no dedicated deployment runbook observed in root/docs set inspected.

## 6. Contract / ownership concerns
- **Owns today:** scoring contracts (`src/contracts/scoring.ts`, `src/contracts/tiberScoring.ts`), scoring calculators/services, and scoring API routes.
- **Consumes/depends on:** external player/team/opportunity inputs and league context (not canonicalized here).
- **Produces:** scored outputs and derived views (including “tiber scoring” transform/routes), plus optional exported local run files (`results.json/csv`, normalized event/scenario JSON).
- **Boundary risk points:**
  - With **TIBER-Data**: ID/entity/source-of-truth ownership appears external but no strict contract doc in inspected files proving enforcement.
  - With **TIBER-FORGE**: decision ranking/tiering-like logic exists here (`src/board/*`), which may overlap deterministic grading ownership.
  - With **Role-and-opportunity / Teamstate / Rookies / Age-curve**: feature and model layers may duplicate domain-signal ownership unless inputs are explicitly sourced from those repos.

## 7. Commands and validation
### Verified package scripts
- `npm run build` → `tsc --noEmit` (passed)
- `npm test` → `vitest run` (passed; 118 tests)

- `npm run start`
- `npm run dev`
- `npm run start:api`
- `npm run dev:api`

### Setup
- `npm install`

### Missing but probably needed
- Explicit lint/format scripts (`lint`, `format`, `typecheck` alias)
- Artifact publish/versioning commands for model/scoring outputs
- Contract validation command against upstream governed schemas/IDs

## 8. Best next PR
**Small, low-risk PR recommendation:** Add a concise `docs/ownership-boundaries.md` that explicitly maps this repo’s owned contracts/outputs vs consumed upstream contracts (TIBER-Data) and non-owned downstream product surfaces (TIBER-Fantasy/FORGE). Keep it documentation-only and link it from README.

## 9. Follow-up issues to create
1. **Title:** Document ownership boundaries and contract map
   - **Goal:** Create source-of-truth boundaries for owned/consumed artifacts.
   - **Why it matters:** Reduces cross-repo overlap and contract drift.
   - **Type:** Implementation (docs)

2. **Title:** Add contract compatibility check command
   - **Goal:** Introduce a script that validates scoring request/response contracts against governed schemas.
   - **Why it matters:** Prevents silent divergence from TIBER-Data / TIBER-Fantasy consumers.
   - **Type:** Implementation

3. **Title:** Audit and label legacy scenario surfaces
   - **Goal:** Mark each scenario/ingestion module as active compatibility path vs candidate deprecation.
   - **Why it matters:** Clarifies maintenance cost and roadmap sequencing.
   - **Type:** Inspect-only

4. **Title:** Add deployment/runbook doc for API service
   - **Goal:** Provide minimal production run/deploy and env variable guidance.
   - **Why it matters:** Current operational expectations are not explicit.
   - **Type:** Implementation (docs)

5. **Title:** Validate and correct integration import examples
   - **Goal:** Fix path naming inconsistencies and verify all copy-paste examples compile.
   - **Why it matters:** Prevents downstream integration friction.
   - **Type:** Implementation

## 10. Long-term fit
- **Team diagnosis:** This repo can supply trustworthy expected points, floor/ceiling ranges, and stability signals as the base layer for “why this player is fragile/stable now.”
- **Player intelligence cards:** Weekly and ROS scored outputs plus confidence/volatility tags should populate the quantitative backbone of player cards.
- **Decision board:** Scoring + VORP should feed priority/action ranking inputs; ownership with FORGE should be explicit (this repo supplies projection metrics, FORGE owns deterministic grading/tier policy).
- **Trade lab:** Consensus/market comparison and fusion modules can generate valuation deltas, but provenance of consensus inputs should come from governed data sources.
- **Waiver lab:** Replacement baselines and rankings endpoints are directly useful for waiver prioritization.
- **Weekly lab:** Batch scoring/rankings and weekly API endpoints align naturally.
- **League intelligence:** Limited direct league-intel ownership here; repo should provide model outputs that league-intel layers aggregate elsewhere.
- **Data Lab / provenance:** Should emit model version, input contract version, and source metadata references for each scored artifact (not fully evidenced as governed output yet).

## Final summary table

| Field | Status |
|---|---|
| Repo role | Scoring/projection engine with retained legacy scenario pipeline |
| Health | Functional but messy |
| Biggest risk | Dual architecture identity and ownership boundary blur |
| Best next PR | Add ownership-boundary contract doc linked from README |
| Long-term TIBER-Fantasy contribution | Quantitative projection layer for daily ownership cockpit decisions |
