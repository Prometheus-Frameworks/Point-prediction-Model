import { describe, expect, it } from 'vitest';
import { calculateBaselineProjection } from '../src/models/baseline/wrProjection.js';
import type { PlayerProfile } from '../src/types/player.js';

describe('calculateBaselineProjection', () => {
  it('applies the baseline PPR formula arithmetic for a pass-catcher', () => {
    const player: PlayerProfile = {
      id: 'test-wr',
      name: 'Test Receiver',
      position: 'WR',
      team: 'AAA',
      sampleSizeGames: 17,
      routesPerGame: 30,
      targetsPerRouteRun: 0.25,
      catchRate: 0.7,
      yardsPerTarget: 8,
      tdPerTarget: 0.05,
      rushPointsPerGame: 0.5,
    };

    const projection = calculateBaselineProjection(player);

    expect(projection.targetsPerGame).toBe(7.5);
    expect(projection.receptionsPerGame).toBe(5.25);
    expect(projection.yardsPerGame).toBe(60);
    expect(projection.tdsPerGame).toBe(0.38);
    expect(projection.pprPointsPerGame).toBe(14);
  });
});
