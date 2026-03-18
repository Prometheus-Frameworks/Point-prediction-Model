import type { ProjectionScenario } from '../../types/scenario.js';

export const wrTeammateInjuryScenario: ProjectionScenario = {
  metadata: {
    id: 'wr-teammate-injury',
    title: 'WR benefits from teammate injury',
    description: 'A WR absorbs vacated looks after a high-volume teammate misses time.',
    tags: ['injury', 'wr'],
    defaultRun: true,
  },
  player: {
    id: 'zay-flowers',
    name: 'Zay Flowers',
    position: 'WR',
    team: 'BAL',
    sampleSizeGames: 16,
    routesPerGame: 31,
    targetsPerRouteRun: 0.22,
    catchRate: 0.68,
    yardsPerTarget: 8.1,
    tdPerTarget: 0.052,
  },
  previousTeamContext: {
    team: 'BAL',
    quarterback: 'Lamar Jackson',
    targetCompetitionIndex: 79,
    qbEfficiencyIndex: 106,
    passTdEnvironmentIndex: 104,
    playVolumeIndex: 96,
    passRateIndex: 93,
  },
  newTeamContext: {
    team: 'BAL',
    quarterback: 'Lamar Jackson',
    targetCompetitionIndex: 70,
    qbEfficiencyIndex: 106,
    passTdEnvironmentIndex: 104,
    playVolumeIndex: 96,
    passRateIndex: 93,
  },
  event: {
    type: 'TEAMMATE_INJURY',
    description: 'A starting perimeter receiver is sidelined for multiple weeks, vacating short and intermediate targets.',
    effectiveWeek: 3,
    severity: 8,
    clarity: 0.88,
    materiallyChangedVariables: ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
  },
};
