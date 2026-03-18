import type { WrTeLabeledRow } from './labeledRow.js';

export interface SeasonWeek {
  season: number;
  week: number;
}

export interface SplitTimeWindow {
  start?: SeasonWeek;
  end?: SeasonWeek;
}

export interface TimeSeriesSplitConfig {
  train: SplitTimeWindow;
  validation?: SplitTimeWindow;
  test?: SplitTimeWindow;
}

export interface TimeSeriesSplitResult {
  train: WrTeLabeledRow[];
  validation: WrTeLabeledRow[];
  test: WrTeLabeledRow[];
}

export interface RollingBacktestWindow {
  index: number;
  trainWindow: {
    start: SeasonWeek;
    end: SeasonWeek;
  };
  testWindow: {
    start: SeasonWeek;
    end: SeasonWeek;
  };
  train: WrTeLabeledRow[];
  test: WrTeLabeledRow[];
}

export interface RollingBacktestConfig {
  trainWeeks: number;
  testWeeks: number;
  stepWeeks?: number;
  gapWeeks?: number;
  minTrainRows?: number;
}
