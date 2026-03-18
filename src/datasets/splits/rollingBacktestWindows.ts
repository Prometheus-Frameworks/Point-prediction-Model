import type { WrTeLabeledRow } from '../types/labeledRow.js';
import type { RollingBacktestConfig, RollingBacktestWindow, SeasonWeek } from '../types/split.js';

const compareSeasonWeek = (left: SeasonWeek, right: SeasonWeek) => {
  if (left.season !== right.season) {
    return left.season - right.season;
  }

  return left.week - right.week;
};

const toKey = (row: WrTeLabeledRow): SeasonWeek => ({ season: row.season, week: row.week });
const seasonWeekLabel = (value: SeasonWeek) => `${value.season}-W${String(value.week).padStart(2, '0')}`;

export const rollingBacktestWindows = (
  rows: WrTeLabeledRow[],
  config: RollingBacktestConfig,
): RollingBacktestWindow[] => {
  const stepWeeks = config.stepWeeks ?? config.testWeeks;
  const gapWeeks = config.gapWeeks ?? 0;
  const minTrainRows = config.minTrainRows ?? 1;

  if (config.trainWeeks <= 0 || config.testWeeks <= 0 || stepWeeks <= 0) {
    throw new Error('Rolling backtest windows require positive trainWeeks, testWeeks, and stepWeeks values.');
  }

  const sortedRows = [...rows].sort((left, right) => compareSeasonWeek(toKey(left), toKey(right)));
  const uniqueKeys = sortedRows.reduce<SeasonWeek[]>((acc, row) => {
    const key = toKey(row);
    const last = acc.at(-1);
    if (!last || compareSeasonWeek(last, key) !== 0) {
      acc.push(key);
    }
    return acc;
  }, []);

  const windows: RollingBacktestWindow[] = [];

  for (
    let trainStartIndex = 0;
    trainStartIndex + config.trainWeeks + gapWeeks + config.testWeeks <= uniqueKeys.length;
    trainStartIndex += stepWeeks
  ) {
    const trainEndIndex = trainStartIndex + config.trainWeeks - 1;
    const testStartIndex = trainEndIndex + 1 + gapWeeks;
    const testEndIndex = testStartIndex + config.testWeeks - 1;

    const trainWindow = {
      start: uniqueKeys[trainStartIndex],
      end: uniqueKeys[trainEndIndex],
    };
    const testWindow = {
      start: uniqueKeys[testStartIndex],
      end: uniqueKeys[testEndIndex],
    };

    const train = sortedRows.filter((row) => compareSeasonWeek(toKey(row), trainWindow.start) >= 0 && compareSeasonWeek(toKey(row), trainWindow.end) <= 0);
    const test = sortedRows.filter((row) => compareSeasonWeek(toKey(row), testWindow.start) >= 0 && compareSeasonWeek(toKey(row), testWindow.end) <= 0);

    if (train.length < minTrainRows || test.length === 0) {
      continue;
    }

    windows.push({
      index: windows.length,
      trainWindow,
      testWindow,
      train,
      test,
    });
  }

  return windows;
};

export { seasonWeekLabel };
