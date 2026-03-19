import type { DecisionBoardInputs } from '../types/decisionBoardRow.js';
import { clamp, roundTo } from '../../utils/math.js';

export interface TrustworthinessBreakdown {
  intervalWidth90: number;
  intervalPenalty: number;
  fragilityPenalty: number;
  eventPenalty: number;
  supportFromStickiness: number;
  supportFromFusionConfidence: number;
  supportFromMarketTrust: number;
}

export interface TrustworthinessScore {
  score: number;
  breakdown: TrustworthinessBreakdown;
}

export const scoreTrustworthiness = ({ row, diagnostics, fusedProjection, marketEdge }: DecisionBoardInputs): TrustworthinessScore => {
  const intervalWidth90 = fusedProjection.fusedIntervals.upper90 - fusedProjection.fusedIntervals.lower90;
  const intervalPenalty = clamp((intervalWidth90 - 8) * 3.6, 0, 28);
  const fragilityPenalty = clamp(diagnostics.fragilityScore * 0.34, 0, 28);
  const eventPenalty = row.event_type === 'NONE'
    ? 0
    : clamp((1 - row.event_clarity) * 18 + Math.max(0, row.event_severity - 5) * 1.8, 0, 18);
  const supportFromStickiness = diagnostics.stickinessScore * 0.3;
  const supportFromFusionConfidence = fusedProjection.fusionConfidence.score * 0.22;
  const supportFromMarketTrust = (marketEdge?.trustAdjustment.confidenceMultiplier ?? 0.82) * 10;

  const score = clamp(
    34 + supportFromStickiness + supportFromFusionConfidence + supportFromMarketTrust
      - intervalPenalty - fragilityPenalty - eventPenalty,
    0,
    100,
  );

  return {
    score: roundTo(score),
    breakdown: {
      intervalWidth90: roundTo(intervalWidth90),
      intervalPenalty: roundTo(intervalPenalty),
      fragilityPenalty: roundTo(fragilityPenalty),
      eventPenalty: roundTo(eventPenalty),
      supportFromStickiness: roundTo(supportFromStickiness),
      supportFromFusionConfidence: roundTo(supportFromFusionConfidence),
      supportFromMarketTrust: roundTo(supportFromMarketTrust),
    },
  };
};
