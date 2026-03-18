import type { ProjectionEventType } from '../types/event.js';
import type { PlayerProfile } from '../types/player.js';
import type { ProjectionScenario } from '../types/scenario.js';
import type { TeamContext } from '../types/team.js';

const supportedEventTypes: ProjectionEventType[] = [
  'PLAYER_TRADE',
  'TEAMMATE_INJURY',
  'PLAYER_SIGNING',
  'ROOKIE_ADDED',
];

export class ScenarioValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Scenario validation failed:\n- ${issues.join('\n- ')}`);
    this.name = 'ScenarioValidationError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const addRequiredString = (issues: string[], value: unknown, path: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push(`${path} is required and must be a non-empty string.`);
  }
};

const addNumberRange = (
  issues: string[],
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    issues.push(`${path} is required and must be a number.`);
    return;
  }

  if (value < minimum || value > maximum) {
    issues.push(`${path} must be between ${minimum} and ${maximum}. Received ${value}.`);
  }
};

const addOptionalNumberRange = (
  issues: string[],
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
) => {
  if (value === undefined) {
    return;
  }

  addNumberRange(issues, value, path, minimum, maximum);
};

const validateTeamContext = (value: unknown, path: string, issues: string[]) => {
  if (!isRecord(value)) {
    issues.push(`${path} is required and must be an object.`);
    return;
  }

  addRequiredString(issues, value.team, `${path}.team`);
  addRequiredString(issues, value.quarterback, `${path}.quarterback`);
  addNumberRange(issues, value.targetCompetitionIndex, `${path}.targetCompetitionIndex`, 1, 200);
  addNumberRange(issues, value.qbEfficiencyIndex, `${path}.qbEfficiencyIndex`, 1, 200);
  addNumberRange(issues, value.passTdEnvironmentIndex, `${path}.passTdEnvironmentIndex`, 1, 200);
  addNumberRange(issues, value.playVolumeIndex, `${path}.playVolumeIndex`, 1, 200);
  addNumberRange(issues, value.passRateIndex, `${path}.passRateIndex`, 1, 200);
};

const validatePlayer = (value: unknown, path: string, issues: string[]) => {
  if (!isRecord(value)) {
    issues.push(`${path} is required and must be an object.`);
    return;
  }

  addRequiredString(issues, value.id, `${path}.id`);
  addRequiredString(issues, value.name, `${path}.name`);
  addRequiredString(issues, value.team, `${path}.team`);
  addNumberRange(issues, value.sampleSizeGames, `${path}.sampleSizeGames`, 1, 17);
  addNumberRange(issues, value.routesPerGame, `${path}.routesPerGame`, 0, 80);
  addNumberRange(issues, value.targetsPerRouteRun, `${path}.targetsPerRouteRun`, 0, 1);
  addNumberRange(issues, value.catchRate, `${path}.catchRate`, 0, 1);
  addNumberRange(issues, value.yardsPerTarget, `${path}.yardsPerTarget`, 0, 30);
  addNumberRange(issues, value.tdPerTarget, `${path}.tdPerTarget`, 0, 1);
  addOptionalNumberRange(issues, value.rushPointsPerGame, `${path}.rushPointsPerGame`, 0, 20);

  if (value.position !== 'WR' && value.position !== 'TE') {
    issues.push(`${path}.position must be either WR or TE.`);
  }
};

const validateEventTeamContext = (value: unknown, path: string, issues: string[]) => {
  if (value === undefined) {
    return;
  }

  validateTeamContext(value, path, issues);
};

const validateEvent = (value: unknown, path: string, issues: string[]) => {
  if (!isRecord(value)) {
    issues.push(`${path} is required and must be an object.`);
    return;
  }

  if (!supportedEventTypes.includes(value.type as ProjectionEventType)) {
    issues.push(
      `${path}.type must be one of ${supportedEventTypes.join(', ')}. Received ${String(value.type)}.`,
    );
  }

  addRequiredString(issues, value.description, `${path}.description`);
  addNumberRange(issues, value.effectiveWeek, `${path}.effectiveWeek`, 1, 18);
  addOptionalNumberRange(issues, value.severity, `${path}.severity`, 0, 10);
  addOptionalNumberRange(issues, value.clarity, `${path}.clarity`, 0, 1);

  if (
    value.materiallyChangedVariables !== undefined &&
    (!Array.isArray(value.materiallyChangedVariables) ||
      value.materiallyChangedVariables.some((item) => typeof item !== 'string'))
  ) {
    issues.push(`${path}.materiallyChangedVariables must be an array of strings when provided.`);
  }

  validateEventTeamContext(value.fromTeam, `${path}.fromTeam`, issues);
  validateEventTeamContext(value.toTeam, `${path}.toTeam`, issues);
};

const cloneScenario = (scenario: ProjectionScenario): ProjectionScenario => ({
  metadata: {
    ...scenario.metadata,
    tags: scenario.metadata.tags ? [...scenario.metadata.tags] : undefined,
  },
  player: { ...scenario.player },
  previousTeamContext: { ...scenario.previousTeamContext },
  newTeamContext: { ...scenario.newTeamContext },
  event: {
    ...scenario.event,
    materiallyChangedVariables: scenario.event.materiallyChangedVariables
      ? [...scenario.event.materiallyChangedVariables]
      : undefined,
    fromTeam: scenario.event.fromTeam ? { ...scenario.event.fromTeam } : undefined,
    toTeam: scenario.event.toTeam ? { ...scenario.event.toTeam } : undefined,
  },
});

export const validateScenario = (scenario: unknown, index?: number): ProjectionScenario => {
  const issues: string[] = [];
  const prefix = index === undefined ? 'scenario' : `scenario[${index}]`;

  if (!isRecord(scenario)) {
    throw new ScenarioValidationError([`${prefix} must be an object.`]);
  }

  if (!isRecord(scenario.metadata)) {
    issues.push(`${prefix}.metadata is required and must be an object.`);
  } else {
    addRequiredString(issues, scenario.metadata.id, `${prefix}.metadata.id`);
    addRequiredString(issues, scenario.metadata.title, `${prefix}.metadata.title`);
    addRequiredString(issues, scenario.metadata.description, `${prefix}.metadata.description`);

    if (
      scenario.metadata.tags !== undefined &&
      (!Array.isArray(scenario.metadata.tags) || scenario.metadata.tags.some((tag) => typeof tag !== 'string'))
    ) {
      issues.push(`${prefix}.metadata.tags must be an array of strings when provided.`);
    }

    if (
      scenario.metadata.defaultRun !== undefined &&
      typeof scenario.metadata.defaultRun !== 'boolean'
    ) {
      issues.push(`${prefix}.metadata.defaultRun must be a boolean when provided.`);
    }
  }

  validatePlayer(scenario.player, `${prefix}.player`, issues);
  validateTeamContext(scenario.previousTeamContext, `${prefix}.previousTeamContext`, issues);
  validateTeamContext(scenario.newTeamContext, `${prefix}.newTeamContext`, issues);
  validateEvent(scenario.event, `${prefix}.event`, issues);

  if (isRecord(scenario.player) && isRecord(scenario.previousTeamContext)) {
    if (scenario.player.team !== scenario.previousTeamContext.team) {
      issues.push(`${prefix}.player.team must match ${prefix}.previousTeamContext.team for a sane baseline.`);
    }
  }

  if (isRecord(scenario.event) && scenario.event.type === 'PLAYER_TRADE') {
    if (!scenario.event.fromTeam || !scenario.event.toTeam) {
      issues.push(`${prefix}.event.fromTeam and ${prefix}.event.toTeam are required for PLAYER_TRADE scenarios.`);
    }
  }

  if (isRecord(scenario.event) && isRecord(scenario.newTeamContext) && isRecord(scenario.event.toTeam)) {
    if (scenario.event.toTeam.team !== scenario.newTeamContext.team) {
      issues.push(`${prefix}.event.toTeam.team must match ${prefix}.newTeamContext.team when provided.`);
    }
  }

  if (isRecord(scenario.event) && isRecord(scenario.previousTeamContext) && isRecord(scenario.event.fromTeam)) {
    if (scenario.event.fromTeam.team !== scenario.previousTeamContext.team) {
      issues.push(`${prefix}.event.fromTeam.team must match ${prefix}.previousTeamContext.team when provided.`);
    }
  }

  if (issues.length > 0) {
    throw new ScenarioValidationError(issues);
  }

  return cloneScenario(scenario as unknown as ProjectionScenario);
};

export const validateScenarios = (scenarios: unknown): ProjectionScenario[] => {
  if (!Array.isArray(scenarios)) {
    throw new ScenarioValidationError(['Input must be a JSON array or CSV file containing one or more scenarios.']);
  }

  const validated = scenarios.map((scenario, index) => validateScenario(scenario, index));
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const scenario of validated) {
    if (seenIds.has(scenario.metadata.id)) {
      duplicateIds.add(scenario.metadata.id);
    }

    seenIds.add(scenario.metadata.id);
  }

  if (duplicateIds.size > 0) {
    throw new ScenarioValidationError(
      Array.from(duplicateIds).map((scenarioId) => `Scenario id '${scenarioId}' must be unique.`),
    );
  }

  return validated;
};

export type { PlayerProfile, ProjectionScenario, TeamContext };
