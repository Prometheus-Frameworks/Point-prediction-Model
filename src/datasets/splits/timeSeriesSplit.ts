import type { WrTeLabeledRow } from '../types/labeledRow.js';
import type { SeasonWeek, TimeSeriesSplitConfig, TimeSeriesSplitResult } from '../types/split.js';

const compareSeasonWeek = (left: SeasonWeek, right: SeasonWeek) => {
  if (left.season !== right.season) {
    return left.season - right.season;
  }

  return left.week - right.week;
};

const inWindow = (row: WrTeLabeledRow, window?: { start?: SeasonWeek; end?: SeasonWeek }) => {
  if (!window) {
    return false;
  }

  const key = { season: row.season, week: row.week };
  if (window.start && compareSeasonWeek(key, window.start) < 0) {
    return false;
  }

  if (window.end && compareSeasonWeek(key, window.end) > 0) {
    return false;
  }

  return true;
};

const assertOrdered = (config: TimeSeriesSplitConfig) => {
  const markers = [config.train.end, config.validation?.start, config.validation?.end, config.test?.start]
    .filter((marker): marker is SeasonWeek => marker !== undefined);

  for (let index = 1; index < markers.length; index += 1) {
    if (compareSeasonWeek(markers[index - 1], markers[index]) > 0) {
      throw new Error('Time-series split windows must be non-decreasing in time.');
    }
  }
};

export const timeSeriesSplit = (rows: WrTeLabeledRow[], config: TimeSeriesSplitConfig): TimeSeriesSplitResult => {
  assertOrdered(config);
  const sortedRows = [...rows].sort((left, right) => compareSeasonWeek(left, right));

  const train = sortedRows.filter((row) => inWindow(row, config.train));
  const validation = sortedRows.filter((row) => inWindow(row, config.validation));
  const test = sortedRows.filter((row) => inWindow(row, config.test));
  const assignedIds = new Set([...train, ...validation, ...test].map((row) => row.row_id));

  if (assignedIds.size !== train.length + validation.length + test.length) {
    throw new Error('Time-series split windows must not overlap.');
  }

  return {
    train,
    validation,
    test,
  };
};
