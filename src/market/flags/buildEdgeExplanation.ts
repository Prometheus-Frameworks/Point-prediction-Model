import type { MarketEdgeOutput, MarketProjectionInput } from '../types/edgeOutput.js';

export const buildEdgeExplanation = (
  edge: Pick<MarketEdgeOutput, 'playerName' | 'modelPoints' | 'consensusPoints' | 'rawDelta' | 'rawEdgeScore' | 'trustAdjustedEdgeScore' | 'edgeDirection' | 'flags' | 'trustAdjustment'>,
  projection?: MarketProjectionInput,
): string[] => {
  const bullets: string[] = [];
  const direction = edge.edgeDirection === 'above_market'
    ? 'above market'
    : edge.edgeDirection === 'below_market'
      ? 'below market'
      : 'in line with market';

  bullets.push(
    `${edge.playerName} projects ${direction}: model ${edge.modelPoints.toFixed(1)} vs consensus ${edge.consensusPoints.toFixed(1)} (${edge.rawDelta >= 0 ? '+' : ''}${edge.rawDelta.toFixed(1)} PPR, raw edge ${edge.rawEdgeScore.toFixed(1)}).`,
  );

  if (edge.rawEdgeScore === edge.trustAdjustedEdgeScore) {
    bullets.push(`Trust adjustment left the edge intact because no material uncertainty penalties were available or triggered.`);
  } else {
    const reasons: string[] = [];
    if ((edge.trustAdjustment.intervalWidth90 ?? 0) > 0 && edge.trustAdjustment.intervalWidthPenalty > 0) {
      reasons.push(`wide 90% interval (${edge.trustAdjustment.intervalWidth90?.toFixed(1)} points)`);
    }
    if (edge.trustAdjustment.fragilityPenalty > 0) {
      reasons.push(`fragility score pressure`);
    }
    if (edge.trustAdjustment.eventUncertaintyPenalty > 0) {
      reasons.push(`event uncertainty`);
    }
    if (edge.trustAdjustment.calibrationPenalty > 0 || edge.trustAdjustment.subgroupPenalty > 0) {
      reasons.push(`limited historical support`);
    }

    bullets.push(
      `Trust-adjusted edge falls to ${edge.trustAdjustedEdgeScore.toFixed(1)} after a ${(edge.trustAdjustment.totalPenalty * 100).toFixed(0)}% penalty from ${reasons.join(', ')}.`,
    );
  }

  if (edge.flags.includes('EDGE_SUPPORTED_BY_USAGE') && projection?.row) {
    bullets.push(
      `Usage support remains solid at ${projection.row.usage_targets_pg_trailing5.toFixed(1)} targets/game and ${(projection.row.usage_target_share_trailing5 * 100).toFixed(0)}% target share over the trailing-five sample.`,
    );
  }

  if (edge.flags.includes('EDGE_UNSUPPORTED_FRAGILE_EFFICIENCY')) {
    bullets.push(`Efficiency is outpacing role support, so downstream consumers should treat the disagreement as less actionable.`);
  }

  if (edge.flags.includes('EDGE_EVENT_DRIVEN_CAUTION') && projection?.row) {
    bullets.push(
      `The signal is event-driven (${projection.row.event_type}) with only ${(projection.row.event_clarity * 100).toFixed(0)}% clarity, so market disagreement may close as context firms up.`,
    );
  }

  if (bullets.length < 3) {
    bullets.push(`Confidence multiplier: ${edge.trustAdjustment.confidenceMultiplier.toFixed(2)} with matched subgroup support [${edge.trustAdjustment.matchedSubgroups.join(', ') || 'none'}].`);
  }

  return bullets;
};
