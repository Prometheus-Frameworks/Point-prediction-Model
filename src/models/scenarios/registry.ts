import type { ProjectionScenario } from '../../types/scenario.js';
import { freeAgentSigningScenario } from '../../data/scenarios/freeAgentSigning.js';
import { rookieCrowdedRoomScenario } from '../../data/scenarios/rookieCrowdedRoom.js';
import { teVacatedTargetsScenario } from '../../data/scenarios/teVacatedTargets.js';
import { waddleToBroncosScenario } from '../../data/scenarios/waddleToBroncos.js';
import { wrTeammateInjuryScenario } from '../../data/scenarios/wrTeammateInjury.js';

export const scenarioRegistry: ProjectionScenario[] = [
  waddleToBroncosScenario,
  wrTeammateInjuryScenario,
  freeAgentSigningScenario,
  rookieCrowdedRoomScenario,
  teVacatedTargetsScenario,
];

export const getScenarioById = (scenarioId: string): ProjectionScenario | undefined =>
  scenarioRegistry.find((scenario) => scenario.metadata.id === scenarioId);

export const getDefaultScenarios = (): ProjectionScenario[] =>
  scenarioRegistry.filter((scenario) => scenario.metadata.defaultRun);
