import type { DecisionBoardRow } from '../types/decisionBoardRow.js';
import { roundTo } from '../../utils/math.js';

export const buildDecisionReasons = (row: Omit<DecisionBoardRow, 'decisionTags' | 'decisionReasons'>): string[] => {
  const reasons: string[] = [];
  const intervalWidth = roundTo(row.intervalWidth90);
  const marketEdgeDirection = row.marketEdgeScore > 0 ? 'above' : row.marketEdgeScore < 0 ? 'below' : 'near';

  reasons.push(
    `${row.direction} signal: composite ${row.compositeSignalScore} with actionability ${row.actionabilityScore} and trust ${row.trustworthinessScore}.`,
  );

  if (Math.abs(row.marketEdgeScore) >= 10) {
    reasons.push(
      `Market edge is ${marketEdgeDirection} consensus by ${Math.abs(roundTo(row.marketEdgeScore))} points on the trust-adjusted scale.`,
    );
  }

  if (row.direction === 'UPSIDE' && row.regressionUpScore > row.regressionDownScore) {
    reasons.push(
      `Regression diagnostics lean up (${row.regressionUpScore} up vs ${row.regressionDownScore} down) with stickiness ${row.stickinessScore}.`,
    );
  }

  if (row.direction === 'DOWNSIDE' && row.regressionDownScore >= row.regressionUpScore) {
    reasons.push(
      `Regression diagnostics warn down (${row.regressionDownScore} down vs ${row.regressionUpScore} up) and fragility is ${row.fragilityScore}.`,
    );
  }

  if (row.eventType !== 'NONE') {
    reasons.push(
      `Event context (${row.eventType}) is baked into the fused projection of ${row.fusedPointPrediction}, with a 90% interval from ${row.intervalLower} to ${row.intervalUpper}.`,
    );
  } else {
    reasons.push(
      `No event overlay is present, so the fused projection ${row.fusedPointPrediction} mostly reflects baseline-plus-diagnostics support.`,
    );
  }

  if (intervalWidth >= 12 || row.fragilityScore >= 50) {
    reasons.push(
      `Risk controls are active because interval width is ${intervalWidth} and fragility is ${row.fragilityScore}.`,
    );
  }

  if (reasons.length < 4) {
    reasons.push(
      `Action tier ${row.actionTier} reflects the balance between signal magnitude and the deterministic confidence penalties in this aggregation layer.`,
    );
  }

  return reasons.slice(0, 5);
};
