import { describe, expect, it } from 'vitest';
import { buildEfficiencyFeatures } from '../src/features/builders/buildEfficiencyFeatures.js';
import { buildEventContextFeatures } from '../src/features/builders/buildEventContextFeatures.js';
import { buildFeatureRow } from '../src/features/builders/buildFeatureRow.js';
import { buildMatchupFeatures } from '../src/features/builders/buildMatchupFeatures.js';
import { buildPlayerArcFeatures } from '../src/features/builders/buildPlayerArcFeatures.js';
import { buildTeamContextFeatures } from '../src/features/builders/buildTeamContextFeatures.js';
import { buildUsageFeatures } from '../src/features/builders/buildUsageFeatures.js';
import { sampleFeatureInputs } from '../src/features/examples/sampleFeatureInputs.js';
import { validateFeatureRow, FeatureRowValidationError } from '../src/features/validation/validateFeatureRow.js';
import { buildFeatureBatchService } from '../src/services/buildFeatureBatchService.js';
import { buildFeatureRowService } from '../src/services/buildFeatureRowService.js';

const veteranInput = sampleFeatureInputs.stableVeteranWr;

describe('feature builders', () => {
  it('builds usage features from rolling windows', () => {
    const usage = buildUsageFeatures(veteranInput);

    expect(usage.usage_routes_pg_trailing3).toBe(37);
    expect(usage.usage_target_share_trailing3).toBe(0.29);
    expect(usage.usage_route_stability_delta).toBe(1);
  });

  it('builds efficiency features from trailing and baseline windows', () => {
    const efficiency = buildEfficiencyFeatures(sampleFeatureInputs.teammateInjuryBeneficiary);

    expect(efficiency.efficiency_fantasy_points_pg_trailing5).toBe(15.2);
    expect(efficiency.efficiency_fantasy_points_delta_vs_baseline).toBe(2.1);
  });

  it('builds team context features', () => {
    const team = buildTeamContextFeatures(veteranInput);

    expect(team.team_implied_points).toBe(23.5);
    expect(team.team_target_competition_index).toBe(42);
    expect(team.team_pressure_allowed_proxy).toBeGreaterThan(0);
  });

  it('builds player arc features including reliability and volatility', () => {
    const playerArc = buildPlayerArcFeatures(sampleFeatureInputs.rookieWr);

    expect(playerArc.player_is_rookie).toBe(1);
    expect(playerArc.player_sample_reliability).toBeLessThan(0.3);
    expect(playerArc.player_usage_volatility_trailing5).toBeGreaterThan(0);
  });

  it('builds matchup features using position-aware defensive ranks', () => {
    const wrMatchup = buildMatchupFeatures(veteranInput);
    const teMatchup = buildMatchupFeatures(sampleFeatureInputs.volatileTe);

    expect(wrMatchup.matchup_defense_rank_vs_position).toBe(19);
    expect(teMatchup.matchup_defense_rank_vs_position).toBe(27);
  });

  it('builds event context features from event timing and flags', () => {
    const eventContext = buildEventContextFeatures(sampleFeatureInputs.tradedWr);

    expect(eventContext.event_qb_change).toBe(1);
    expect(eventContext.event_history_count).toBe(1);
    expect(eventContext.event_weeks_since_event).toBeGreaterThan(2);
  });
});

describe('feature row orchestration', () => {
  it('builds a validated flattened row', () => {
    const row = buildFeatureRow(sampleFeatureInputs.teammateInjuryBeneficiary);

    expect(row.feature_schema_version).toBe('wrte-weekly-v1');
    expect(row.player_position).toBe('WR');
    expect(row.event_type).toBe('TEAMMATE_INJURY');
    expect(row.event_teammate_target_share_delta).toBe(0.08);
  });

  it('fails validation when future information leaks into the row', () => {
    const leakyInput = {
      ...veteranInput,
      event: {
        ...veteranInput.event,
        type: 'PLAYER_SIGNING' as const,
        timestamp: '2026-10-12T12:00:00.000Z',
        severity: 4,
        clarity: 0.8,
      },
    };

    expect(() => buildFeatureRow(leakyInput)).toThrow(FeatureRowValidationError);
  });

  it('validates an already built row against its source', () => {
    const row = buildFeatureRow(veteranInput);
    expect(validateFeatureRow(row, veteranInput)).toEqual(row);
  });
});

describe('feature services', () => {
  it('returns a service success for a single row', () => {
    const result = buildFeatureRowService(sampleFeatureInputs.volatileTe);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.row.player_position).toBe('TE');
    }
  });

  it('returns a service success for a batch', () => {
    const result = buildFeatureBatchService(Object.values(sampleFeatureInputs));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rows).toHaveLength(5);
    }
  });

  it('returns a service failure for invalid input', () => {
    const result = buildFeatureRowService({
      ...sampleFeatureInputs.stableVeteranWr,
      windows: {
        ...sampleFeatureInputs.stableVeteranWr.windows,
        trailing3: {
          ...sampleFeatureInputs.stableVeteranWr.windows.trailing3,
          windowEnd: '2026-10-10T12:00:00.000Z',
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe('FEATURE_ROW_VALIDATION_FAILED');
    }
  });
});
