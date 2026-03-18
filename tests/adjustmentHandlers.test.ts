import { describe, expect, it } from 'vitest';
import { freeAgentSigningScenario } from '../src/data/scenarios/freeAgentSigning.js';
import { rookieCrowdedRoomScenario } from '../src/data/scenarios/rookieCrowdedRoom.js';
import { waddleToBroncosScenario } from '../src/data/scenarios/waddleToBroncos.js';
import { wrTeammateInjuryScenario } from '../src/data/scenarios/wrTeammateInjury.js';
import { dispatchEventAdjustment } from '../src/models/adjustments/dispatchEventAdjustment.js';

describe('event adjustment handlers', () => {
  it('routes PLAYER_TRADE events through the trade handler', () => {
    const adjusted = dispatchEventAdjustment(
      waddleToBroncosScenario.player,
      waddleToBroncosScenario.previousTeamContext,
      waddleToBroncosScenario.newTeamContext,
      waddleToBroncosScenario.event,
    );

    expect(adjusted.routesPerGame).not.toBe(waddleToBroncosScenario.player.routesPerGame);
    expect(adjusted.targetsPerRouteRun).not.toBe(waddleToBroncosScenario.player.targetsPerRouteRun);
    expect(adjusted.catchRate).not.toBe(waddleToBroncosScenario.player.catchRate);
  });

  it('boosts opportunity for TEAMMATE_INJURY events', () => {
    const adjusted = dispatchEventAdjustment(
      wrTeammateInjuryScenario.player,
      wrTeammateInjuryScenario.previousTeamContext,
      wrTeammateInjuryScenario.newTeamContext,
      wrTeammateInjuryScenario.event,
    );

    expect(adjusted.targetsPerRouteRun).toBeGreaterThan(wrTeammateInjuryScenario.player.targetsPerRouteRun);
    expect(adjusted.routesPerGame).toBeGreaterThan(wrTeammateInjuryScenario.player.routesPerGame);
  });

  it('reduces opportunity for PLAYER_SIGNING events', () => {
    const adjusted = dispatchEventAdjustment(
      freeAgentSigningScenario.player,
      freeAgentSigningScenario.previousTeamContext,
      freeAgentSigningScenario.newTeamContext,
      freeAgentSigningScenario.event,
    );

    expect(adjusted.targetsPerRouteRun).toBeLessThan(freeAgentSigningScenario.player.targetsPerRouteRun);
    expect(adjusted.tdPerTarget).toBeLessThan(freeAgentSigningScenario.player.tdPerTarget);
  });

  it('keeps ROOKIE_ADDED adjustments modest and uncertain', () => {
    const adjusted = dispatchEventAdjustment(
      rookieCrowdedRoomScenario.player,
      rookieCrowdedRoomScenario.previousTeamContext,
      rookieCrowdedRoomScenario.newTeamContext,
      rookieCrowdedRoomScenario.event,
    );

    expect(adjusted.targetsPerRouteRun).toBeLessThan(rookieCrowdedRoomScenario.player.targetsPerRouteRun);
    expect(adjusted.multipliers.competition).toBeGreaterThanOrEqual(0.92);
    expect(adjusted.multipliers.competition).toBeLessThan(1);
  });
});
