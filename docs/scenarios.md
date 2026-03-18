# Scenario Structure and Authoring Guide

## Canonical scenario shape
Each scenario exports a `ProjectionScenario` with:
- `metadata.id`: unique registry key
- `metadata.title`: readable title for CLI output
- `metadata.description`: one-line summary
- `metadata.tags`: optional categorization
- `metadata.defaultRun`: whether `npm run dev` includes it by default
- `player`: WR/TE player profile
- `previousTeamContext`: pre-event team environment
- `newTeamContext`: post-event team environment
- `event`: deterministic event payload

## Authoring rules
- Keep all scenarios deterministic and static.
- Use plausible placeholder values; structural clarity matters more than realism.
- Prefer changing opportunity and efficiency drivers over adding point bonuses.
- Use `severity` and `clarity` to support rule-based confidence scoring.
- Keep rookie scenarios more modest than veteran movement scenarios.

## Registry workflow
1. Add a new file in `src/data/scenarios/`.
2. Export the scenario constant.
3. Import and register it in `src/models/scenarios/registry.ts`.
4. Verify it appears in `npm run dev` output.
