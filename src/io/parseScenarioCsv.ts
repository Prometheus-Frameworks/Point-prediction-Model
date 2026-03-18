import type { ProjectionScenario } from '../types/scenario.js';
import { validateScenarios } from './validateScenario.js';

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const parseBoolean = (value: string): boolean | undefined => {
  if (value === '') {
    return undefined;
  }

  return value.toLowerCase() === 'true';
};

const parseNumber = (value: string): number | undefined => {
  if (value === '') {
    return undefined;
  }

  return Number(value);
};

const parseStringList = (value: string): string[] | undefined => {
  if (value.trim() === '') {
    return undefined;
  }

  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildTeamContext = (
  prefix: string,
  record: Record<string, string>,
): ProjectionScenario['event']['fromTeam'] => {
  if (!record[`${prefix}Team`] && !record[`${prefix}Quarterback`]) {
    return undefined;
  }

  return {
    team: record[`${prefix}Team`],
    quarterback: record[`${prefix}Quarterback`],
    targetCompetitionIndex: parseNumber(record[`${prefix}TargetCompetitionIndex`]) as number,
    qbEfficiencyIndex: parseNumber(record[`${prefix}QbEfficiencyIndex`]) as number,
    passTdEnvironmentIndex: parseNumber(record[`${prefix}PassTdEnvironmentIndex`]) as number,
    playVolumeIndex: parseNumber(record[`${prefix}PlayVolumeIndex`]) as number,
    passRateIndex: parseNumber(record[`${prefix}PassRateIndex`]) as number,
  };
};

const mapRecordToScenario = (record: Record<string, string>): ProjectionScenario => ({
  metadata: {
    id: record.scenarioId,
    title: record.title,
    description: record.description,
    tags: parseStringList(record.tags),
    defaultRun: parseBoolean(record.defaultRun),
  },
  player: {
    id: record.playerId,
    name: record.playerName,
    position: record.position as 'WR' | 'TE',
    team: record.playerTeam,
    sampleSizeGames: parseNumber(record.sampleSizeGames) as number,
    routesPerGame: parseNumber(record.routesPerGame) as number,
    targetsPerRouteRun: parseNumber(record.targetsPerRouteRun) as number,
    catchRate: parseNumber(record.catchRate) as number,
    yardsPerTarget: parseNumber(record.yardsPerTarget) as number,
    tdPerTarget: parseNumber(record.tdPerTarget) as number,
    rushPointsPerGame: parseNumber(record.rushPointsPerGame),
  },
  previousTeamContext: {
    team: record.previousTeam,
    quarterback: record.previousQuarterback,
    targetCompetitionIndex: parseNumber(record.previousTargetCompetitionIndex) as number,
    qbEfficiencyIndex: parseNumber(record.previousQbEfficiencyIndex) as number,
    passTdEnvironmentIndex: parseNumber(record.previousPassTdEnvironmentIndex) as number,
    playVolumeIndex: parseNumber(record.previousPlayVolumeIndex) as number,
    passRateIndex: parseNumber(record.previousPassRateIndex) as number,
  },
  newTeamContext: {
    team: record.newTeam,
    quarterback: record.newQuarterback,
    targetCompetitionIndex: parseNumber(record.newTargetCompetitionIndex) as number,
    qbEfficiencyIndex: parseNumber(record.newQbEfficiencyIndex) as number,
    passTdEnvironmentIndex: parseNumber(record.newPassTdEnvironmentIndex) as number,
    playVolumeIndex: parseNumber(record.newPlayVolumeIndex) as number,
    passRateIndex: parseNumber(record.newPassRateIndex) as number,
  },
  event: {
    type: record.eventType as ProjectionScenario['event']['type'],
    description: record.eventDescription,
    effectiveWeek: parseNumber(record.effectiveWeek) as number,
    severity: parseNumber(record.eventSeverity),
    clarity: parseNumber(record.eventClarity),
    materiallyChangedVariables: parseStringList(record.eventMateriallyChangedVariables) as ProjectionScenario['event']['materiallyChangedVariables'],
    fromTeam: buildTeamContext('eventFrom', record),
    toTeam: buildTeamContext('eventTo', record),
  },
});

export const parseScenarioCsv = (raw: string): ProjectionScenario[] => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return validateScenarios([]);
  }

  const headers = parseCsvLine(lines[0]);
  const records = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });

    return mapRecordToScenario(record);
  });

  return validateScenarios(records);
};
