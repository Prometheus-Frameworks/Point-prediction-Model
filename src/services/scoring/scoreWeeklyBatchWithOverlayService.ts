import { roundTo } from '../../core/scoringSystem.js';
import type { WeeklyScoringRequest } from '../../contracts/scoring.js';
import { applyScenarioOverlay, type ScoringOverlayInput } from '../../features/scoring/applyScenarioOverlay.js';
import type { ServiceResult } from '../result.js';
import { scoreWeeklyBatchService } from './scoreWeeklyBatchService.js';

export interface WeeklyOverlayRequest extends WeeklyScoringRequest {
  overlays?: ScoringOverlayInput[];
}

export const scoreWeeklyBatchWithOverlayService = (
  request: WeeklyOverlayRequest,
): ServiceResult<ReturnType<typeof scoreWeeklyBatchService> extends ServiceResult<infer T> ? T : never> => {
  const overlayNotes = new Map<string, string[]>();
  const overlayPointDelta = new Map<string, number>();

  const players = request.players.map((player) => {
    const relevantOverlays = (request.overlays ?? []).filter((overlay) => overlay.player_id === player.player_id);
    const expectedDelta = relevantOverlays.reduce((sum, overlay) => sum + (overlay.expected_points_delta ?? 0), 0);

    const overlayResult = applyScenarioOverlay(player, request.overlays ?? []);
    if (overlayResult.notes.length > 0) {
      overlayNotes.set(player.player_id, overlayResult.notes);
      overlayPointDelta.set(player.player_id, expectedDelta);
    }

    return overlayResult.player;
  });

  const result = scoreWeeklyBatchService({ ...request, players });
  if (!result.ok) {
    return result;
  }

  return {
    ...result,
    data: {
      ...result.data,
      players: result.data.players.map((player) => {
        const notes = overlayNotes.get(player.player_id);
        if (!notes) {
          return player;
        }

        const pointDelta = overlayPointDelta.get(player.player_id) ?? 0;
        const expectedPoints = roundTo(player.expected_points + pointDelta);

        return {
          ...player,
          expected_points: expectedPoints,
          median: expectedPoints,
          floor: roundTo(player.floor + pointDelta),
          ceiling: roundTo(player.ceiling + pointDelta),
          vorp: roundTo(expectedPoints - player.replacement_points),
          role_notes: [
            ...player.role_notes,
            ...notes.map((note) => `Overlay: ${note}`),
            `Overlay expected points delta applied: ${roundTo(pointDelta)}.`,
          ],
        };
      }),
    },
  };
};
