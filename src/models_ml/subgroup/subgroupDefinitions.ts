import type { SubgroupFamilyDefinition } from '../types/uncertainty.js';

export const subgroupDefinitions: SubgroupFamilyDefinition[] = [
  {
    family: 'position',
    label: 'Position',
    groups: [
      { key: 'wr', label: 'WR', matches: (row) => row.player_position === 'WR' },
      { key: 'te', label: 'TE', matches: (row) => row.player_position === 'TE' },
    ],
  },
  {
    family: 'experience',
    label: 'Experience',
    groups: [
      { key: 'rookie', label: 'Rookie', matches: (row) => row.player_is_rookie >= 1 },
      { key: 'veteran', label: 'Veteran', matches: (row) => row.player_is_rookie < 1 },
    ],
  },
  {
    family: 'event',
    label: 'Event context',
    groups: [
      { key: 'event', label: 'Event', matches: (row) => row.event_type !== 'NONE' },
      { key: 'non-event', label: 'Non-event', matches: (row) => row.event_type === 'NONE' },
    ],
  },
  {
    family: 'projection-tier',
    label: 'Projection tier',
    groups: [
      { key: 'low', label: 'Low projection', matches: (row) => row.efficiency_fantasy_points_pg_trailing5 < 9 },
      { key: 'mid', label: 'Mid projection', matches: (row) => row.efficiency_fantasy_points_pg_trailing5 >= 9 && row.efficiency_fantasy_points_pg_trailing5 < 15 },
      { key: 'high', label: 'High projection', matches: (row) => row.efficiency_fantasy_points_pg_trailing5 >= 15 },
    ],
  },
  {
    family: 'sample-size',
    label: 'Sample size',
    groups: [
      { key: 'low-sample', label: 'Low sample', matches: (row) => row.player_baseline_games < 5 || row.player_sample_reliability < 0.5 },
      { key: 'high-sample', label: 'High sample', matches: (row) => row.player_baseline_games >= 5 && row.player_sample_reliability >= 0.5 },
    ],
  },
];
