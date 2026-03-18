import { writeFile } from 'node:fs/promises';
import type { ScenarioRunResult } from '../models/scenarios/runScenario.js';
import { toExportRows } from './exportJson.js';

const escapeCsv = (value: string | number) => {
  const normalized = String(value);
  return /[",\n]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
};

export const serializeResultsToCsv = (results: ScenarioRunResult[]): string => {
  const rows = toExportRows(results);

  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(','));
  }

  return `${lines.join('\n')}\n`;
};

export const exportCsv = async (results: ScenarioRunResult[], outputPath: string): Promise<string> => {
  await writeFile(outputPath, serializeResultsToCsv(results), 'utf8');
  return outputPath;
};
