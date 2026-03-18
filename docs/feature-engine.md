# Feature Engine

## Overview
The feature engine turns deterministic player/team/matchup/event inputs into validated WR/TE weekly feature rows. It does **not** train a model. Instead, it prepares the project for a later model-training PR by standardizing feature generation for both training and inference.

## File layout
- `src/features/types/` defines the source input and output row contracts.
- `src/features/schema/wrTeFeatureSchema.ts` defines canonical grouped fields and numeric bounds.
- `src/features/builders/` contains one focused builder per feature bucket and a final row orchestrator.
- `src/features/validation/validateFeatureRow.ts` enforces leak-prevention and schema checks.
- `src/features/examples/` contains realistic sample inputs and fully built rows.

## Build flow
1. Construct a `WrTeFeatureSourceInput`.
2. Call `buildFeatureRow` to flatten bucket outputs into one `WrTeFeatureRow`.
3. Validation runs automatically and throws a clear `FeatureRowValidationError` if the row is malformed or leaky.
4. For service-layer consumers, call `buildFeatureRowService` or `buildFeatureBatchService` to get a typed result envelope.

## Service entrypoints
Public services now include:
- `buildFeatureRowService(input)`
- `buildFeatureBatchService(inputs)`

Both return the same `ServiceResult<T>` envelope pattern used elsewhere in the repo.

## Design principles
- Keep features explicit and stable.
- Prefer flat columns over nested objects for easier export.
- Avoid future leakage at the feature-engine boundary.
- Keep builders deterministic and side-effect free.
- Make the same feature contract usable for offline training and online inference.

## Sample scenarios
The examples cover:
- stable veteran WR
- rookie WR
- volatile TE
- traded WR
- teammate injury beneficiary

These sample inputs are intentionally realistic enough to test role stability, rookie uncertainty, positional matchup differences, team changes, and event-driven opportunity shifts.
