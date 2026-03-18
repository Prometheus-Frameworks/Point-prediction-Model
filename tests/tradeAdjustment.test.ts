import { describe, expect, it } from 'vitest';
import { applyTradeAdjustment } from '../src/models/adjustments/tradeAdjustment.js';
import { dolphinsContext, broncosContext, jaylenWaddle, waddleTradeEvent } from '../src/data/scenarios/waddleToBroncos.js';

describe('applyTradeAdjustment', () => {
  it('adjusts underlying inputs instead of directly adding fantasy points', () => {
    const adjusted = applyTradeAdjustment(
      jaylenWaddle,
      dolphinsContext,
      broncosContext,
      waddleTradeEvent,
    );

    expect(adjusted.routesPerGame).not.toBe(jaylenWaddle.routesPerGame);
    expect(adjusted.targetsPerRouteRun).not.toBe(jaylenWaddle.targetsPerRouteRun);
    expect(adjusted.catchRate).not.toBe(jaylenWaddle.catchRate);
    expect(adjusted.yardsPerTarget).not.toBe(jaylenWaddle.yardsPerTarget);
    expect(adjusted.tdPerTarget).not.toBe(jaylenWaddle.tdPerTarget);

    expect(adjusted.multipliers.volume).toBeGreaterThanOrEqual(0.82);
    expect(adjusted.multipliers.volume).toBeLessThanOrEqual(1.18);
    expect(adjusted.multipliers.competition).toBeGreaterThanOrEqual(0.85);
    expect(adjusted.multipliers.competition).toBeLessThanOrEqual(1.15);
    expect(adjusted.multipliers.qbEfficiency).toBeGreaterThanOrEqual(0.88);
    expect(adjusted.multipliers.qbEfficiency).toBeLessThanOrEqual(1.12);
    expect(adjusted.multipliers.passTdEnvironment).toBeGreaterThanOrEqual(0.82);
    expect(adjusted.multipliers.passTdEnvironment).toBeLessThanOrEqual(1.18);
  });
});
