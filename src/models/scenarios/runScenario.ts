import type { ProjectionOutput } from '../../types/projection.js';
import type { ProjectionScenario } from '../../types/scenario.js';
import { projectPlayer } from '../projection/projectPlayer.js';

export interface ScenarioRunResult extends ProjectionOutput {
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string;
  scenarioTags: string[];
}

export const runScenario = (scenario: ProjectionScenario): ScenarioRunResult => ({
  scenarioId: scenario.metadata.id,
  scenarioTitle: scenario.metadata.title,
  scenarioDescription: scenario.metadata.description,
  scenarioTags: scenario.metadata.tags ?? [],
  ...projectPlayer(
    scenario.player,
    scenario.previousTeamContext,
    scenario.newTeamContext,
    scenario.event,
  ),
});
