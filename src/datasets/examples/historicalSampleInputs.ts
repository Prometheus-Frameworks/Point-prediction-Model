import type { HistoricalLabeledRowInput } from '../types/labeledRow.js';
import { sampleFeatureInputs } from '../../features/examples/sampleFeatureInputs.js';

const clone = <T>(value: T): T => structuredClone(value);

export const historicalSampleInputs: HistoricalLabeledRowInput[] = [
  {
    inputId: 'historical-stable-veteran-w6',
    source: clone(sampleFeatureInputs.stableVeteranWr),
    actual: {
      season: 2026,
      week: 6,
      playedAt: '2026-10-11T17:00:00.000Z',
      receptions: 8,
      receivingYards: 96,
      touchdowns: 1,
      fantasyPointsPpr: 23.6,
    },
  },
  {
    inputId: 'historical-rookie-w4',
    source: clone(sampleFeatureInputs.rookieWr),
    actual: {
      season: 2026,
      week: 4,
      playedAt: '2026-10-01T17:15:00.000Z',
      receptions: 5,
      receivingYards: 72,
      touchdowns: 0,
      fantasyPointsPpr: 12.2,
    },
  },
  {
    inputId: 'historical-te-w7',
    source: {
      ...clone(sampleFeatureInputs.volatileTe),
      projection: {
        ...clone(sampleFeatureInputs.volatileTe.projection),
        week: 7,
        projectionLabel: '2026-W7',
        projectionTimestamp: '2026-10-17T12:00:00.000Z',
      },
      windows: {
        ...clone(sampleFeatureInputs.volatileTe.windows),
        trailing3: {
          ...clone(sampleFeatureInputs.volatileTe.windows.trailing3),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
        trailing5: {
          ...clone(sampleFeatureInputs.volatileTe.windows.trailing5),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
        seasonToDate: {
          ...clone(sampleFeatureInputs.volatileTe.windows.seasonToDate),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
      },
      priorGames: clone(sampleFeatureInputs.volatileTe.priorGames).concat({
        week: 6,
        playedAt: '2026-10-10T00:00:00.000Z',
        team: 'IND',
        opponent: 'TEN',
        routes: 30,
        targets: 7,
        receptions: 5,
        receivingYards: 58,
        touchdowns: 1,
        fantasyPoints: 16.8,
      }),
    },
    actual: {
      season: 2026,
      week: 7,
      playedAt: '2026-10-18T17:00:00.000Z',
      receptions: 6,
      receivingYards: 74,
      touchdowns: 1,
      fantasyPointsPpr: 19.4,
    },
  },
  {
    inputId: 'historical-stable-veteran-w7',
    source: {
      ...clone(sampleFeatureInputs.stableVeteranWr),
      projection: {
        ...clone(sampleFeatureInputs.stableVeteranWr.projection),
        week: 7,
        projectionLabel: '2026-W7',
        projectionTimestamp: '2026-10-17T12:00:00.000Z',
      },
      event: {
        ...clone(sampleFeatureInputs.stableVeteranWr.event),
        type: 'TEAMMATE_INJURY',
        timestamp: '2026-10-15T13:00:00.000Z',
        effectiveWeek: 7,
        severity: 6,
        clarity: 0.9,
        teammateTargetShareDelta: 0.08,
      },
      windows: {
        ...clone(sampleFeatureInputs.stableVeteranWr.windows),
        trailing3: {
          ...clone(sampleFeatureInputs.stableVeteranWr.windows.trailing3),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
        trailing5: {
          ...clone(sampleFeatureInputs.stableVeteranWr.windows.trailing5),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
        seasonToDate: {
          ...clone(sampleFeatureInputs.stableVeteranWr.windows.seasonToDate),
          windowEnd: '2026-10-10T00:00:00.000Z',
        },
      },
      priorGames: clone(sampleFeatureInputs.stableVeteranWr.priorGames).concat({
        week: 6,
        playedAt: '2026-10-10T00:00:00.000Z',
        team: 'LV',
        opponent: 'KC',
        routes: 39,
        targets: 11,
        receptions: 8,
        receivingYards: 103,
        touchdowns: 1,
        fantasyPoints: 24.3,
      }),
    },
    actual: {
      season: 2026,
      week: 7,
      playedAt: '2026-10-18T20:25:00.000Z',
      receptions: 9,
      receivingYards: 110,
      touchdowns: 0,
      fantasyPointsPpr: 20,
    },
  },
  {
    inputId: 'historical-rookie-w5',
    source: {
      ...clone(sampleFeatureInputs.rookieWr),
      projection: {
        ...clone(sampleFeatureInputs.rookieWr.projection),
        week: 5,
        projectionLabel: '2026-W5',
        projectionTimestamp: '2026-10-07T12:00:00.000Z',
      },
      windows: {
        ...clone(sampleFeatureInputs.rookieWr.windows),
        trailing3: {
          ...clone(sampleFeatureInputs.rookieWr.windows.trailing3),
          windowEnd: '2026-10-01T00:00:00.000Z',
        },
        trailing5: {
          ...clone(sampleFeatureInputs.rookieWr.windows.trailing5),
          windowEnd: '2026-10-01T00:00:00.000Z',
        },
        seasonToDate: {
          ...clone(sampleFeatureInputs.rookieWr.windows.seasonToDate),
          windowEnd: '2026-10-01T00:00:00.000Z',
        },
      },
      priorGames: clone(sampleFeatureInputs.rookieWr.priorGames).concat({
        week: 4,
        playedAt: '2026-10-01T00:00:00.000Z',
        team: 'ARI',
        opponent: 'SEA',
        routes: 33,
        targets: 9,
        receptions: 6,
        receivingYards: 81,
        touchdowns: 1,
        fantasyPoints: 20.1,
      }),
    },
    actual: {
      season: 2026,
      week: 5,
      playedAt: '2026-10-08T00:15:00.000Z',
      receptions: 4,
      receivingYards: 54,
      touchdowns: 0,
      fantasyPointsPpr: 9.4,
    },
  },
  {
    inputId: 'historical-te-w8',
    source: {
      ...clone(sampleFeatureInputs.volatileTe),
      projection: {
        ...clone(sampleFeatureInputs.volatileTe.projection),
        week: 8,
        projectionLabel: '2026-W8',
        projectionTimestamp: '2026-10-24T12:00:00.000Z',
      },
      windows: {
        ...clone(sampleFeatureInputs.volatileTe.windows),
        trailing3: {
          ...clone(sampleFeatureInputs.volatileTe.windows.trailing3),
          windowEnd: '2026-10-18T00:00:00.000Z',
        },
        trailing5: {
          ...clone(sampleFeatureInputs.volatileTe.windows.trailing5),
          windowEnd: '2026-10-18T00:00:00.000Z',
        },
        seasonToDate: {
          ...clone(sampleFeatureInputs.volatileTe.windows.seasonToDate),
          windowEnd: '2026-10-18T00:00:00.000Z',
        },
      },
      priorGames: clone(sampleFeatureInputs.volatileTe.priorGames).concat({
        week: 6,
        playedAt: '2026-10-10T00:00:00.000Z',
        team: 'IND',
        opponent: 'TEN',
        routes: 30,
        targets: 7,
        receptions: 5,
        receivingYards: 58,
        touchdowns: 1,
        fantasyPoints: 16.8,
      }, {
        week: 7,
        playedAt: '2026-10-18T00:00:00.000Z',
        team: 'IND',
        opponent: 'HOU',
        routes: 32,
        targets: 9,
        receptions: 6,
        receivingYards: 74,
        touchdowns: 1,
        fantasyPoints: 19.4,
      }),
    },
    actual: {
      season: 2026,
      week: 8,
      playedAt: '2026-10-25T17:00:00.000Z',
      receptions: 3,
      receivingYards: 31,
      touchdowns: 0,
      fantasyPointsPpr: 6.1,
    },
  },
];
