import type { ProjectionScenario } from '../../types/scenario.js';

export const teVacatedTargetsScenario: ProjectionScenario = {
  metadata: {
    id: 'te-vacated-targets',
    title: 'TE benefits from vacated targets after injury',
    description: 'A tight end gains underneath volume when a top slot option is unavailable.',
    tags: ['injury', 'te'],
    defaultRun: false,
  },
  player: {
    id: 'dalton-kincaid',
    name: 'Dalton Kincaid',
    position: 'TE',
    team: 'BUF',
    sampleSizeGames: 16,
    routesPerGame: 29,
    targetsPerRouteRun: 0.23,
    catchRate: 0.73,
    yardsPerTarget: 7.7,
    tdPerTarget: 0.056,
  },
  previousTeamContext: {
    team: 'BUF',
    quarterback: 'Josh Allen',
    targetCompetitionIndex: 76,
    qbEfficiencyIndex: 109,
    passTdEnvironmentIndex: 110,
    playVolumeIndex: 102,
    passRateIndex: 103,
  },
  newTeamContext: {
    team: 'BUF',
    quarterback: 'Josh Allen',
    targetCompetitionIndex: 68,
    qbEfficiencyIndex: 109,
    passTdEnvironmentIndex: 110,
    playVolumeIndex: 102,
    passRateIndex: 103,
  },
  event: {
    type: 'TEAMMATE_INJURY',
    description: 'A high-volume slot receiver suffers a multi-week injury, creating extra underneath targets for the TE.',
    effectiveWeek: 6,
    severity: 7,
    clarity: 0.9,
  },
};
