import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectionScenario } from '../types/scenario.js';
import { parseScenarioCsv } from './parseScenarioCsv.js';
import { parseScenarioJson } from './parseScenarioJson.js';
import { ScenarioValidationError } from './validateScenario.js';

export const loadScenarioFile = async (filePath: string): Promise<ProjectionScenario[]> => {
  const resolvedPath = path.resolve(filePath);
  const extension = path.extname(resolvedPath).toLowerCase();
  const raw = await readFile(resolvedPath, 'utf8');

  if (extension === '.json') {
    return parseScenarioJson(raw);
  }

  if (extension === '.csv') {
    return parseScenarioCsv(raw);
  }

  throw new ScenarioValidationError([
    `Unsupported file extension '${extension || '(none)'}'. Use .json or .csv scenario files.`,
  ]);
};
