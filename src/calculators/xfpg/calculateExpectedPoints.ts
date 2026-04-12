import type { PlayerOpportunityInput } from '../../contracts/scoring.js';
import { calculatePassCatcherXfpg } from './calculatePassCatcherXfpg.js';
import { calculateQbXfpg } from './calculateQbXfpg.js';
import { calculateRbXfpg } from './calculateRbXfpg.js';

export const calculateExpectedPoints = (player: PlayerOpportunityInput): number => {
  if (player.position === 'QB') {
    return calculateQbXfpg(player);
  }

  if (player.position === 'RB') {
    return calculateRbXfpg(player);
  }

  return calculatePassCatcherXfpg(player);
};
