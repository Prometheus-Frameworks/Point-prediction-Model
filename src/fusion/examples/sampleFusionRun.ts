import { historicalSampleDataset } from '../../datasets/examples/historicalSampleDataset.js';
import { sampleFeatureRows } from '../../features/examples/sampleFeatureRows.js';
import { runScenario } from '../../models/scenarios/runScenario.js';
import { predictWrTeBaselineModel } from '../../models_ml/inference/predictWrTeBaselineModel.js';
import { trainWrTeBaselineModel } from '../../models_ml/training/trainWrTeBaselineModel.js';
import { estimateResidualBands } from '../../models_ml/uncertainty/estimateResidualBands.js';
import type { ProjectionScenario } from '../../types/scenario.js';
import { fuseScenarioWithModel } from '../core/fuseScenarioWithModel.js';

const sampleFusionScenario: ProjectionScenario = {
  metadata: {
    id: 'sample-fusion-trade',
    title: 'Sample fusion trade adjustment',
    description: 'Demonstrates combining the baseline model with an event delta from the scenario engine.',
    tags: ['fusion', 'sample'],
    defaultRun: false,
  },
  player: {
    id: 'sample-fusion-player',
    name: 'Sample Fusion WR',
    position: 'WR',
    team: 'MIA',
    sampleSizeGames: 17,
    routesPerGame: 34,
    targetsPerRouteRun: 0.24,
    catchRate: 0.65,
    yardsPerTarget: 8.7,
    tdPerTarget: 0.065,
    rushPointsPerGame: 0.2,
  },
  previousTeamContext: {
    team: 'MIA',
    quarterback: 'Tua Tagovailoa',
    targetCompetitionIndex: 70,
    qbEfficiencyIndex: 108,
    passTdEnvironmentIndex: 107,
    playVolumeIndex: 102,
    passRateIndex: 104,
  },
  newTeamContext: {
    team: 'DEN',
    quarterback: 'Bo Nix',
    targetCompetitionIndex: 61,
    qbEfficiencyIndex: 97,
    passTdEnvironmentIndex: 98,
    playVolumeIndex: 99,
    passRateIndex: 97,
  },
  event: {
    type: 'PLAYER_TRADE',
    description: 'The player moves into a slightly thinner target room.',
    effectiveWeek: 1,
    severity: 7,
    clarity: 0.83,
    fromTeam: {
      team: 'MIA',
      quarterback: 'Tua Tagovailoa',
      targetCompetitionIndex: 70,
      qbEfficiencyIndex: 108,
      passTdEnvironmentIndex: 107,
      playVolumeIndex: 102,
      passRateIndex: 104,
    },
    toTeam: {
      team: 'DEN',
      quarterback: 'Bo Nix',
      targetCompetitionIndex: 61,
      qbEfficiencyIndex: 97,
      passTdEnvironmentIndex: 98,
      playVolumeIndex: 99,
      passRateIndex: 97,
    },
  },
};

export const sampleFusionRun = async () => {
  const trained = await trainWrTeBaselineModel(historicalSampleDataset.slice(0, 4), {
    createdAt: '2026-03-18T00:00:00.000Z',
    config: {
      nEstimators: 4,
      maxDepth: 2,
      minSamplesSplit: 2,
      minSamplesLeaf: 1,
    },
  });

  const uncertainty = estimateResidualBands(
    historicalSampleDataset.slice(4).map((row) => ({
      row,
      actual: row.target_fantasy_points_ppr,
      pointPrediction: row.target_fantasy_points_ppr,
    })),
    {
      generatedAt: '2026-03-18T00:00:00.000Z',
      minimumBucketSize: 1,
    },
  );

  const [baselinePrediction] = predictWrTeBaselineModel(
    { ...trained.artifact, uncertaintyMetadata: uncertainty },
    [sampleFeatureRows.tradedWr],
  );

  return fuseScenarioWithModel({
    row: sampleFeatureRows.tradedWr,
    baselinePrediction,
    scenarioResult: runScenario(sampleFusionScenario),
  });
};
