import { sampleFeatureRows } from '../../features/examples/sampleFeatureRows.js';
import type { ProjectionDiagnosticInput } from '../types/regressionSignal.js';
import { scoreRegressionCandidates } from '../../services/scoreRegressionCandidatesService.js';

const makePrediction = (input: {
  rowId: string;
  playerId: string;
  playerName: string;
  position: 'WR' | 'TE';
  predictedPpr: number;
  lower90: number;
  upper90: number;
  lower80?: number;
  upper80?: number;
  lower50?: number;
  upper50?: number;
}) => ({
  rowId: input.rowId,
  playerId: input.playerId,
  playerName: input.playerName,
  position: input.position,
  predictedPpr: input.predictedPpr,
  pointPrediction: input.predictedPpr,
  lower50: input.lower50 ?? Math.max(0, input.predictedPpr - 1.5),
  upper50: input.upper50 ?? input.predictedPpr + 1.5,
  lower80: input.lower80 ?? Math.max(0, input.predictedPpr - 3),
  upper80: input.upper80 ?? input.predictedPpr + 3,
  lower90: input.lower90,
  upper90: input.upper90,
  uncertaintyBucket: 'sample-diagnostics',
  intervalMethod: 'residual-empirical-v1' as const,
});

const stableVeteran = sampleFeatureRows.stableVeteranWr;
const fragileTe = {
  ...sampleFeatureRows.volatileTe,
  scenario_id: 'fragile-boom-bust-te',
  player_name: 'Fragile Boom-Bust TE',
  player_usage_volatility_trailing5: 0.28,
  player_sample_reliability: 0.42,
  efficiency_td_per_target_trailing5: 0.11,
  usage_targets_pg_trailing5: 5.2,
};
const underproducingHighUsage = {
  ...sampleFeatureRows.teammateInjuryBeneficiary,
  scenario_id: 'underproducing-high-usage',
  player_name: 'Underproducing High-Usage WR',
  usage_targets_pg_trailing5: 9.4,
  usage_target_share_trailing5: 0.29,
  efficiency_fantasy_points_pg_trailing5: 13.1,
  efficiency_td_per_target_trailing5: 0.03,
  player_role_growth_trailing3_vs_season: 0.09,
};
const overproducingLowUsage = {
  ...sampleFeatureRows.volatileTe,
  scenario_id: 'overproducing-low-usage',
  player_name: 'Overproducing Low-Usage TE',
  usage_targets_pg_trailing5: 4.7,
  usage_target_share_trailing5: 0.15,
  efficiency_fantasy_points_pg_trailing5: 14.6,
  efficiency_td_per_target_trailing5: 0.12,
  player_sample_reliability: 0.46,
};
const eventDrivenPlayer = {
  ...sampleFeatureRows.tradedWr,
  scenario_id: 'event-driven-high-uncertainty',
  player_name: 'Event-Driven High-Uncertainty WR',
  event_type: 'PLAYER_TRADE' as const,
  event_severity: 8,
  event_clarity: 0.63,
  event_history_count: 2,
  event_has_recent_signal: 1,
  player_recent_team_change: 1,
  player_sample_reliability: 0.38,
  player_usage_volatility_trailing5: 0.24,
};

const inputs: ProjectionDiagnosticInput[] = [
  {
    row: stableVeteran,
    prediction: makePrediction({
      rowId: stableVeteran.scenario_id,
      playerId: stableVeteran.player_id,
      playerName: stableVeteran.player_name,
      position: stableVeteran.player_position,
      predictedPpr: 17.4,
      lower90: 13.8,
      upper90: 20.8,
    }),
  },
  {
    row: fragileTe,
    prediction: makePrediction({
      rowId: fragileTe.scenario_id,
      playerId: fragileTe.player_id,
      playerName: fragileTe.player_name,
      position: fragileTe.player_position,
      predictedPpr: 11.1,
      lower90: 5.1,
      upper90: 17.9,
    }),
  },
  {
    row: underproducingHighUsage,
    prediction: makePrediction({
      rowId: underproducingHighUsage.scenario_id,
      playerId: underproducingHighUsage.player_id,
      playerName: underproducingHighUsage.player_name,
      position: underproducingHighUsage.player_position,
      predictedPpr: 15.2,
      lower90: 10,
      upper90: 20.9,
    }),
  },
  {
    row: overproducingLowUsage,
    prediction: makePrediction({
      rowId: overproducingLowUsage.scenario_id,
      playerId: overproducingLowUsage.player_id,
      playerName: overproducingLowUsage.player_name,
      position: overproducingLowUsage.player_position,
      predictedPpr: 12.7,
      lower90: 7.4,
      upper90: 18.1,
    }),
  },
  {
    row: eventDrivenPlayer,
    prediction: makePrediction({
      rowId: eventDrivenPlayer.scenario_id,
      playerId: eventDrivenPlayer.player_id,
      playerName: eventDrivenPlayer.player_name,
      position: eventDrivenPlayer.player_position,
      predictedPpr: 14.8,
      lower90: 7.8,
      upper90: 22.4,
    }),
  },
];

console.log(JSON.stringify(scoreRegressionCandidates(inputs, '2026-03-18T00:00:00.000Z'), null, 2));
