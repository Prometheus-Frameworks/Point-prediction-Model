import type { ConfidenceBand, PlayerOpportunityInput } from '../../contracts/scoring.js';
import { clamp, roundTo } from '../../core/scoringSystem.js';

export interface StabilityProfile {
  confidence_score: number;
  confidence_band: ConfidenceBand;
  volatility_input: number;
  fragility_input: number;
  role_notes: string[];
}

export const calculateStabilityScore = (player: PlayerOpportunityInput): StabilityProfile => {
  const roleStability = clamp(player.role_stability ?? 0.65, 0, 1);
  const sampleFactor = clamp(player.games_sampled / 17, 0, 1);
  const tdDependency = clamp(player.td_dependency ?? 0.45, 0, 1);
  const injuryRisk = clamp(player.injury_risk ?? 0.2, 0, 1);

  const confidenceScore = roundTo(
    40 + roleStability * 24 + sampleFactor * 22 - tdDependency * 18 - injuryRisk * 15,
  );

  const confidence_band: ConfidenceBand = confidenceScore >= 75 ? 'HIGH' : confidenceScore >= 55 ? 'MEDIUM' : 'LOW';

  const role_notes = [
    `Role stability index: ${roundTo(roleStability * 100, 1)}.`,
    `Sample confidence from ${player.games_sampled} games: ${roundTo(sampleFactor * 100, 1)}.`,
    `TD dependency risk: ${roundTo(tdDependency * 100, 1)}.`,
    `Injury ambiguity factor: ${roundTo(injuryRisk * 100, 1)}.`,
  ];

  return {
    confidence_score: confidenceScore,
    confidence_band,
    volatility_input: clamp(0.2 + tdDependency * 0.5 + (1 - roleStability) * 0.35, 0, 1),
    fragility_input: clamp(injuryRisk * 0.55 + (1 - sampleFactor) * 0.45, 0, 1),
    role_notes,
  };
};
