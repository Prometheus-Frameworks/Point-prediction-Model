import path from 'node:path';
import { historicalSampleDataset } from '../../datasets/examples/historicalSampleDataset.js';
import { evaluateCalibrationService } from '../../services/evaluateCalibrationService.js';
import { evaluateSubgroupStabilityService } from '../../services/evaluateSubgroupStabilityService.js';
import { predictWithIntervalsService } from '../../services/predictWithIntervalsService.js';
import { trainWrTeBaselineModel } from '../training/trainWrTeBaselineModel.js';

const artifactPath = path.resolve('src/models_ml/artifacts/sample-wrte-baseline-model-with-uncertainty.json');

const run = async (): Promise<void> => {
  const trainRows = historicalSampleDataset.slice(0, 4);
  const testRows = historicalSampleDataset.slice(4);
  const trained = await trainWrTeBaselineModel(trainRows, {
    artifactOutputPath: artifactPath,
    createdAt: '2026-03-18T00:00:00.000Z',
  });

  const calibration = await evaluateCalibrationService(historicalSampleDataset, {
    trainWeeks: 2,
    testWeeks: 1,
    stepWeeks: 1,
    minTrainRows: 2,
    generatedAt: '2026-03-18T00:00:00.000Z',
    modelConfig: trained.artifact.config,
    minimumBucketSize: 1,
  });

  if (!calibration.ok) {
    throw new Error(calibration.errors[0]?.message ?? 'Calibration service failed.');
  }

  const predictions = await predictWithIntervalsService(testRows, {
    artifact: {
      ...trained.artifact,
      uncertaintyMetadata: calibration.data.uncertaintyArtifact,
    },
  });

  if (!predictions.ok) {
    throw new Error(predictions.errors[0]?.message ?? 'Prediction service failed.');
  }

  const subgroup = await evaluateSubgroupStabilityService(historicalSampleDataset, {
    trainWeeks: 2,
    testWeeks: 1,
    stepWeeks: 1,
    minTrainRows: 2,
    generatedAt: '2026-03-18T00:00:00.000Z',
    modelConfig: trained.artifact.config,
    uncertaintyArtifact: calibration.data.uncertaintyArtifact,
    minimumBucketSize: 1,
  });

  if (!subgroup.ok) {
    throw new Error(subgroup.errors[0]?.message ?? 'Subgroup stability service failed.');
  }

  console.log(JSON.stringify({
    artifactPath,
    uncertaintyArtifact: calibration.data.uncertaintyArtifact,
    calibration: calibration.data.report,
    subgroup: subgroup.data.report,
    predictions: predictions.data.predictions,
  }, null, 2));
};

void run();
