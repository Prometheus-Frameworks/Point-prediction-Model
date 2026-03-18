import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { formatIngestSummaryTable } from './cli/formatIngestSummaryTable.js';
import { formatSummaryTable } from './cli/formatSummaryTable.js';
import { parseCliArgs } from './cli/parseCliArgs.js';
import { loadRawEventFile } from './io/loadRawEventFile.js';
import { loadScenarioFile } from './io/loadScenarioFile.js';
import { getDefaultScenarios, getScenarioById, scenarioRegistry } from './models/scenarios/registry.js';
import { buildScenarios } from './services/buildScenariosService.js';
import { ingestRawEvents } from './services/ingestRawEventsService.js';
import { projectBatch } from './services/projectBatchService.js';
import type { ServiceFailure } from './services/result.js';
import type { ScenarioRunResult } from './models/scenarios/runScenario.js';
import type { ProjectionScenario } from './types/scenario.js';
import type { NormalizedEvent } from './ingestion/types/normalizedEvent.js';
import { exportCsv } from './io/exportCsv.js';
import { exportJson } from './io/exportJson.js';
import { summarizeDelta } from './utils/explain.js';

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

  if (command.mode === 'file') {
    return {
      label: `scenario file ${command.filePath}`,
      scenarios: await loadScenarioFile(command.filePath),
      exportFormat: command.exportFormat,
    };
  }

  return null;
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

const exportIngestArtifacts = async (
  normalizedEvents: NormalizedEvent[],
  scenarios: ProjectionScenario[],
) => {
  const normalizedEventsPath = path.resolve('normalized-events.json');
  const normalizedScenariosPath = path.resolve('normalized-scenarios.json');

  await writeFile(normalizedEventsPath, JSON.stringify(normalizedEvents, null, 2), 'utf8');
  await writeFile(normalizedScenariosPath, JSON.stringify(scenarios, null, 2), 'utf8');

  console.log(`\nExported ${normalizedEvents.length} normalized event(s) to ${normalizedEventsPath}`);
  console.log(`Exported ${scenarios.length} normalized scenario(s) to ${normalizedScenariosPath}`);
};

const printServiceFailure = (failure: ServiceFailure) => {
  for (const error of failure.errors) {
    console.error(`\nError [${error.code}]: ${error.message}`);

    if (error.details && typeof error.details === 'object' && 'issues' in error.details && Array.isArray(error.details.issues)) {
      for (const issue of error.details.issues) {
        console.error(`- ${issue}`);
      }
      continue;
    }

    if (error.details !== undefined) {
      console.error(JSON.stringify(error.details, null, 2));
    }
  }
};

const printWarnings = (warnings: { code: string; message: string }[]) => {
  for (const warning of warnings) {
    console.warn(`Warning [${warning.code}]: ${warning.message}`);
  }
};

const runIngestMode = async (filePath: string, exportFormat?: 'json') => {
  const rawEvents = await loadRawEventFile(filePath);
  const ingestResult = ingestRawEvents(rawEvents);

  if (!ingestResult.ok) {
    printServiceFailure(ingestResult);
    process.exitCode = 1;
    return;
  }

  const scenarioResult = buildScenarios(ingestResult.data.normalizedEvents);
  if (!scenarioResult.ok) {
    printServiceFailure(scenarioResult);
    process.exitCode = 1;
    return;
  }

  printWarnings([...ingestResult.warnings, ...scenarioResult.warnings]);
  console.log(`\nIngested ${ingestResult.data.rawEvents.length} raw event(s) from ${filePath}.`);
  console.log(`Collapsed to ${ingestResult.data.normalizedEvents.length} normalized event(s) after deduplication.\n`);
  console.log(formatIngestSummaryTable(ingestResult.data.normalizedEvents));

  if (exportFormat === 'json') {
    await exportIngestArtifacts(ingestResult.data.normalizedEvents, scenarioResult.data.scenarios);
  }
};

const main = async () => {
  const command = parseCliArgs(process.argv.slice(2));

  if (command.mode === 'ingest') {
    await runIngestMode(command.filePath, command.exportFormat);
    return;
  }

  printAvailableScenarios();
  const scenarioSelection = await getScenariosToRun();

  if (!scenarioSelection) {
    throw new Error('No scenario selection could be resolved.');
  }

  const { label, scenarios, exportFormat } = scenarioSelection;
  const projectionResult = projectBatch(scenarios);

  if (!projectionResult.ok) {
    printServiceFailure(projectionResult);
    process.exitCode = 1;
    return;
  }

  printWarnings(projectionResult.warnings);

  if (projectionResult.data.results.length === 0) {
    throw new Error(`No scenarios found for ${label}.`);
  }

  console.log(`\nRunning ${projectionResult.data.results.length} scenario(s) from ${label}.\n`);
  console.log(formatSummaryTable(projectionResult.data.results));

  if (projectionResult.data.results.length === 1) {
    printDetailedResult(projectionResult.data.results[0]);
  }

  await maybeExportResults(exportFormat, projectionResult.data.results);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nError: ${message}`);
  process.exitCode = 1;
});
