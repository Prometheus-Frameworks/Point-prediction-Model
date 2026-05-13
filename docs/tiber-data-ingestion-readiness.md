# TIBER-Data ingestion readiness report

## Purpose
This inspection prepares the next implementation step for wiring Point-prediction-model to consume governed TIBER-Data inputs and later emit projection artifacts that TIBER-FORGE can audit.

This is an inspect-only report. It does **not** change scoring logic, grading policy, source identity ownership, or ingestion behavior.

## Current repo architecture summary

### Primary scoring path
The active scoring-first path is already separated from the older scenario sandbox:

1. **Contracts:** `src/contracts/scoring.ts` defines the scoring request/response contracts and `src/contracts/tiberScoring.ts` defines TIBER-facing player-card/ranking/compare view types.
2. **Calculators:** `src/calculators/xfpg/`, `src/calculators/replacement/`, `src/calculators/vorp/`, and `src/calculators/range/` compute expected points, replacement baselines, VORP, ranges, and stability labels.
3. **Services:** `src/services/scoring/` orchestrates weekly player, weekly batch, replacement, rankings, ROS, and TIBER view transformations.
4. **HTTP routes:** `src/api/routes/scoring.ts` exposes `/api/scoring/*`; `src/api/routes/tiberScoring.ts` exposes `/api/tiber/*` presentation-oriented scoring views.
5. **Package exports:** `src/public/index.ts` exports scoring contracts, scoring services, TIBER view services, and still exports many legacy/scenario/model-training surfaces.

The most direct scoring flow today is:

`WeeklyScoringRequest` → `scoreWeeklyBatchService` / `scoreWeeklyPlayerService` → `calculateExpectedPoints` → `resolveReplacementPoints` → `calculateRangeProfile` / `calculateStabilityScore` → `ScoredPlayerOutput` → optional `toTiber*` transforms.

### Legacy/scenario surfaces that should not be expanded
The following paths are retained for backward compatibility and should not be expanded as the TIBER-Data integration path unless needed for compatibility labeling or migration support:

- `src/models/scenarios/*`
- `src/models/adjustments/*`
- `src/ingestion/*`
- `src/io/*` scenario/raw-event loaders and exporters
- Scenario-oriented services such as `projectScenario`, `projectBatch`, `projectFromRawEvents`, `buildScenarios`, and fused scenario/model services
- `src/data/scenarios/*` fixture-like scenario examples
- `app/web/`, which README identifies as a non-core/legacy companion app

These paths can remain available, but TIBER-Data consumption should be introduced through a thin, explicit adapter into scoring contracts rather than broadening the scenario-first ingestion pipeline.

## Current scoring inputs

### `PlayerOpportunityInput`
Current scoring expects model-ready opportunity and efficiency fields, not governed upstream records. Required fields are:

- `player_id`
- `player_name`
- `team`
- `position`
- `games_sampled`

Optional identity/context fields:

- `week`
- `season`
- `injury_risk`

Optional QB fields:

- `pass_attempts_pg`
- `pass_yards_per_attempt`
- `pass_td_rate`
- `interception_rate`
- `rush_attempts_pg`
- `designed_rush_attempts_pg`
- `scramble_rush_attempts_pg`
- `goal_line_rush_attempts_pg`
- `rush_yards_per_attempt`
- `rush_td_rate`

Optional pass-catcher fields:

- `route_participation`
- `routes_pg`
- `targets_per_route`
- `first_read_target_share`
- `air_yards_per_target`
- `end_zone_targets_pg`
- `red_zone_target_share`
- `catch_rate`
- `yards_per_target`
- `receiving_td_rate`

Optional RB/rushing-receiving fields:

- `carries_pg`
- `inside_10_carries_pg`
- `rush_td_opportunity`
- `receiving_role_strength`
- `targets_pg`
- `yards_per_carry`
- `yards_per_reception`

Optional stability fields:

- `role_stability`
- `td_dependency`

### `LeagueContextInput`
Current scoring also requires league context:

- `teams`
- `starters.QB`
- `starters.RB`
- `starters.WR`
- `starters.TE`

Optional league context:

- `starters.FLEX`
- `flex_allocation.RB`
- `flex_allocation.WR`
- `flex_allocation.TE`
- `replacement_buffer`

### Replacement inputs
Replacement can be derived from:

- `comparison_pool` when enough players are supplied,
- `replacement_points_override`, or
- deterministic league-default replacement tables.

No current scoring contract requires an upstream source manifest, input artifact id, schema version, provenance reference, or TIBER-Data dataset id.

## TIBER-Data consumption status

No direct TIBER-Data ingestion appears to be wired in the inspected scoring path.

What exists today:

- Scoring contracts accept already-normalized opportunity fields.
- API routes trust request JSON shape only lightly; they check that required top-level objects exist but do not validate governed upstream schemas.
- Legacy `src/ingestion/*` and `src/io/*` paths load local raw event/scenario JSON/CSV files, validate local schemas, and export scenario-run results. These are not TIBER-Data-governed inputs.
- Model artifact loading exists for WR/TE baseline inference, but artifact governance and publish lifecycle are not tied to TIBER-Data or FORGE contracts.
- TIBER-facing routes and transforms build player-card/ranking/compare views from scoring outputs, but these are presentation-shaped responses rather than durable audit artifacts.

Conclusion: the next implementation should not modify scoring math. It should add a narrow adapter/contract layer that maps a governed TIBER-Data projection input bundle into `WeeklyScoringRequest` / `RosScoringRequest`, preserving upstream identity and provenance as references without claiming ownership.

## Existing docs mentioning gaps or boundary concerns

Current docs already identify several missing or incomplete areas relevant to this work:

- `docs/ownership-boundaries.md` says direct wiring is incomplete and exact source-path usage needs verification.
- `docs/ownership-boundaries.md` says canonical IDs, source truth, and provenance governance belong to TIBER-Data.
- `docs/ownership-boundaries.md` says deterministic grading/tiering policy belongs to TIBER-FORGE.
- `docs/ownership-boundaries.md` flags artifact lifecycle/publishing behavior, local player/team mappings, UI logic, and deterministic grading/tiering behavior as boundary-risk areas.
- `REPO_STATUS_AUDIT.md` says artifact governance is unclear and no explicit governed artifact lifecycle/publish contract was observed.
- `REPO_STATUS_AUDIT.md` calls out the missing contract validation command against upstream governed schemas/IDs.
- `REPO_STATUS_AUDIT.md` says Data Lab/provenance should include model version, input contract version, and source metadata references for each scored artifact, but that governed output is not fully evidenced yet.
- `docs/model-training.md` and `docs/uncertainty.md` describe model artifact save/load and uncertainty metadata, but not a governed projection-artifact lifecycle for downstream FORGE review.

## Missing contract and artifact pieces

### Missing input contract pieces
Add an explicit TIBER-Data adapter contract before implementation of any data consumption. At a high level, the input bundle should carry:

- `input_contract_version`: version of the adapter contract in this repo.
- `tiber_data_schema_version`: upstream governed schema version, supplied by TIBER-Data.
- `source_dataset_refs`: references to TIBER-Data artifacts/datasets used to produce the bundle.
- `identity_ref`: source-backed canonical player/team identity reference from TIBER-Data.
- `player_opportunities`: governed records that can be mapped to `PlayerOpportunityInput` without inventing fields.
- `league_context`: governed or caller-supplied league settings mapped to `LeagueContextInput`.
- `missing_fields`: explicit list of unavailable upstream fields required or desired by scoring.
- `adapter_warnings`: non-fatal mapping/coverage issues.

Do **not** make this repo infer canonical IDs, source truth, or provenance. If TIBER-Data does not supply a field, the adapter should mark it missing/unavailable and either omit the optional scoring field or fail validation for required fields.

### Missing validation pieces
Needed before runtime ingestion is considered safe:

- Runtime validation for the adapter input bundle.
- Runtime validation that every emitted projection artifact includes required provenance references and contract versions.
- A script or test that validates sample TIBER-Data fixtures against the adapter contract.
- Explicit fixtures labeled as fixtures, not source truth.

### Missing artifact lifecycle pieces
Needed for downstream FORGE audit:

- Durable projection artifact contract(s).
- Artifact naming and versioning convention.
- Manifest tying output artifacts to input dataset refs, scoring contract versions, model/artifact versions, and generation time.
- Stable artifact writer/export path for scoring outputs, separate from legacy scenario CSV/JSON exports.
- Policy that FORGE consumes projection artifacts and owns grading/tiering, while this repo emits only model/scoring facts and explanatory metadata.

## Recommended projection artifacts for FORGE review

These are high-level shapes only; exact fields should be finalized after TIBER-Data confirms the governed upstream schema.

### `projection-run-manifest.json`
Run-level audit envelope.

High-level shape:

```ts
{
  artifact_type: 'projection_run_manifest';
  artifact_version: 'projection-run-manifest-v1';
  generated_at: string;
  run_id: string;
  input_contract_version: string;
  scoring_contract_version: string;
  tiber_data_schema_version: string;
  source_dataset_refs: Array<{ dataset_id: string; version: string; uri?: string }>;
  model_refs: Array<{ model_name: string; artifact_version: string; artifact_uri?: string }>;
  outputs: Array<{ artifact_type: string; path: string; row_count: number }>;
  warnings: string[];
  missing_fields: Array<{ field: string; reason: string; impact: string }>;
}
```

### `weekly-player-projections.jsonl`
Player-week projection facts. This should be the primary artifact FORGE evaluates.

High-level row shape:

```ts
{
  artifact_type: 'weekly_player_projection';
  artifact_version: 'weekly-player-projection-v1';
  run_id: string;
  player_id: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  season?: number;
  week?: number;
  expected_points: number;
  replacement_points: number;
  vorp: number;
  floor: number;
  median: number;
  ceiling: number;
  confidence_band: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility_tag: 'STABLE' | 'MODERATE' | 'VOLATILE';
  fragility_tag: 'LOW' | 'MEDIUM' | 'HIGH';
  role_notes: string[];
  input_refs: string[];
}
```

### `ros-player-projections.jsonl`
Rest-of-season projection facts.

High-level row shape extends weekly projection facts with:

```ts
{
  remaining_weeks: number;
  ros_expected_points: number;
  ros_vorp: number;
}
```

### `replacement-baselines.json`
Replacement baseline facts used during scoring.

High-level shape:

```ts
{
  artifact_type: 'replacement_baselines';
  artifact_version: 'replacement-baselines-v1';
  run_id: string;
  league_context_ref?: string;
  baselines: Record<'QB' | 'RB' | 'WR' | 'TE', {
    replacement_points: number;
    replacement_rank: number;
    sample_size: number;
  }>;
}
```

### `projection-input-coverage.json`
Adapter coverage, missing-field, and warning report.

High-level shape:

```ts
{
  artifact_type: 'projection_input_coverage';
  artifact_version: 'projection-input-coverage-v1';
  run_id: string;
  total_players: number;
  mapped_players: number;
  skipped_players: number;
  missing_fields: Array<{ player_id?: string; field: string; severity: 'required' | 'optional'; reason: string }>;
  adapter_warnings: string[];
}
```

FORGE can audit these artifacts for completeness, consistency, confidence/range behavior, and policy inputs. FORGE should not depend on this repo to assign action tiers or grades.

## Risks and slop zones

- **Identity/provenance drift:** current scoring accepts `player_id`, `player_name`, and `team` as plain strings. Without governed refs, this repo could accidentally become an identity/source-truth owner.
- **Scenario-ingestion temptation:** legacy raw-event/scenario loaders are available, but expanding them would pull the integration back toward scenario-first architecture.
- **Contract-light API routes:** routes currently perform shallow body checks and rely on TypeScript types at compile time, not runtime governed schema validation.
- **Presentation views vs audit artifacts:** `src/contracts/tiberScoring.ts` is useful for TIBER-facing views, but FORGE audit should consume durable projection facts and manifests rather than player-card prose.
- **Board/tiering overlap:** `src/board/*` contains ranking/action-tier-like concepts. Keep FORGE grading/tiering policy out of the TIBER-Data ingestion PR sequence.
- **Artifact lifecycle unclear:** model artifacts can be loaded/saved, but projection artifacts and run manifests do not yet have a governed lifecycle.
- **Upstream field availability unknown:** fields such as first-read target share, red-zone share, role stability, and TD dependency may not exist in governed TIBER-Data. Do not synthesize them without an upstream contract.

## Smallest safe first implementation PR

The smallest safe implementation PR after this inspection should be contract-only plus fixtures/tests, with no scoring math changes:

1. Add `src/contracts/tiberDataProjectionInput.ts` defining a thin adapter input bundle and provenance/reference types.
2. Add a pure adapter such as `src/adapters/tiberData/toWeeklyScoringRequest.ts` that maps governed bundle fields into `WeeklyScoringRequest` and returns explicit `missing_fields` / warnings.
3. Add runtime validation for required adapter fields and scoring-required fields.
4. Add fixture tests using clearly labeled non-source-truth fixtures.
5. Do not add broad file ingestion yet; accept an in-memory bundle first.
6. Do not emit FORGE artifacts yet; only define the artifact contracts or TODOs if necessary.
7. Do not alter xFPG, replacement, VORP, range, or ranking calculations.

## Recommended next PR sequence

1. **Adapter contract PR:** define governed input bundle types, mapping result types, and fixtures/tests. No scoring changes.
2. **Adapter service PR:** expose a service that accepts the adapter input bundle and returns a `WeeklyScoringRequest` / `RosScoringRequest` plus coverage report. No file IO yet.
3. **Artifact contract PR:** define projection artifact and run-manifest contracts plus validation tests. No publishing side effects yet.
4. **Artifact writer PR:** add explicit JSON/JSONL writers for scoring outputs and manifests under a new artifact/export namespace, separate from legacy scenario exports.
5. **Route/CLI integration PR:** optionally add an API/CLI path that consumes governed bundles and emits artifacts, guarded by validation.
6. **FORGE handoff PR:** document and test a FORGE-facing handoff fixture containing manifest + projection facts + coverage report, with FORGE policy fields intentionally absent.
