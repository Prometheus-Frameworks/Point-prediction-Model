import type { MarketEdgeOutput, MarketEdgeFlag, MarketProjectionInput } from '../types/edgeOutput.js';

export const buildEdgeFlags = (
  edge: Pick<MarketEdgeOutput, 'edgeDirection' | 'rawDelta' | 'rawEdgeScore' | 'trustAdjustedEdgeScore' | 'trustAdjustment'>,
  projection?: MarketProjectionInput,
): MarketEdgeFlag[] => {
  const flags = new Set<MarketEdgeFlag>();

  if (edge.edgeDirection === 'above_market' && edge.trustAdjustedEdgeScore >= 35 && edge.rawDelta >= 2.5) {
    flags.add('EDGE_ABOVE_MARKET_STRONG');
  }

  if (edge.edgeDirection === 'below_market' && edge.trustAdjustedEdgeScore >= 35 && edge.rawDelta <= -2.5) {
    flags.add('EDGE_BELOW_MARKET_STRONG');
  }

  if (
    edge.rawEdgeScore >= 25
    && (edge.trustAdjustedEdgeScore <= edge.rawEdgeScore - 10 || edge.trustAdjustment.totalPenalty >= 0.25)
    && (edge.trustAdjustment.intervalWidthPenalty >= 0.1
      || edge.trustAdjustment.fragilityPenalty >= 0.1
      || edge.trustAdjustment.eventUncertaintyPenalty >= 0.08)
  ) {
    flags.add('EDGE_WEAK_HIGH_UNCERTAINTY');
  }

  if (projection?.row && (
    projection.row.usage_targets_pg_trailing5 >= 7
    || projection.row.usage_target_share_trailing5 >= 0.24
    || projection.row.usage_routes_pg_trailing5 >= 32
    || (projection.diagnostics?.regressionUpScore ?? 0) >= 35
    || (projection.diagnostics?.stickinessScore ?? 0) >= 60
  )) {
    flags.add('EDGE_SUPPORTED_BY_USAGE');
  }

  if ((projection?.diagnostics?.regressionDownScore ?? 0) >= 40
    || projection?.diagnostics?.flags.includes('EFFICIENCY_AHEAD_OF_ROLE')
    || projection?.diagnostics?.flags.includes('LOW_VOLUME_OVERPRODUCTION')) {
    flags.add('EDGE_UNSUPPORTED_FRAGILE_EFFICIENCY');
  }

  if (projection?.row?.event_type !== undefined && projection.row.event_type !== 'NONE'
    && (edge.trustAdjustment.eventUncertaintyPenalty >= 0.08
      || projection.diagnostics?.flags.includes('PROJECTION_FRAGILE_EVENT_DRIVEN')))
  {
    flags.add('EDGE_EVENT_DRIVEN_CAUTION');
  }

  return [...flags];
};
