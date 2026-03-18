import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { roundFeature, weeksBetween } from './shared.js';

export const buildEventContextFeatures = (input: WrTeFeatureSourceInput): Pick<
  WrTeFeatureRow,
  | 'event_weeks_since_event'
  | 'event_severity'
  | 'event_clarity'
  | 'event_teammate_target_share_delta'
  | 'event_depth_chart_delta'
  | 'event_qb_change'
  | 'event_history_count'
  | 'event_has_recent_signal'
> => {
  const weeksSinceEvent = weeksBetween(input.event.timestamp, input.projection.projectionTimestamp);

  return {
    event_weeks_since_event: roundFeature(weeksSinceEvent),
    event_severity: roundFeature(input.event.severity),
    event_clarity: roundFeature(input.event.clarity),
    event_teammate_target_share_delta: roundFeature(input.event.teammateTargetShareDelta ?? 0),
    event_depth_chart_delta: roundFeature(input.event.depthChartDelta ?? 0),
    event_qb_change: input.event.quarterbackChange ? 1 : 0,
    event_history_count: roundFeature(input.eventHistory?.length ?? 0),
    event_has_recent_signal: weeksSinceEvent <= 3 ? 1 : 0,
  };
};
