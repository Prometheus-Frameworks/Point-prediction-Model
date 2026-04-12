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
  const players = request.players.map((player) => {
    const overlayResult = applyScenarioOverlay(player, request.overlays ?? []);
    if (overlayResult.notes.length > 0) {
      overlayNotes.set(player.player_id, overlayResult.notes);
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

        return {
          ...player,
          role_notes: [...player.role_notes, ...notes.map((note) => `Overlay: ${note}`)],
        };
      }),
    },
  };
};
