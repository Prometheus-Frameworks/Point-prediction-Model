import type { ActionTier } from '../types/actionTier.js';
import type { DecisionBoardRow, DecisionTag } from '../types/decisionBoardRow.js';

export const buildDecisionTags = (row: Omit<DecisionBoardRow, 'decisionTags' | 'decisionReasons'>): DecisionTag[] => {
  const tags = new Set<DecisionTag>();
  const marketEdgeScore = row.marketEdgeScore;
  const wideInterval = row.intervalWidth90 >= 12;

  if (row.direction === 'UPSIDE' && row.trustworthinessScore >= 70 && row.actionabilityScore >= 60) {
    tags.add('HIGH_CONFIDENCE_UPSIDE');
  }

  if (
    row.direction === 'UPSIDE'
    && marketEdgeScore >= 18
    && row.regressionUpScore >= 22
    && row.stickinessScore >= 55
  ) {
    tags.add('USAGE_BACKED_EDGE');
  }

  if (
    row.direction === 'UPSIDE'
    && row.eventType !== 'NONE'
    && (row.trustworthinessScore < 60 || row.fragilityScore >= 45 || wideInterval)
  ) {
    tags.add('EVENT_BOOST_WITH_CAUTION');
  }

  if (
    row.fragilityScore >= 55
    || row.regressionDownScore >= 35
    || row.diagnostics.flags.includes('EFFICIENCY_AHEAD_OF_ROLE')
  ) {
    tags.add('FRAGILE_EFFICIENCY_RISK');
  }

  if (Math.abs(marketEdgeScore) >= 20) {
    tags.add('MARKET_DISAGREEMENT_STRONG');
  }

  if (wideInterval) {
    tags.add('WIDE_INTERVAL_LIMITATION');
  }

  if (row.stickinessScore >= 60 && row.fragilityScore < 35) {
    tags.add('STICKY_ROLE_SUPPORT');
  }

  if (row.actionTier === 'PASS' || (row.actionTier === 'CAUTION' && row.actionabilityScore < 35)) {
    tags.add('LOW_ACTIONABILITY_NOISE');
  }

  return [...tags];
};

export const hasActionTier = (tier: ActionTier, tiers: readonly ActionTier[]): boolean => tiers.includes(tier);
