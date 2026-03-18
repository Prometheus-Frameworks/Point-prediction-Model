import type { ProjectionEvent } from '../../types/event.js';
import type { PlayerProfile } from '../../types/player.js';
import type { TeamContext } from '../../types/team.js';
import { identityMultipliers, buildAdjustedInputs } from './helpers.js';
import type { AdjustedProjectionInputs } from './types.js';
import { applyPlayerSigningAdjustment } from './handlers/playerSigning.js';
import { applyPlayerTradeAdjustment } from './handlers/playerTrade.js';
import { applyRookieAddedAdjustment } from './handlers/rookieAdded.js';
import { applyTeammateInjuryAdjustment } from './handlers/teammateInjury.js';

export const dispatchEventAdjustment = (
  player: PlayerProfile,
  previousTeam: TeamContext,
  nextTeam: TeamContext,
  event?: ProjectionEvent,
): AdjustedProjectionInputs => {
  if (!event) {
    return buildAdjustedInputs(player, identityMultipliers(), ['No event applied.'], []);
  }

  switch (event.type) {
    case 'PLAYER_TRADE':
      return applyPlayerTradeAdjustment(player, previousTeam, nextTeam, event);
    case 'TEAMMATE_INJURY':
      return applyTeammateInjuryAdjustment(player, previousTeam, nextTeam, event);
    case 'PLAYER_SIGNING':
      return applyPlayerSigningAdjustment(player, previousTeam, nextTeam, event);
    case 'ROOKIE_ADDED':
      return applyRookieAddedAdjustment(player, previousTeam, nextTeam, event);
    default: {
      const exhaustiveCheck: never = event.type;
      throw new Error(`Unhandled event type: ${exhaustiveCheck}`);
    }
  }
};
