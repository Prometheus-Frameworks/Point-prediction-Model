import type { CalibrationInput } from '../calibration/buildCalibrationTable.js';
import type { SubgroupFamilyDefinition } from '../types/uncertainty.js';

export interface SubgroupEvaluationInput extends CalibrationInput {}

export const subgroupDefinitions: SubgroupFamilyDefinition[] = [
  {
    family: 'position',
    label: 'Position',
    groups: [
      { key: 'wr', label: 'WR', matches: (input: SubgroupEvaluationInput) => input.row.player_position === 'WR' },
      { key: 'te', label: 'TE', matches: (input: SubgroupEvaluationInput) => input.row.player_position === 'TE' },
    ],
  },
  {
    family: 'experience',
    label: 'Experience',
    groups: [
      { key: 'rookie', label: 'Rookie', matches: (input: SubgroupEvaluationInput) => input.row.player_is_rookie >= 1 },
      { key: 'veteran', label: 'Veteran', matches: (input: SubgroupEvaluationInput) => input.row.player_is_rookie < 1 },
    ],
  },
  {
    family: 'event',
    label: 'Event context',
    groups: [
      { key: 'event', label: 'Event', matches: (input: SubgroupEvaluationInput) => input.row.event_type !== 'NONE' },
      { key: 'non-event', label: 'Non-event', matches: (input: SubgroupEvaluationInput) => input.row.event_type === 'NONE' },
    ],
  },
  {
    family: 'projection-tier',
    label: 'Projection tier',
    groups: [
      { key: 'low', label: 'Low projection', matches: (input: SubgroupEvaluationInput) => input.pointPrediction < 9 },
      { key: 'mid', label: 'Mid projection', matches: (input: SubgroupEvaluationInput) => input.pointPrediction >= 9 && input.pointPrediction < 15 },
      { key: 'high', label: 'High projection', matches: (input: SubgroupEvaluationInput) => input.pointPrediction >= 15 },
    ],
  },
  {
    family: 'sample-size',
    label: 'Sample size',
    groups: [
      {
        key: 'low-sample',
        label: 'Low sample',
        matches: (input: SubgroupEvaluationInput) => input.row.player_baseline_games < 5 || input.row.player_sample_reliability < 0.5,
      },
      {
        key: 'high-sample',
        label: 'High sample',
        matches: (input: SubgroupEvaluationInput) => input.row.player_baseline_games >= 5 && input.row.player_sample_reliability >= 0.5,
      },
    ],
  },
];
