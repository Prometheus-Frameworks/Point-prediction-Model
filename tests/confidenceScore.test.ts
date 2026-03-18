import { describe, expect, it } from 'vitest';
import { rookieCrowdedRoomScenario } from '../src/data/scenarios/rookieCrowdedRoom.js';
import { waddleToBroncosScenario } from '../src/data/scenarios/waddleToBroncos.js';
import { calculateConfidenceScore } from '../src/models/adjustments/confidenceScore.js';

describe('calculateConfidenceScore', () => {
  it('assigns higher confidence to clearer, cleaner events', () => {
    const tradeConfidence = calculateConfidenceScore(
      waddleToBroncosScenario.player,
      waddleToBroncosScenario.event,
      ['routesPerGame', 'targetsPerRouteRun', 'catchRate'],
    );
    const rookieConfidence = calculateConfidenceScore(
      rookieCrowdedRoomScenario.player,
      rookieCrowdedRoomScenario.event,
      ['routesPerGame', 'targetsPerRouteRun', 'catchRate', 'yardsPerTarget', 'tdPerTarget'],
    );

    expect(tradeConfidence.confidenceScore).toBeGreaterThan(rookieConfidence.confidenceScore);
    expect(tradeConfidence.confidenceBand).toMatch(/HIGH|MEDIUM/);
    expect(rookieConfidence.confidenceBand).toMatch(/LOW|MEDIUM/);
  });
});
