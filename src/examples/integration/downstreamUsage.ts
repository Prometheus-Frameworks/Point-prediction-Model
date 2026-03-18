import { projectBatch, projectFromRawEvents, projectScenario } from '../../public/index.js';
import type { ProjectionScenario, RawEvent } from '../../public/index.js';

const rawEvents: RawEvent[] = [
  {
    id: 'integration-raw-trade-1',
    source: 'Integration Fixture Wire',
    eventType: 'TRADE',
    headline: 'Sample WR heads to Denver',
    summary: 'A downstream repo can hand raw events directly to the service layer.',
    reportedAt: '2026-03-18T12:00:00Z',
    effectiveWeek: 1,
    certainty: 'CONFIRMED',
    subjectPlayerName: 'Jaylen Waddle',
    subjectPlayerId: 'jaylen-waddle',
    subjectTeam: 'MIA',
    subjectPosition: 'WR',
    fromTeam: 'MIA',
    toTeam: 'DEN',
    severity: 8,
  },
];

const scenario: ProjectionScenario = {
  metadata: {
    id: 'integration-scenario-1',
    title: 'Downstream single-scenario projection',
    description: 'A downstream repo can also project already-built scenarios.',
    tags: ['integration', 'example'],
    defaultRun: false,
  },
  player: {
    id: 'drake-london',
    name: 'Drake London',
    position: 'WR',
    team: 'ATL',
    sampleSizeGames: 17,
    routesPerGame: 35,
    targetsPerRouteRun: 0.27,
    catchRate: 0.65,
    yardsPerTarget: 8.9,
    tdPerTarget: 0.07,
    rushPointsPerGame: 0.1,
  },
  previousTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 72,
    qbEfficiencyIndex: 102,
    passTdEnvironmentIndex: 101,
    playVolumeIndex: 100,
    passRateIndex: 99,
  },
  newTeamContext: {
    team: 'ATL',
    quarterback: 'Kirk Cousins',
    targetCompetitionIndex: 81,
    qbEfficiencyIndex: 101,
    passTdEnvironmentIndex: 100,
    playVolumeIndex: 100,
    passRateIndex: 98,
  },
  event: {
    type: 'PLAYER_SIGNING',
    description: 'Atlanta signs another proven target earner.',
    effectiveWeek: 1,
    severity: 5,
    clarity: 0.84,
  },
};

const fullPipelineResult = projectFromRawEvents(rawEvents);
if (fullPipelineResult.ok) {
  console.log('Full pipeline result:', fullPipelineResult.data.results[0]);
}

const singleScenarioResult = projectScenario(scenario);
if (singleScenarioResult.ok) {
  console.log('Single scenario result:', singleScenarioResult.data.result.deltaPprPointsPerGame);
}

const batchResult = projectBatch([scenario]);
if (batchResult.ok) {
  console.log('Batch result count:', batchResult.data.results.length);
}
