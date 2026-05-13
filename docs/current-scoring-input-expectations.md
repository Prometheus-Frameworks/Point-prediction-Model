# Current scoring input expectations audit

This is an inspect-only audit of the current `PlayerOpportunityInput` scoring contract and the TIBER-Data weekly scoring adapter. It documents what the scoring path expects today before any real TIBER-Data wiring.

Scope reviewed:

- `src/contracts/scoring.ts`
- `src/contracts/positionFieldExpectations.ts`
- `src/contracts/tiberDataProjectionInput.ts`
- `src/calculators/xfpg/*`
- `src/calculators/range/*`
- `src/services/scoring/*`
- `src/adapters/tiberData/toWeeklyScoringRequest.ts`

No scoring math, ingestion wiring, generated artifacts, or FORGE logic is changed by this audit.

## Executive summary

- The scoring contract has five required `PlayerOpportunityInput` identity/sample fields: `player_id`, `player_name`, `team`, `position`, and `games_sampled`.
- All football-opportunity fields are optional in TypeScript, but many optional fields materially affect xFPG if present.
- Missing optional numeric fields usually default to `0`, a fixed heuristic, or a derived fallback. This means omission can produce valid-looking but materially depressed projections.
- The TIBER-Data adapter validates required player fields and top-level bundle/league fields, but it does not synthesize optional scoring values.
- Several current fields are local model features or derived risk indices and should probably not be sourced directly from raw TIBER-Data: `role_stability`, `td_dependency`, `injury_risk`, `rush_td_opportunity`, and `receiving_role_strength`.
- `null` handling is not explicitly validated for optional fields. Many `??` fallbacks treat `null` as missing, but checks such as `field !== undefined` treat `null` as present and may rely on JavaScript numeric coercion. The adapter should prefer omission for unavailable optional fields unless/until optional validation is tightened.

## Required `PlayerOpportunityInput` fields

These fields are required by the TypeScript interface and are also enforced by the TIBER-Data weekly adapter for every `player_opportunities` and `comparison_pool` row.

| Field | Type/allowed values | Classification | Consumed by | Missing/null behavior | TIBER-Data sourcing recommendation |
| --- | --- | --- | --- | --- | --- |
| `player_id` | non-empty string | identity | scoring outputs, overlays, comparison/missing-field reporting | Adapter rejects missing, empty, or non-string values. | Direct from TIBER identity mapping. |
| `player_name` | non-empty string | identity | scoring outputs/cards/rankings | Adapter rejects missing, empty, or non-string values. | Direct from TIBER identity mapping or player registry. |
| `team` | non-empty string | context/identity | scoring outputs/cards/rankings | Adapter rejects missing, empty, or non-string values. | Direct/adapted from current team assignment. |
| `position` | `QB`, `RB`, `WR`, `TE` | identity/context | xFPG router, pass-catcher TE/WR default routes, replacement points, output transforms, optional-field filtering | Adapter rejects missing/invalid values. Unsupported fantasy positions are outside this contract. | Direct/adapted to scoring positions. |
| `games_sampled` | finite number | stability | `calculateStabilityScore` sample confidence and fragility | Adapter rejects missing/non-number values. Scoring clamps `games_sampled / 17` into `[0, 1]`; no default in scoring. | Adapt from source sample window; keep explicit about season/week window. |

## Optional fields by position

This table reflects `tiberDataPositionOptionalFieldExpectations`, not necessarily every cross-position fallback that the calculators can technically read.

| Position | Optional fields currently expected/reported by adapter |
| --- | --- |
| QB | `pass_attempts_pg`, `pass_yards_per_attempt`, `pass_td_rate`, `interception_rate`, `rush_attempts_pg`, `designed_rush_attempts_pg`, `scramble_rush_attempts_pg`, `goal_line_rush_attempts_pg`, `rush_yards_per_attempt`, `rush_td_rate`, `week`, `season`, `role_stability`, `td_dependency`, `injury_risk` |
| RB | `carries_pg`, `inside_10_carries_pg`, `rush_td_opportunity`, `receiving_role_strength`, `targets_pg`, `yards_per_carry`, `yards_per_reception`, `route_participation`, `targets_per_route`, `week`, `season`, `role_stability`, `td_dependency`, `injury_risk` |
| WR | `route_participation`, `routes_pg`, `targets_per_route`, `first_read_target_share`, `air_yards_per_target`, `end_zone_targets_pg`, `red_zone_target_share`, `catch_rate`, `yards_per_target`, `receiving_td_rate`, `week`, `season`, `role_stability`, `td_dependency`, `injury_risk` |
| TE | `route_participation`, `routes_pg`, `targets_per_route`, `first_read_target_share`, `air_yards_per_target`, `end_zone_targets_pg`, `red_zone_target_share`, `catch_rate`, `yards_per_target`, `receiving_td_rate`, `week`, `season`, `role_stability`, `td_dependency`, `injury_risk` |

## Field consumption and fallback audit

Legend for TIBER sourcing recommendation:

- **Direct**: should come directly from governed TIBER-Data semantics if present.
- **Adapted**: should be computed/normalized from TIBER-Data primitives before entering scoring.
- **Local/downstream**: should remain a scoring-model or downstream judgement feature, not a raw TIBER-Data field.

| Field | Position expectation | Classification | Calculators/services that consume it | Current missing/null fallback behavior | TIBER sourcing recommendation |
| --- | --- | --- | --- | --- | --- |
| `week` | QB/RB/WR/TE common | context | Adapter coverage only; no current scoring math consumer | Missing is reported as optional by adapter. Scoring ignores it. | Direct/adapted schedule context, but not currently needed for math. |
| `season` | QB/RB/WR/TE common | context | Adapter coverage only; no current scoring math consumer | Missing is reported as optional by adapter. Scoring ignores it. | Direct schedule context, but not currently needed for math. |
| `injury_risk` | QB/RB/WR/TE common | stability/context | `calculateStabilityScore` | Defaults to `0.2` via `??`; clamped `[0, 1]`. Null falls back to `0.2`. | Local/downstream risk model. TIBER injury status can inform it, but raw TIBER should not be treated as this normalized risk index without adaptation. |
| `role_stability` | QB/RB/WR/TE common | stability | `calculateStabilityScore`; scenario overlays can adjust it before scoring | Defaults to `0.65` via `??`; clamped `[0, 1]`. Null falls back to `0.65`. | Local/downstream derived index from usage volatility/depth-chart confidence, not direct raw TIBER. |
| `td_dependency` | QB/RB/WR/TE common | TD/high-value usage, stability | `calculateStabilityScore`; scenario overlays can adjust it before scoring | Defaults to `0.45` via `??`; clamped `[0, 1]`. Null falls back to `0.45`. | Local/downstream derived risk index, not direct raw TIBER. |
| `pass_attempts_pg` | QB | volume | `calculateQbXfpg` | Defaults to `0` via `??`. Passing yards, TDs, and interceptions all become zero when absent. Null falls back to `0`. | Direct/adapted projection from pass attempts per game. |
| `pass_yards_per_attempt` | QB | efficiency | `calculateQbXfpg` | Defaults to `0` via `??`. Null falls back to `0`. | Direct/adapted efficiency projection. |
| `pass_td_rate` | QB | TD/high-value usage, efficiency | `calculateQbXfpg` | Defaults to `0` via `??`. Null falls back to `0`. | Adapted from projected passing TDs/pass attempts or historical/projection rate. |
| `interception_rate` | QB | efficiency/stability | `calculateQbXfpg` | Defaults to `0` via `??`, which removes interception penalty if absent. Null falls back to `0`. | Adapted from projected interceptions/pass attempts. |
| `rush_attempts_pg` | QB; also calculator fallback for RB/WR/TE | volume | `calculateQbXfpg`, `calculateRbXfpg`, `calculatePassCatcherXfpg` | QB uses it only when designed/scramble split inputs are both absent. RB and pass catchers use it if carries are absent. Defaults to `0`. Null falls back in `??` chains. | Direct/adapted rushing volume projection. Position semantics should be explicit because calculators use it as cross-position fallback. |
| `designed_rush_attempts_pg` | QB | volume/high-value usage | `calculateQbXfpg` | Defaults to `0`. If either designed or scramble field is present, QB rushing attempts equal designed + scramble rather than `rush_attempts_pg`. Null is treated as present by the split-input check but falls to `0` in arithmetic. | Adapted from QB rush splits. Ensure total/split consistency. |
| `scramble_rush_attempts_pg` | QB | volume | `calculateQbXfpg` | Defaults to `0`. If either split field is present, fallback `rush_attempts_pg` is ignored. Null is treated as present by the split-input check but falls to `0`. | Adapted from QB rush splits. Ensure total/split consistency. |
| `goal_line_rush_attempts_pg` | QB | TD/high-value usage | `calculateQbXfpg` | Defaults to `0`; contributes capped TD-rate boost. Null falls back to `0`. | Adapted high-value QB rush opportunity. |
| `rush_yards_per_attempt` | QB; calculator fallback for RB/WR/TE | efficiency | `calculateQbXfpg`, `calculateRbXfpg`, `calculatePassCatcherXfpg` | Defaults to `yards_per_carry` fallback where available, otherwise `0`. Null falls through `??` to fallback/default. | Direct/adapted rushing efficiency projection. Use consistently with `yards_per_carry`. |
| `rush_td_rate` | QB; calculator fallback for RB/WR/TE | TD/high-value usage, efficiency | `calculateQbXfpg`, `calculateRbXfpg`, `calculatePassCatcherXfpg` | Defaults to `0`. QB/RB add opportunity boosts; pass catchers do not. Null falls back to `0`. | Adapted from projected rushing TDs/rush attempts. |
| `carries_pg` | RB; technical fallback for QB/WR/TE rushing | volume | `calculateRbXfpg`, `calculateQbXfpg`, `calculatePassCatcherXfpg` | RB/pass catchers prefer `carries_pg` over `rush_attempts_pg`; QB uses it only if QB rush inputs are absent. Defaults to `0`. Null falls through `??` chains. | Direct/adapted rushing volume projection. Avoid sending for non-RB unless intentionally modeling gadget/rushing usage. |
| `inside_10_carries_pg` | RB | TD/high-value usage | `calculateRbXfpg` | Defaults to `0`; contributes capped TD-rate boost and touchdown-fragility penalty. Null falls back to `0`. | Direct/adapted high-value carry projection if TIBER has inside-10 carries. |
| `rush_td_opportunity` | RB | TD/high-value usage | `calculateRbXfpg` | If `undefined`, boost is `0`. Null is treated as present and coerces numerically in the clamp expression. | Local/downstream or adapted composite, not raw TIBER. It appears to be a normalized opportunity index centered at `0.5`. |
| `receiving_role_strength` | RB | volume/stability/context | `calculateRbXfpg` | Defaults to `clamp(targets / 7 + routeRoleBoost, 0, 1)`. Null falls through via `??` to derived fallback. | Local/downstream or adapted composite from routes/targets/snap role. Not a direct raw TIBER stat. |
| `targets_pg` | RB; technical direct target override for WR/TE | volume | `calculateRbXfpg`, `calculatePassCatcherXfpg` | If not `undefined`, target resolver returns it directly. If missing, targets are derived from routes and target rate. Null is treated as present and returned directly, usually coercing to zero in later math. | Direct/adapted target volume projection. Note: adapter does not list it for WR/TE even though pass-catcher calculator consumes it. |
| `yards_per_carry` | RB; calculator fallback for QB/WR/TE rush efficiency | efficiency | `calculateRbXfpg`, `calculateQbXfpg`, `calculatePassCatcherXfpg` | RB/pass catchers prefer it over `rush_yards_per_attempt`; QB uses it as fallback. Defaults to `0`. Null falls through `??`. | Direct/adapted rushing efficiency projection. Use consistently with `rush_yards_per_attempt`. |
| `yards_per_reception` | RB | efficiency | `calculateRbXfpg` | Defaults to `7.3` via `??`. Null falls back to `7.3`. | Direct/adapted receiving efficiency for RBs. |
| `route_participation` | RB/WR/TE | volume/context/stability | `calculateRbXfpg`, `calculatePassCatcherXfpg` | Used for target fallback and role boosts when not `undefined`; otherwise target fallback may be `0` or route-based. Null is treated as present in some branches and coerces to zero in clamp. | Direct/adapted route participation projection, normalized `[0, 1]`. |
| `routes_pg` | WR/TE; technical fallback for RB targets | volume | `calculateRbXfpg`, `calculatePassCatcherXfpg` | If present, targets derive as `routes_pg * targets_per_route`; otherwise route participation/default route baseline is used. Null is treated as present and generally coerces to zero. | Direct/adapted routes per game projection. Adapter should consider whether RB route projections should be expected too. |
| `targets_per_route` | RB/WR/TE | efficiency/volume rate | `calculateRbXfpg`, `calculatePassCatcherXfpg` | Defaults to `0` via `??`, so route-derived target volume becomes zero if absent. Null falls back to `0`. | Direct/adapted target rate projection. |
| `first_read_target_share` | WR/TE | high-value usage/context | `calculatePassCatcherXfpg` | If absent, bonus is `0`. Null is treated as present and coerces in arithmetic. | Adapted from first-read share semantics; normalize to share `[0, 1]`. |
| `air_yards_per_target` | WR/TE | efficiency/context | `calculatePassCatcherXfpg` | If absent, bonus is `0`. Null is treated as present and coerces in arithmetic. | Direct/adapted depth-of-target projection. |
| `end_zone_targets_pg` | WR/TE | TD/high-value usage | `calculatePassCatcherXfpg` | Defaults to `targets * red_zone_target_share * 0.35`; if red-zone share missing, fallback is zero. Null falls through via `??` to derived fallback. | Direct/adapted high-value receiving projection if TIBER has end-zone target projections. |
| `red_zone_target_share` | WR/TE | TD/high-value usage | `calculatePassCatcherXfpg` | If absent, red-zone share bonus is `0` and derived end-zone targets default to zero. Null is treated as present for bonus expression and may coerce to zero; in derived end-zone fallback, null becomes zero via `??`. | Adapted red-zone share projection. Clarify team/player share denominator. |
| `catch_rate` | WR/TE; RB calculator fallback as optional even not listed for RB | efficiency | `calculatePassCatcherXfpg`, `calculateRbXfpg` | WR/TE default to `0`, causing zero receptions when absent. RB defaults to `0.72`. Null falls back via `??`. | Direct/adapted catch-rate projection. Adapter currently does not list it for RB despite RB calculator consuming it. |
| `yards_per_target` | WR/TE | efficiency | `calculatePassCatcherXfpg` | Defaults to `0`, causing zero receiving yards when absent. Null falls back to `0`. | Direct/adapted receiving efficiency projection. |
| `receiving_td_rate` | WR/TE; RB calculator also consumes | TD/high-value usage, efficiency | `calculatePassCatcherXfpg`, `calculateRbXfpg` | Defaults to `0`; role/opportunity bonuses can still add positive TD rate for RB and pass catchers. Null falls back to `0`. | Adapted from receiving TDs/targets. Adapter currently does not list it for RB despite RB calculator consuming it. |

## Service-level expectations beyond player fields

- `WeeklyScoringRequest.players` is the primary scoring set.
- `league_context` is required by the request contract. The TIBER adapter validates `league_context.teams` and `league_context.starters.QB/RB/WR/TE`; `FLEX`, `flex_allocation`, and `replacement_buffer` are optional.
- `comparison_pool` is optional. If `comparison_pool + players` has at least 8 rows, replacement points are recalculated from that pool; otherwise the service uses default replacement points.
- `replacement_points_override` is optional and can override the calculated/default replacement points by position.
- ROS scoring reuses weekly scoring inputs and additionally requires `remaining_weeks`.
- Scenario overlays are a separate service extension and can mutate `role_stability`/`td_dependency` before normal scoring; this audit does not change overlay behavior.

## Current adapter behavior

The TIBER weekly adapter currently:

1. Requires top-level provenance fields: `input_contract_version`, `tiber_data_schema_version`, `source_dataset_refs`, and `identity_ref`.
2. Requires a non-empty `player_opportunities` array.
3. Validates required player fields for both `player_opportunities` and `comparison_pool`.
4. Rejects declared `missing_fields` entries with `severity: "required"`.
5. Passes player opportunity rows through as the `WeeklyScoringRequest` without synthesizing optional values.
6. Builds a coverage report with mapped required fields, mapped optional fields, declared missing fields, and implicit position-relevant optional missing fields.
7. Filters optional missing-field reporting by position expectations from `positionFieldExpectations.ts`.

Important limitation: optional player fields are not currently type-validated by the adapter. The scoring contract says optional fields are numbers, but runtime inputs with `null` or non-number values may not fail before scoring.

## Gaps between current algorithm expectations and TIBER-Data semantics

1. **Composite/risk fields need semantic ownership.** `role_stability`, `td_dependency`, `injury_risk`, `rush_td_opportunity`, and `receiving_role_strength` are normalized model features or risk/opportunity indices. They should be derived locally/downstream from TIBER primitives, not treated as direct TIBER facts.
2. **RB receiving calculator consumes fields not listed for RB.** `catch_rate` and `receiving_td_rate` affect RB receiving points, but the position optional expectations do not list them for RB, so missing-field coverage will not ask TIBER for them.
3. **Pass-catcher calculator can consume `targets_pg`, but WR/TE expectations omit it.** WR/TE target volume currently must be represented through `routes_pg` and `targets_per_route` unless a caller manually supplies `targets_pg`. This may be intentional, but the contract and adapter expectations differ from calculator capability.
4. **RB target fallback can consume `routes_pg`, but RB expectations omit it.** The RB resolver checks `routes_pg`, then `route_participation`, but only `route_participation` and `targets_per_route` are expected for RB.
5. **Duplicate rushing-efficiency semantics exist.** `yards_per_carry` and `rush_yards_per_attempt` are both used as fallbacks across positions. TIBER mapping should define when each is populated and avoid conflicting values.
6. **Duplicate rushing-volume semantics exist.** `carries_pg` and `rush_attempts_pg` can both drive rushing volume. TIBER mapping should define position-specific precedence and whether both should ever be supplied.
7. **QB split rush inputs override total rush input when either split is present.** Supplying only one of `designed_rush_attempts_pg` or `scramble_rush_attempts_pg` causes QB rushing attempts to ignore `rush_attempts_pg`. TIBER adaptation should either provide both split fields or neither.
8. **Missing optional volume often means zero points.** Absence of `pass_attempts_pg`, `targets_per_route`, `routes_pg`, `catch_rate`, `yards_per_target`, or rushing volume can collapse relevant scoring components to zero. The adapter truthfully reports missing optionals but does not prevent scoring.
9. **Null semantics are inconsistent.** `??` treats null as missing, while `!== undefined` treats null as present. TIBER adapter output should omit unavailable optional fields rather than using `null`.
10. **`week` and `season` are tracked as optional input fields but not used by current scoring math.** They remain useful context/provenance, but they do not affect xFPG, stability, range, or replacement today.

## Recommended pre-wiring stance

- Keep TIBER ingestion inspect-only until direct-vs-adapted ownership is settled for composite fields.
- Prefer direct TIBER fields for identity, team, position, schedule context, and primitive volume/efficiency stats.
- Add an adaptation layer for rates, normalized shares, high-value usage metrics, and risk/stability indices.
- Do not synthesize optional values silently in the TIBER adapter without adding explicit provenance/warnings.
- Tighten optional runtime validation before accepting real TIBER bundles, especially to reject or normalize `null` and non-finite values consistently.
