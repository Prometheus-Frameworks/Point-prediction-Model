import { clamp, roundTo } from '../../utils/math.js';

export const normalize = (value: number, min: number, max: number): number => {
  if (max <= min) {
    return 0;
  }

  return clamp((value - min) / (max - min), 0, 1);
};

export const blend = (...pairs: Array<[value: number, weight: number]>): number => {
  const totalWeight = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weightedSum = pairs.reduce((sum, [value, weight]) => sum + value * weight, 0);
  return weightedSum / totalWeight;
};

export const finalizeScore = (value: number): number => roundTo(clamp(value, 0, 100), 1);
