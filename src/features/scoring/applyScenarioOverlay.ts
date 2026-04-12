import { roundTo } from '../../core/scoringSystem.js';
import type { PlayerOpportunityInput } from '../../contracts/scoring.js';

export interface ScoringOverlayInput {
  player_id: string;
  expected_points_delta?: number;
  role_stability_delta?: number;
  td_dependency_delta?: number;
  note: string;
}

export const applyScenarioOverlay = (
  player: PlayerOpportunityInput,
  overlays: ScoringOverlayInput[],
): { player: PlayerOpportunityInput; notes: string[] } => {
  const matched = overlays.filter((overlay) => overlay.player_id === player.player_id);
  if (matched.length === 0) {
    return { player, notes: [] };
  }

  const roleStabilityDelta = matched.reduce((sum, overlay) => sum + (overlay.role_stability_delta ?? 0), 0);
  const tdDependencyDelta = matched.reduce((sum, overlay) => sum + (overlay.td_dependency_delta ?? 0), 0);

  return {
    player: {
      ...player,
      role_stability: roundTo((player.role_stability ?? 0.65) + roleStabilityDelta, 3),
      td_dependency: roundTo((player.td_dependency ?? 0.45) + tdDependencyDelta, 3),
    },
    notes: matched.map((overlay) => overlay.note),
  };
};
