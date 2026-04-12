import { roundTo } from '../../core/scoringSystem.js';

export const calculateVorp = (expectedPoints: number, replacementPoints: number): number =>
  roundTo(expectedPoints - replacementPoints);
