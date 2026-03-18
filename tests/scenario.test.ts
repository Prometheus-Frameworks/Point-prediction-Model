import { describe, expect, it } from 'vitest';
import { broncosContext, dolphinsContext, jaylenWaddle, waddleTradeEvent } from '../src/data/scenarios/waddleToBroncos.js';
import { projectPlayer } from '../src/models/projection/projectPlayer.js';

describe('Waddle trade scenario', () => {
  it('returns a valid before/after projection with explanation bullets', () => {
    const output = projectPlayer(
      jaylenWaddle,
      dolphinsContext,
      broncosContext,
      waddleTradeEvent,
    );

    expect(output.player.name).toBe('Jaylen Waddle');
    expect(output.event?.type).toBe('PLAYER_TRADE');
    expect(output.baseline.pprPointsPerGame).toBeGreaterThan(0);
    expect(output.adjusted.pprPointsPerGame).toBeGreaterThan(0);
    expect(output.deltaPprPointsPerGame).not.toBeNaN();
    expect(output.explanation.length).toBeGreaterThanOrEqual(5);
  });
});
