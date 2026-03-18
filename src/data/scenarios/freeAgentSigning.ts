import type { ProjectionScenario } from '../../types/scenario.js';

export const freeAgentSigningScenario: ProjectionScenario = {
  metadata: {
    id: 'free-agent-signing',
    title: 'Incumbent TE loses share after veteran signing',
    description: 'A team signs a proven pass-catching TE, compressing routes and red-zone access.',
    tags: ['signing', 'te'],
    defaultRun: true,
  },
  player: {
    id: 'cole-kmet',
    name: 'Cole Kmet',
    position: 'TE',
    team: 'CHI',
    sampleSizeGames: 17,
    routesPerGame: 28,
    targetsPerRouteRun: 0.2,
    catchRate: 0.71,
    yardsPerTarget: 7.5,
    tdPerTarget: 0.061,
  },
  previousTeamContext: {
    team: 'CHI',
    quarterback: 'Caleb Williams',
    targetCompetitionIndex: 71,
    qbEfficiencyIndex: 99,
    passTdEnvironmentIndex: 98,
    playVolumeIndex: 100,
    passRateIndex: 98,
  },
  newTeamContext: {
    team: 'CHI',
    quarterback: 'Caleb Williams',
    targetCompetitionIndex: 82,
    qbEfficiencyIndex: 99,
    passTdEnvironmentIndex: 98,
    playVolumeIndex: 100,
    passRateIndex: 98,
  },
  event: {
    type: 'PLAYER_SIGNING',
    description: 'The Bears sign a veteran pass-catching tight end to a meaningful contract.',
    effectiveWeek: 1,
    severity: 7,
    clarity: 0.8,
    materiallyChangedVariables: ['routesPerGame', 'targetsPerRouteRun', 'tdPerTarget'],
  },
};
