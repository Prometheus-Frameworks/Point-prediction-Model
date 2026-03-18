import { writeFile } from 'node:fs/promises';
import type { ScenarioRunResult } from '../models/scenarios/runScenario.js';

export interface ExportRow {
  scenarioId: string;
  scenarioTitle: string;
  playerId: string;
  playerName: string;
  position: string;
  eventType: string;
  baselineTargetsPerGame: number;
  baselineReceptionsPerGame: number;
  baselineYardsPerGame: number;
  baselineTdsPerGame: number;
  baselineRushPointsPerGame: number;
  baselinePointsPerGame: number;
  adjustedTargetsPerGame: number;
  adjustedReceptionsPerGame: number;
  adjustedYardsPerGame: number;
  adjustedTdsPerGame: number;
  adjustedRushPointsPerGame: number;
  adjustedPointsPerGame: number;
  deltaPointsPerGame: number;
  confidenceScore: number;
  confidenceBand: string;
}

export const toExportRows = (results: ScenarioRunResult[]): ExportRow[] =>
  results.map((result) => ({
    scenarioId: result.scenarioId,
    scenarioTitle: result.scenarioTitle,
    playerId: result.player.id,
    playerName: result.player.name,
    position: result.player.position,
    eventType: result.eventType ?? 'NONE',
    baselineTargetsPerGame: result.baseline.targetsPerGame,
    baselineReceptionsPerGame: result.baseline.receptionsPerGame,
    baselineYardsPerGame: result.baseline.yardsPerGame,
    baselineTdsPerGame: result.baseline.tdsPerGame,
    baselineRushPointsPerGame: result.baseline.rushPointsPerGame,
    baselinePointsPerGame: result.baseline.pprPointsPerGame,
    adjustedTargetsPerGame: result.adjusted.targetsPerGame,
    adjustedReceptionsPerGame: result.adjusted.receptionsPerGame,
    adjustedYardsPerGame: result.adjusted.yardsPerGame,
    adjustedTdsPerGame: result.adjusted.tdsPerGame,
    adjustedRushPointsPerGame: result.adjusted.rushPointsPerGame,
    adjustedPointsPerGame: result.adjusted.pprPointsPerGame,
    deltaPointsPerGame: result.deltaPprPointsPerGame,
    confidenceScore: result.confidenceScore,
    confidenceBand: result.confidenceBand,
  }));

export const exportJson = async (results: ScenarioRunResult[], outputPath: string): Promise<string> => {
  const rows = toExportRows(results);
  await writeFile(outputPath, JSON.stringify(rows, null, 2), 'utf8');
  return outputPath;
};
