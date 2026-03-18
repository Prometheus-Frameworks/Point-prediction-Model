# Regression signals reference

## Core public scores

### `regressionUpScore`
Higher values mean the player profile looks more likely to outperform the current projection than the raw point estimate alone suggests.

Typical drivers:
- usage materially ahead of fantasy production
- red-zone usage without matching recent touchdown conversion
- stable role and manageable uncertainty

### `regressionDownScore`
Higher values mean the current projection appears more vulnerable to downside regression.

Typical drivers:
- fantasy output running ahead of role support
- unsustainably strong recent touchdown conversion
- fragile efficiency on weaker samples
- volatile or event-sensitive context

### `stickinessScore`
Higher values mean the current projection appears supported by stable underlying context and tighter uncertainty.

Typical drivers:
- consistent route and target volume
- lower usage volatility
- stronger sample reliability
- tighter prediction intervals
- limited contextual change

### `fragilityScore`
Higher values mean the current projection is easier to break.

Typical drivers:
- wide residual interval bands
- event-driven context changes
- role instability
- fragile efficiency and TD dependence
- lower sample reliability

## Component score meanings

### Usage-production gap
Interprets whether the player is earning enough role to justify better production than recent box-score output shows.

### Efficiency fragility
Measures whether the recent efficiency level is too far ahead of the role and sample that should sustain it.

### TD regression risk
Separates touchdown upside and touchdown downside by checking whether scoring is lagging or over-driving the profile.

### Volume stability
Measures whether routes, targets, and snap share create a dependable weekly floor.

### Projection stickiness
Uses interval width and context noise to decide whether the current projection should be treated as durable or fragile.

## Reading common flags

### `REGRESSION_UP_USAGE_STRONG`
Recent role is strong enough that the player may be underprojected relative to recent fantasy output.

### `REGRESSION_DOWN_TD_FRAGILE`
Touchdown-driven production is doing too much work in the current projection.

### `PROJECTION_STICKY_HIGH_VOLUME`
The current projection is supported by stable, bankable volume.

### `PROJECTION_FRAGILE_EVENT_DRIVEN`
A recent contextual event is doing meaningful work inside the projection, so outcomes are less sticky.

### `EFFICIENCY_AHEAD_OF_ROLE`
Recent efficiency is better than the underlying role likely supports.

### `USAGE_AHEAD_OF_PRODUCTION`
Recent usage suggests more fantasy output than the recent box score is showing.

## Deterministic heuristic limitations
- Thresholds are intentionally simple and interpretable.
- Scores are bounded and relative rather than calibrated probabilities.
- A high regression signal should be treated as an explanation layer, not a replacement for the point projection.
