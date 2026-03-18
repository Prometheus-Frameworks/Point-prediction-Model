# Batch Scenario Usage

## Supported file formats

### JSON (primary format)
Provide a JSON array of `ProjectionScenario` objects. This is the canonical and preferred ingestion format because it preserves the native nested structure used by the model.

Run it with:
```bash
npm run dev -- file ./src/examples/scenarios.sample.json
```

### CSV (flattened convenience format)
CSV is supported for quick spreadsheet-style editing. Each row maps to one scenario with flattened columns.

Run it with:
```bash
npm run dev -- file ./src/examples/scenarios.sample.csv
```

## CSV schema
The supported columns are:

- `scenarioId`
- `title`
- `description`
- `tags` (`|`-delimited)
- `defaultRun`
- `playerId`
- `playerName`
- `position`
- `playerTeam`
- `sampleSizeGames`
- `routesPerGame`
- `targetsPerRouteRun`
- `catchRate`
- `yardsPerTarget`
- `tdPerTarget`
- `rushPointsPerGame`
- `previousTeam`
- `previousQuarterback`
- `previousTargetCompetitionIndex`
- `previousQbEfficiencyIndex`
- `previousPassTdEnvironmentIndex`
- `previousPlayVolumeIndex`
- `previousPassRateIndex`
- `newTeam`
- `newQuarterback`
- `newTargetCompetitionIndex`
- `newQbEfficiencyIndex`
- `newPassTdEnvironmentIndex`
- `newPlayVolumeIndex`
- `newPassRateIndex`
- `eventType`
- `eventDescription`
- `effectiveWeek`
- `eventSeverity`
- `eventClarity`
- `eventMateriallyChangedVariables` (`|`-delimited)
- `eventFromTeam`
- `eventFromQuarterback`
- `eventFromTargetCompetitionIndex`
- `eventFromQbEfficiencyIndex`
- `eventFromPassTdEnvironmentIndex`
- `eventFromPlayVolumeIndex`
- `eventFromPassRateIndex`
- `eventToTeam`
- `eventToQuarterback`
- `eventToTargetCompetitionIndex`
- `eventToQbEfficiencyIndex`
- `eventToPassTdEnvironmentIndex`
- `eventToPlayVolumeIndex`
- `eventToPassRateIndex`

See `src/examples/scenarios.sample.csv` for a working example.

## CLI modes
- `npm run dev`: run the default seeded scenarios.
- `npm run dev -- all`: run all seeded scenarios.
- `npm run dev -- scenario waddle-to-broncos`: run one seeded scenario by id.
- `npm run dev -- file ./src/examples/scenarios.sample.json`: run scenarios from a JSON file.
- `npm run dev -- file ./src/examples/scenarios.sample.csv`: run scenarios from a CSV file.
- `npm run dev -- file ./src/examples/scenarios.sample.json --export json`: run and write `results.json`.
- `npm run dev -- file ./src/examples/scenarios.sample.csv --export csv`: run and write `results.csv`.

## Validation rules
The batch loader validates scenarios before execution and fails fast with explicit messages when input is invalid.

Validation checks include:
- unique scenario ids
- required metadata, player, team, and event fields
- supported event types only (`PLAYER_TRADE`, `TEAMMATE_INJURY`, `PLAYER_SIGNING`, `ROOKIE_ADDED`)
- numeric ranges such as `catchRate` 0-1 and `tdPerTarget` 0-1
- structural integrity for nested objects such as team contexts and event payloads

## Exports
Exports write comparison-friendly files to the repository root:
- `results.json`
- `results.csv`

Each exported row includes:
- scenario metadata
- player identity and position
- event type
- baseline metrics
- adjusted metrics
- delta points per game
- confidence score and confidence band

## CLI output
Batch runs print a compact comparison table with:
- `scenarioId`
- `playerName`
- `eventType`
- `baselinePointsPerGame`
- `adjustedPointsPerGame`
- `deltaPointsPerGame`
- `confidenceBand`
