import type { ScenarioRunResult } from '../models/scenarios/runScenario.js';

const formatCell = (value: string | number, width: number) => String(value).padEnd(width, ' ');

export const formatSummaryTable = (results: ScenarioRunResult[]): string => {
  const rows = results.map((result) => ({
    scenarioId: result.scenarioId,
    playerName: result.player.name,
    eventType: result.eventType ?? 'NONE',
    baselinePointsPerGame: result.baseline.pprPointsPerGame.toFixed(2),
    adjustedPointsPerGame: result.adjusted.pprPointsPerGame.toFixed(2),
    deltaPointsPerGame: result.deltaPprPointsPerGame.toFixed(2),
    confidenceBand: `${result.confidenceBand} (${result.confidenceScore})`,
  }));

  const headers = [
    'scenarioId',
    'playerName',
    'eventType',
    'baselinePointsPerGame',
    'adjustedPointsPerGame',
    'deltaPointsPerGame',
    'confidenceBand',
  ] as const;

  const widths = headers.map((header) =>
    Math.max(header.length, ...rows.map((row) => row[header].length)),
  );

  const headerRow = headers.map((header, index) => formatCell(header, widths[index])).join(' | ');
  const dividerRow = widths.map((width) => '-'.repeat(width)).join('-|-');
  const dataRows = rows.map((row) =>
    headers.map((header, index) => formatCell(row[header], widths[index])).join(' | '),
  );

  return [headerRow, dividerRow, ...dataRows].join('\n');
};
