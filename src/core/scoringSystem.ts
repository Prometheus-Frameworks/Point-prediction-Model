export const scoringSystem = {
  passingYardPoint: 0.04,
  passingTdPoint: 4,
  interceptionPoint: -1,
  rushingYardPoint: 0.1,
  rushingTdPoint: 6,
  receptionPoint: 1,
  receivingYardPoint: 0.1,
  receivingTdPoint: 6,
} as const;

export const roundTo = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
