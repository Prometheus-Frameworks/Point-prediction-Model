import path from 'node:path';
import { formatSummaryTable } from './cli/formatSummaryTable.js';
import { parseCliArgs } from './cli/parseCliArgs.js';
import { exportCsv } from './io/exportCsv.js';
import { exportJson } from './io/exportJson.js';
import { loadScenarioFile } from './io/loadScenarioFile.js';
import { getDefaultScenarios, getScenarioById, scenarioRegistry } from './models/scenarios/registry.js';
import { runScenario, type ScenarioRunResult } from './models/scenarios/runScenario.js';
import { summarizeDelta } from './utils/explain.js';
import type { ProjectionScenario } from './types/scenario.js';

const printAvailableScenarios = () => {
  console.log('Available seeded scenarios:');
  for (const scenario of scenarioRegistry) {
    console.log(`- ${scenario.metadata.id}: ${scenario.metadata.title}`);
  }
};

const getScenariosToRun = async () => {
  const command = parseCliArgs(process.argv.slice(2));

  if (command.mode === 'default') {
    return { label: 'default seeded scenarios', scenarios: getDefaultScenarios(), exportFormat: command.exportFormat };
  }

  if (command.mode === 'all') {
    return { label: 'all seeded scenarios', scenarios: scenarioRegistry, exportFormat: command.exportFormat };
  }

  if (command.mode === 'scenario') {
    const scenario = getScenarioById(command.scenarioId);
    if (!scenario) {
      throw new Error(`No seeded scenario matched id '${command.scenarioId}'.`);
    }

    return { label: `seeded scenario '${command.scenarioId}'`, scenarios: [scenario], exportFormat: command.exportFormat };
  }

  return {
    label: `scenario file ${command.filePath}`,
    scenarios: await loadScenarioFile(command.filePath),
    exportFormat: command.exportFormat,
  };
};

const printDetailedResult = (result: ScenarioRunResult) => {
  console.log(`\n=== ${result.scenarioTitle} (${result.scenarioId}) ===`);
  console.log(result.scenarioDescription);
  console.log(`Player: ${result.player.name} (${result.player.position})`);
  console.log(`Event Type: ${result.eventType ?? 'NONE'}`);
  console.log(`Confidence: ${result.confidenceBand} (${result.confidenceScore})`);
  console.log('Metric deltas:');
  for (const bullet of summarizeDelta(result.baseline, result.adjusted)) {
    console.log(`  - ${bullet}`);
  }
  console.log('Explanation:');
  for (const bullet of result.explanation) {
    console.log(`  - ${bullet}`);
  }
};

const maybeExportResults = async (
  exportFormat: 'json' | 'csv' | undefined,
  results: ScenarioRunResult[],
) => {
  if (!exportFormat) {
    return;
  }

  const outputPath = path.resolve(exportFormat === 'json' ? 'results.json' : 'results.csv');
  const exporter = exportFormat === 'json' ? exportJson : exportCsv;
  await exporter(results, outputPath);
  console.log(`\nExported ${results.length} result(s) to ${outputPath}`);
};

const main = async () => {
  printAvailableScenarios();
  const { label, scenarios, exportFormat } = await getScenariosToRun();

  if (scenarios.length === 0) {
    throw new Error(`No scenarios found for ${label}.`);
  }

  const results = scenarios.map((scenario: ProjectionScenario) => runScenario(scenario));

  console.log(`\nRunning ${results.length} scenario(s) from ${label}.\n`);
  console.log(formatSummaryTable(results));

  if (results.length === 1) {
    printDetailedResult(results[0]);
  }

  await maybeExportResults(exportFormat, results);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nError: ${message}`);
  process.exitCode = 1;
});
