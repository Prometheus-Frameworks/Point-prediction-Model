# Decision Board Frontend

## Purpose
This frontend is a polished, read-only presentation layer for the repo's existing WR/TE decision-board style outputs. It intentionally uses static example data so reviewers can inspect the UI immediately without adding auth, databases, or API plumbing.

## Tech stack
- React
- TypeScript
- Vite

## Run locally
```bash
cd app/web
npm install
npm run dev
```

Then open the local Vite URL, typically `http://localhost:5173`.

## Build for verification
```bash
cd app/web
npm run build
```

## Mock data source
The first-pass dataset lives in `src/data/mockDecisionBoard.ts`. Its values are hand-curated from the repository's existing example outputs and concepts, including:
- fusion examples in `src/fusion/examples/sampleFusionRun.ts`
- market comparison examples in `src/market/examples/sampleConsensusComparison.ts`
- diagnostics examples in `src/diagnostics/examples/sampleDiagnosticsRun.ts`
- feature example inputs in `src/features/examples/sampleFeatureRows.ts`

The UI purposefully preserves uncertainty, diagnostics, fusion context, and market edge framing so the board reflects the existing model surface area instead of hiding caveats.

## Included UI pieces
- `DecisionBoardTable`
- `PlayerDetailPanel`
- `ProjectionIntervalBar`
- `EdgeBadge`
- `DiagnosticTagList`
- `ActionTierPill`
- `FilterBar`
- `SortControl`

## Future integration path
A later PR can replace `mockDecisionBoard.ts` with a typed adapter that maps real service outputs into this display shape. The cleanest path is:
1. materialize fused projection outputs from `runFusedBatchService`
2. attach diagnostics from `runProjectionDiagnosticsService`
3. attach market edge outputs from `scoreMarketEdgesService`
4. serialize that combined payload as a static artifact or lightweight endpoint
5. keep this app read-only unless product scope explicitly expands

That keeps presentation concerns in `app/web/` while preserving the repo's current modeling and scoring boundaries.
