import path from 'node:path';
import { historicalSampleDataset } from '../../datasets/examples/historicalSampleDataset.js';
import { evaluateModelAgainstBenchmarks } from '../evaluation/evaluateModelAgainstBenchmarks.js';
import { loadModelArtifact } from '../inference/loadModelArtifact.js';
import { predictWrTeBaselineModel } from '../inference/predictWrTeBaselineModel.js';

const artifactPath = path.resolve('src/models_ml/artifacts/sample-wrte-baseline-model.json');

const run = async (): Promise<void> => {
  const trainRows = historicalSampleDataset.slice(0, 4);
  const testRows = historicalSampleDataset.slice(4);
  const result = await evaluateModelAgainstBenchmarks(trainRows, testRows, {
    artifactOutputPath: artifactPath,
    createdAt: '2026-03-18T00:00:00.000Z',
  });

  const loadedArtifact = await loadModelArtifact(artifactPath);
  const predictions = predictWrTeBaselineModel(loadedArtifact, testRows);

  console.log(JSON.stringify({
    artifactPath,
    comparison: result.comparison,
    topFeatureImportance: loadedArtifact.featureImportance.slice(0, 5),
    predictions,
  }, null, 2));
};

void run();
