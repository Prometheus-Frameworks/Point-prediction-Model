export const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export const quantile = (values: number[], percentile: number): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const boundedPercentile = clamp(percentile, 0, 1);
  const index = (sorted.length - 1) * boundedPercentile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const lowerValue = sorted[lowerIndex] ?? sorted[sorted.length - 1] ?? 0;
  const upperValue = sorted[upperIndex] ?? lowerValue;

  if (lowerIndex === upperIndex) {
    return lowerValue;
  }

  return lowerValue + (upperValue - lowerValue) * (index - lowerIndex);
};

export const rootMeanSquare = (values: number[]): number =>
  values.length === 0 ? 0 : Math.sqrt(average(values.map((value) => value ** 2)));
