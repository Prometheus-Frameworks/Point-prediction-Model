import type { FragilityTag, VolatilityTag } from '../../contracts/scoring.js';
import { clamp, roundTo } from '../../core/scoringSystem.js';

export interface RangeProfile {
  floor: number;
  median: number;
  ceiling: number;
  volatility_tag: VolatilityTag;
  fragility_tag: FragilityTag;
}

export const calculateRangeProfile = (
  expectedPoints: number,
  volatilityInput = 0.5,
  fragilityInput = 0.4,
): RangeProfile => {
  const volatility = clamp(volatilityInput, 0, 1);
  const fragility = clamp(fragilityInput, 0, 1);

  const downside = 0.16 + volatility * 0.22 + fragility * 0.14;
  const upside = 0.18 + volatility * 0.35;

  const floor = roundTo(expectedPoints * (1 - downside));
  const median = roundTo(expectedPoints);
  const ceiling = roundTo(expectedPoints * (1 + upside));

  return {
    floor,
    median,
    ceiling,
    volatility_tag: volatility >= 0.7 ? 'VOLATILE' : volatility >= 0.4 ? 'MODERATE' : 'STABLE',
    fragility_tag: fragility >= 0.7 ? 'HIGH' : fragility >= 0.4 ? 'MEDIUM' : 'LOW',
  };
};
