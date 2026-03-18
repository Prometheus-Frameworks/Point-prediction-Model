import { getDefaultScenarios, scenarioRegistry } from './models/scenarios/registry.js';
import { runScenario } from './models/scenarios/runScenario.js';
import { summarizeDelta } from './utils/explain.js';

const requestedScenarioId = process.argv[2];

const scenariosToRun =
  requestedScenarioId === 'all'
    ? scenarioRegistry
    : requestedScenarioId
      ? scenarioRegistry.filter((scenario) => scenario.metadata.id === requestedScenarioId)
      : getDefaultScenarios();

console.log('Available scenarios:');
for (const scenario of scenarioRegistry) {
  console.log(`- ${scenario.metadata.id}: ${scenario.metadata.title}`);
}

if (scenariosToRun.length === 0) {
  console.error(`\nNo scenarios matched input: ${requestedScenarioId}`);
  process.exitCode = 1;
} else {
  console.log(`\nRunning ${scenariosToRun.length} scenario(s)...\n`);
}

for (const scenario of scenariosToRun) {
  const result = runScenario(scenario);
  console.log(`=== ${scenario.metadata.title} ===`);
  console.log(`${scenario.metadata.description}`);
  console.log(`Player: ${result.player.name} (${result.player.position})`);
  console.log(`Event Type: ${result.eventType ?? 'NONE'}`);
  console.log(`Confidence: ${result.confidenceScore} (${result.confidenceBand})`);
  console.log(`Baseline PPR/G: ${result.baseline.pprPointsPerGame}`);
  console.log(`Adjusted PPR/G: ${result.adjusted.pprPointsPerGame}`);
  console.log(`Delta PPR/G: ${result.deltaPprPointsPerGame}`);
  console.log('Metric deltas:');
  for (const bullet of summarizeDelta(result.baseline, result.adjusted)) {
    console.log(`  - ${bullet}`);
  }
  console.log('Explanation:');
  for (const bullet of result.explanation) {
    console.log(`  - ${bullet}`);
  }
  console.log('');
}
