import { wrTeFeatureSchema } from '../schema/wrTeFeatureSchema.js';
import type { WrTeFeatureRow } from '../types/featureRow.js';
import type { WrTeFeatureSourceInput } from '../types/sourceTypes.js';
import { validateFeatureRow } from '../validation/validateFeatureRow.js';
import { buildEfficiencyFeatures } from './buildEfficiencyFeatures.js';
import { buildEventContextFeatures } from './buildEventContextFeatures.js';
import { buildMatchupFeatures } from './buildMatchupFeatures.js';
import { buildPlayerArcFeatures } from './buildPlayerArcFeatures.js';
import { buildTeamContextFeatures } from './buildTeamContextFeatures.js';
import { buildUsageFeatures } from './buildUsageFeatures.js';

export const buildFeatureRow = (input: WrTeFeatureSourceInput): WrTeFeatureRow => {
  const row: WrTeFeatureRow = {
    feature_schema_version: wrTeFeatureSchema.version,
    scenario_id: input.scenarioId,
    season: input.projection.season,
    week: input.projection.week,
    projection_label: input.projection.projectionLabel,
    projection_timestamp: input.projection.projectionTimestamp,
    player_id: input.player.id,
    player_name: input.player.name,
    player_position: input.player.position,
    player_team: input.player.currentTeam,
    opponent_team: input.matchup.opponentTeam,
    event_type: input.event.type,
    event_timestamp: input.event.timestamp,
    ...buildUsageFeatures(input),
    ...buildEfficiencyFeatures(input),
    ...buildTeamContextFeatures(input),
    ...buildPlayerArcFeatures(input),
    ...buildMatchupFeatures(input),
    ...buildEventContextFeatures(input),
  };

  return validateFeatureRow(row, input);
};
