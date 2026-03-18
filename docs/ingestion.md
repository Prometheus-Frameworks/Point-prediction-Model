# Ingestion and normalization

## Goal
PR4 adds a deterministic ingestion layer that translates raw external transaction/news-style inputs into:
- canonical `ProjectionEvent` records the engine already understands
- `ProjectionScenario` objects the existing runner can execute

The ingestion layer deliberately stays upstream from the projection engine. It does not change the engine's purpose; it cleans noisy external inputs before scenario execution.

## Raw event schema
Raw event files are accepted as JSON arrays or flattened CSV rows. Each raw event uses the same logical shape.

### Core fields
- `id`: unique raw event identifier
- `source`: source label, such as a newswire or beat reporter
- `sourceEventId`: optional upstream identifier
- `eventType`: one of `TRADE`, `INJURY`, `SIGNING`, `ROOKIE`
- `headline`: short source headline
- `summary`: optional structured summary used as the canonical event description when present
- `reportedAt`: ISO-8601 timestamp
- `effectiveWeek`: optional week override; defaults to week 1 when omitted
- `certainty`: optional certainty flag: `CONFIRMED`, `LIKELY`, `SPECULATIVE`
- `subjectPlayerName`: the player whose fantasy projection will be run downstream
- `subjectPlayerId`: optional player identifier
- `subjectTeam`: subject player's current team code
- `subjectPosition`: optional `WR` or `TE`
- `relatedPlayerName`: optional secondary player name used by injury, signing, and rookie events
- `relatedPlayerId`: optional secondary player id
- `relatedTeam`: optional secondary team code
- `fromTeam`: required for trades
- `toTeam`: required for trades
- `severity`: optional 0-10 event impact hint
- `notes`: optional free-form deterministic annotation

### Event-specific validation
- `TRADE` requires `fromTeam` and `toTeam`.
- `INJURY` requires `relatedPlayerName` for the injured teammate.
- `SIGNING` requires `relatedPlayerName` for the incoming signing.
- `ROOKIE` requires `relatedPlayerName` for the added rookie.

Invalid inputs fail before normalization.

## Normalization flow
1. `parseRawEventJson.ts` and `parseRawEventCsv.ts` parse the source file.
2. `validateRawEvent.ts` validates the shared schema and event-specific requirements.
3. `normalizeEvent.ts` dispatches to the right event-specific normalizer.
4. Event-specific normalizers create canonical projection events:
   - `TRADE` -> `PLAYER_TRADE`
   - `INJURY` -> `TEAMMATE_INJURY`
   - `SIGNING` -> `PLAYER_SIGNING`
   - `ROOKIE` -> `ROOKIE_ADDED`
5. `scoreEventQuality.ts` assigns a numeric score and `HIGH` / `MEDIUM` / `LOW` label.
6. `dedupeEvents.ts` collapses near-identical normalized events that share the same canonical fingerprint.
7. `buildScenarioFromEvent.ts` creates deterministic `ProjectionScenario` objects using seeded/mock player and team context lookups.

## Quality scoring
Quality scoring is deterministic and favors explicit information.

### Inputs that raise quality
- structured summaries
- player ids
- player positions
- related player context
- explicit `effectiveWeek`
- explicit `severity`
- notes
- stronger certainty (`CONFIRMED` > `LIKELY` > `SPECULATIVE`)
- normalized events that clearly list materially changed variables

### Labels
- `HIGH`: score >= 80
- `MEDIUM`: score >= 55 and < 80
- `LOW`: score < 55

Low quality does not automatically invalidate an event. It means the event required more assumptions or carries less certainty.

## Dedupe behavior
Deduplication happens after normalization, not before.

Two events collapse together when they normalize to the same canonical fingerprint, based on:
- canonical event type
- subject player
- subject team
- related player when present
- trade team movement when present
- effective week

When duplicates collapse:
- source ids are merged
- source names are merged
- the highest quality score is retained
- the earliest `reportedAt` timestamp is retained
- assumptions are merged and deduplicated

## Scenario building
Scenario building is intentionally deterministic.

### Current approach
- No database is used.
- No live APIs are called.
- Seeded/mock team contexts fill in quarterback, competition, and environment indexes.
- Seeded/mock player profiles fill in baseline player metrics.
- Unknown players or teams fall back to typed deterministic defaults.

### Trade handling
- `previousTeamContext` uses the normalized trade `fromTeam`
- `newTeamContext` uses the normalized trade `toTeam`
- the projected player remains the subject player from the raw event

### Non-trade handling
- `previousTeamContext` and `newTeamContext` both use the subject team
- the canonical event determines whether the downstream model applies a positive or negative adjustment

## Ingest CLI usage
```bash
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.json
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.csv
npm run dev -- ingest ./src/ingestion/examples/raw-events.sample.json --export json
```

### Ingest output
The CLI prints a readable summary table with:
- normalized event id
- subject player
- canonical event type
- team
- quality label and score
- deduped source count
- effective week

With `--export json`, the CLI writes:
- `normalized-events.json`
- `normalized-scenarios.json`

## Example files
Sample raw event files live in `src/ingestion/examples/` and intentionally include:
- one trade
- one injury
- one signing
- one rookie-added item
- one duplicate trade from another source
- mixed quality inputs ranging from `HIGH` to `LOW`
