# WR/TE Feature Schema

## Purpose
PR6 adds a canonical, model-ready feature contract for weekly WR/TE point prediction. The schema is designed to be reusable for both offline training datasets and online inference payloads.

- Version: `wrte-weekly-v1`
- Shape: flat tabular row with stable prefixed feature names.
- Output contract: `WrTeFeatureRow`
- Source contract: `WrTeFeatureSourceInput`

## Identifier fields
Each row includes non-training identifiers that make exports auditable and joinable:
- `scenario_id`
- `season`
- `week`
- `projection_label`
- `projection_timestamp`
- `player_id`
- `player_name`
- `player_position`
- `player_team`
- `opponent_team`
- `event_type`
- `event_timestamp`

## Feature buckets

### Usage
Usage features describe role and opportunity without peeking forward:
- routes per game over trailing 3, trailing 5, and season-to-date windows
- targets per game across the same windows
- targets per route run, target share, air-yards share, first-read share
- red-zone and end-zone usage
- snap rate and recent route stability delta

### Efficiency
Efficiency features convert earned opportunity into descriptive per-target/per-route outputs:
- catch rate
- yards per target
- yards per route run
- touchdown rate per target
- average depth of target
- explosive target rate
- trailing fantasy points and delta vs stable baseline

### Team context
Team context features capture pass environment:
- implied points
- play volume index
- pass rate over expected
- neutral pass rate
- QB efficiency index
- pace index
- red-zone pass rate
- target competition index
- pass-block grade
- pressure proxy

### Player arc
Player arc features describe where the player is in his development curve:
- age and experience
- rookie flag
- recent team-change flag
- game-count support across windows
- role growth vs season-to-date
- efficiency growth vs baseline
- target volatility across recent games
- sample reliability score

### Matchup
Matchup features remain simple and model-friendly:
- home/away flag
- game total and spread
- position-adjusted defense rank
- man/zone coverage rates
- pressure and blitz rates
- explosive pass rate allowed
- red-zone touchdown rate allowed
- slot or linebacker coverage weakness indicators

### Event context
Event context features translate scenario information into tabular signals:
- weeks since event
- event severity
- clarity
- teammate target-share delta
- depth-chart delta
- quarterback-change flag
- count of prior event-history records
- recent-signal flag

## Rolling-window support
The input contract accepts four deterministic summaries:
- `trailing3`
- `trailing5`
- `seasonToDate`
- `baseline`

This allows the engine to work with either:
1. true rolling summaries generated upstream, or
2. mocked prior summaries during scenario simulation/testing.

## Validation and leak prevention
`validateFeatureRow` enforces these rules:
- event timestamp must be on or before the projection timestamp
- every rolling window must end strictly before the projection timestamp
- prior-game timestamps must be before the projection timestamp
- rolling windows must respect monotonic game counts (`trailing3 <= trailing5 <= seasonToDate <= baseline`)
- bounded numeric ranges are checked for all numeric feature columns
- row identity fields must match the source payload

## Future usage
The schema is intentionally boring and tabular so a later PR can:
- export rows to CSV/JSON for training datasets
- reuse the same builder for inference-time feature generation
- plug into tree models or linear baselines without renaming columns
