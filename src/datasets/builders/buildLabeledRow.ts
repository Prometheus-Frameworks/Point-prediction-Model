import { buildFeatureRow } from '../../features/builders/buildFeatureRow.js';
import type { HistoricalLabeledRowInput, WrTeLabeledRow } from '../types/labeledRow.js';

export class HistoricalDatasetValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Historical dataset validation failed with ${issues.length} issue(s).`);
    this.name = 'HistoricalDatasetValidationError';
  }
}

const compareIso = (left: string, right: string) => new Date(left).getTime() - new Date(right).getTime();

const toRowId = (input: HistoricalLabeledRowInput) =>
  `${input.source.player.id}-${input.actual.season}-W${String(input.actual.week).padStart(2, '0')}`;

export const buildLabeledRow = (input: HistoricalLabeledRowInput): WrTeLabeledRow => {
  const featureRow = buildFeatureRow(input.source);
  const issues: string[] = [];

  if (input.actual.season !== input.source.projection.season) {
    issues.push('Actual target season must match the feature row projection season.');
  }

  if (input.actual.week !== input.source.projection.week) {
    issues.push('Actual target week must match the feature row projection week.');
  }

  if (compareIso(input.actual.playedAt, input.source.projection.projectionTimestamp) <= 0) {
    issues.push('Actual playedAt must be strictly after the projection timestamp to avoid leakage.');
  }

  for (const game of input.source.priorGames) {
    if (compareIso(game.playedAt, input.actual.playedAt) >= 0) {
      issues.push(`Prior game week ${game.week} must occur before the labeled game is played.`);
    }
  }

  for (const [windowName, window] of Object.entries(input.source.windows)) {
    if (compareIso(window.windowEnd, input.actual.playedAt) >= 0) {
      issues.push(`${windowName} window end must be before the labeled game kicks off.`);
    }
  }

  if (issues.length > 0) {
    throw new HistoricalDatasetValidationError(issues);
  }

  const rowId = toRowId(input);
  const builtAt = input.metadata?.builtAt ?? input.actual.playedAt;

  return {
    ...featureRow,
    labeled_row_version: 'wrte-weekly-labeled-v1',
    row_id: rowId,
    label_season: input.actual.season,
    label_week: input.actual.week,
    label_played_at: input.actual.playedAt,
    target_fantasy_points_ppr: input.actual.fantasyPointsPpr,
    target_receptions: input.actual.receptions,
    target_receiving_yards: input.actual.receivingYards,
    target_touchdowns: input.actual.touchdowns,
    build_metadata: {
      inputId: input.inputId,
      rowId,
      builtAt,
      trainingCutoffTimestamp: input.source.projection.projectionTimestamp,
      labelSource: 'weekly-actual-ppr',
      priorGamesUsed: input.source.priorGames.length,
      eventApplied: input.source.event.type !== 'NONE',
      leakChecksPassed: true,
    },
  };
};
