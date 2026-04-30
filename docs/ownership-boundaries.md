# Ownership boundaries and contract map

## 1) Role in TIBER
Point-prediction-model is the **TIBER scoring/projection engine**. It transforms trusted upstream player/team/context inputs into fantasy scoring outputs (including expected points, ranges, confidence, and replacement-style signals).

This repository is intended to sit **downstream of TIBER-Data source truth** and **upstream of TIBER-Fantasy scoring surfaces**.

## 2) What this repo owns
- Scoring and projection logic.
- Expected fantasy points computation.
- Weekly and rest-of-season (ROS) scoring outputs.
- Replacement baseline and VORP-style outputs.
- Scoring range and confidence outputs.
- Scoring API/service surfaces.
- Scoring-oriented metadata needed by downstream consumers.

## 3) What this repo consumes
This repo is intended to consume, and currently consumes where wired in integration paths, the following upstream context:
- Canonical player/team identity from TIBER-Data.
- Source-backed roster identity from TIBER-Data where available.
- Historical player-week outcomes from TIBER-Data when promoted.
- Scoring settings / league-format configuration.
- Role/opportunity inputs from Role-and-opportunity-model.
- Team environment/tendency inputs from TIBER-Teamstate.
- Rookie context from TIBER-Rookies where relevant.
- Age/decline context from Age-curve-intelligence-model where relevant.

Where direct wiring is incomplete in this repository, exact source-path usage needs verification.

## 4) What this repo produces
- Fantasy point projections.
- Expected point ranges.
- Scoring confidence outputs.
- Replacement/VORP outputs.
- Model metadata for TIBER-Fantasy and Data Lab surfaces.
- Scoring-service responses for API consumers.

## 5) What this repo does not own
- Canonical IDs, source truth, or provenance governance (owned by TIBER-Data).
- Product cockpit/UI owner-facing surfaces (owned by TIBER-Fantasy).
- Deterministic grading/tiering policy (owned by TIBER-FORGE).
- Role/opportunity source truth (owned by Role-and-opportunity-model).
- Team environment/tendency source truth (owned by TIBER-Teamstate).
- Rookie model/cards/board ownership (owned by TIBER-Rookies).
- Age/decline source-model ownership (owned by Age-curve-intelligence-model).

## 6) Current TIBER-Data contract alignment
- TIBER-Data now includes a real source-backed roster identity artifact for 2025.
- Point-prediction-model should prefer canonical/source-backed TIBER-Data identity inputs over local ad hoc identity mapping.
- If local fixtures exist, they should be labeled as fixtures and not treated as source truth.
- This repository should not infer provenance locally when TIBER-Data owns the evidence/source trail.

## 7) Boundary-risk areas for future audits
- Legacy scenario/event ingestion surfaces.
- Decision-board logic under `src/board/*` (if present).
- Market/consensus/fusion paths where source ownership may be unclear.
- Artifact lifecycle and publishing behavior.
- Local player/team mappings that may duplicate TIBER-Data responsibilities.
- UI/product-facing logic that may belong in TIBER-Fantasy.
- Deterministic grading/tiering behavior that may belong in TIBER-FORGE.
