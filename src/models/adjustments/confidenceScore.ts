import type { ProjectionEvent } from '../../types/event.js';
import type { PlayerProfile } from '../../types/player.js';
import { clamp, roundTo } from '../../utils/math.js';

export type ConfidenceBand = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConfidenceResult {
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  factors: string[];
}

const eventTypeReliability: Record<ProjectionEvent['type'], number> = {
  PLAYER_TRADE: 16,
  TEAMMATE_INJURY: 12,
  PLAYER_SIGNING: 10,
  ROOKIE_ADDED: 6,
};

export const calculateConfidenceScore = (
  player: PlayerProfile,
  event: ProjectionEvent,
  materiallyChangedVariables: string[],
): ConfidenceResult => {
  const sampleComponent = clamp(player.sampleSizeGames / 17, 0, 1) * 28;
  const clarityComponent = clamp((event.clarity ?? 0.75), 0.2, 1) * 22;
  const eventTypeComponent = eventTypeReliability[event.type];
  const severityPenalty = Math.abs((event.severity ?? 5) - 5) * 1.6;
  const variablePenalty = Math.max(0, materiallyChangedVariables.length - 2) * 4.5;

  const rawScore = 28 + sampleComponent + clarityComponent + eventTypeComponent - severityPenalty - variablePenalty;
  const confidenceScore = roundTo(clamp(rawScore, 0, 100));
  const confidenceBand: ConfidenceBand =
    confidenceScore >= 75 ? 'HIGH' : confidenceScore >= 55 ? 'MEDIUM' : 'LOW';

  return {
    confidenceScore,
    confidenceBand,
    factors: [
      `Sample size contribution: ${roundTo(sampleComponent)} points from ${player.sampleSizeGames} games.`,
      `Event clarity contribution: ${roundTo(clarityComponent)} points from clarity ${event.clarity ?? 0.75}.`,
      `Event type reliability contribution: ${eventTypeComponent} points for ${event.type}.`,
      `Material change penalty: ${roundTo(variablePenalty)} points across ${materiallyChangedVariables.length} adjusted variables.`,
      `Severity uncertainty penalty: ${roundTo(severityPenalty)} points at severity ${event.severity ?? 5}/10.`,
    ],
  };
};
