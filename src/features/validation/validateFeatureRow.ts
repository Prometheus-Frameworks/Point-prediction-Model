import { wrTeFeatureSchema } from '../schema/wrTeFeatureSchema.js';
import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';

export class FeatureRowValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Feature row validation failed with ${issues.length} issue(s).`);
    this.name = 'FeatureRowValidationError';
  }
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const validateTimestamps = (row: WrTeFeatureRow, source: WrTeFeatureSourceInput, issues: string[]) => {
  const projectionTime = new Date(source.projection.projectionTimestamp).getTime();
  const eventTime = new Date(source.event.timestamp).getTime();

  if (Number.isNaN(projectionTime)) {
    issues.push('Projection timestamp must be a valid ISO datetime.');
  }

  if (Number.isNaN(eventTime)) {
    issues.push('Event timestamp must be a valid ISO datetime.');
  }

  if (!Number.isNaN(projectionTime) && !Number.isNaN(eventTime) && eventTime > projectionTime) {
    issues.push('Event timestamp must precede or equal the projection timestamp.');
  }

  for (const [windowName, summary] of Object.entries(source.windows)) {
    const windowEnd = new Date(summary.windowEnd).getTime();
    const windowStart = new Date(summary.windowStart).getTime();

    if (windowStart > windowEnd) {
      issues.push(`${windowName} window start must be on or before window end.`);
    }

    if (!Number.isNaN(projectionTime) && windowEnd >= projectionTime) {
      issues.push(`${windowName} window end must be strictly before the projection timestamp to avoid leakage.`);
    }
  }

  for (const game of source.priorGames) {
    const playedAt = new Date(game.playedAt).getTime();
    if (!Number.isNaN(projectionTime) && playedAt >= projectionTime) {
      issues.push(`Prior game week ${game.week} occurs at or after projection time and would leak future information.`);
    }
  }

  if (row.week < source.event.effectiveWeek && source.event.type !== 'NONE') {
    issues.push('Feature row week cannot be earlier than the event effective week for active events.');
  }
};

const validateWindowMonotonicity = (source: WrTeFeatureSourceInput, issues: string[]) => {
  if (source.windows.trailing3.games > source.windows.trailing5.games) {
    issues.push('Trailing 3 games cannot contain more games than trailing 5 games.');
  }

  if (source.windows.trailing5.games > source.windows.seasonToDate.games) {
    issues.push('Trailing 5 games cannot contain more games than season-to-date.');
  }

  if (source.windows.seasonToDate.games > source.windows.baseline.games) {
    issues.push('Season-to-date games cannot exceed baseline games.');
  }
};

export const validateFeatureRow = (row: WrTeFeatureRow, source: WrTeFeatureSourceInput): WrTeFeatureRow => {
  const issues: string[] = [];

  if (row.feature_schema_version !== wrTeFeatureSchema.version) {
    issues.push(`Feature schema version must be ${wrTeFeatureSchema.version}.`);
  }

  validateTimestamps(row, source, issues);
  validateWindowMonotonicity(source, issues);

  for (const [key, bounds] of Object.entries(wrTeFeatureSchema.numericBounds) as Array<[
    keyof typeof wrTeFeatureSchema.numericBounds,
    { min?: number; max?: number },
  ]>) {
    const value = row[key as keyof WrTeFeatureRow];

    if (!isFiniteNumber(value)) {
      issues.push(`${String(key)} must be a finite number.`);
      continue;
    }

    if (bounds.min !== undefined && value < bounds.min) {
      issues.push(`${String(key)} must be >= ${bounds.min}. Received ${value}.`);
    }

    if (bounds.max !== undefined && value > bounds.max) {
      issues.push(`${String(key)} must be <= ${bounds.max}. Received ${value}.`);
    }
  }

  if (row.player_position !== source.player.position) {
    issues.push('Feature row player position must match the source player position.');
  }

  if (row.player_team !== source.player.currentTeam) {
    issues.push('Feature row team must match the source player current team.');
  }

  if (row.opponent_team !== source.matchup.opponentTeam) {
    issues.push('Feature row opponent team must match the matchup source.');
  }

  if (issues.length > 0) {
    throw new FeatureRowValidationError(issues);
  }

  return row;
};
