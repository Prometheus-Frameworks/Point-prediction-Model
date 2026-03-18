# Point Prediction Model

## Purpose
A clean TypeScript MVP for projecting PPR fantasy points for pass-catchers and reacting to trade-driven context changes.

## Current MVP scope
- WR/TE support only.
- Baseline PPR projection from player usage and efficiency inputs.
- Deterministic `PLAYER_TRADE` adjustment engine based on team context.
- Hardcoded Jaylen Waddle-to-Broncos example scenario.
- No database, APIs, scraping, UI, or live ingestion.

## How to run
```bash
npm install
npm run dev
```

## How to test
```bash
npm test
```
