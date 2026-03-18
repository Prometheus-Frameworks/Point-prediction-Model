import type { ProjectionScenario } from '../../types/scenario.js';

export const rookieCrowdedRoomScenario: ProjectionScenario = {
  metadata: {
    id: 'rookie-crowded-room',
    title: 'WR room gets crowded after rookie addition',
    description: 'An incumbent WR faces a modest, uncertain squeeze after the team drafts a rookie early.',
    tags: ['rookie', 'wr'],
    defaultRun: true,
  },
  player: {
    id: 'christian-kirk',
    name: 'Christian Kirk',
    position: 'WR',
    team: 'JAX',
    sampleSizeGames: 12,
    routesPerGame: 30,
    targetsPerRouteRun: 0.21,
    catchRate: 0.69,
    yardsPerTarget: 7.9,
    tdPerTarget: 0.048,
  },
  previousTeamContext: {
    team: 'JAX',
    quarterback: 'Trevor Lawrence',
    targetCompetitionIndex: 74,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 100,
    playVolumeIndex: 99,
    passRateIndex: 100,
  },
  newTeamContext: {
    team: 'JAX',
    quarterback: 'Trevor Lawrence',
    targetCompetitionIndex: 79,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 100,
    playVolumeIndex: 99,
    passRateIndex: 100,
  },
  event: {
    type: 'ROOKIE_ADDED',
    description: 'Jacksonville adds an early-round rookie wide receiver to an already crowded rotation.',
    effectiveWeek: 1,
    severity: 6,
    clarity: 0.55,
  },
};
