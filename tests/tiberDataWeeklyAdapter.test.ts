import { describe, expect, it } from 'vitest';
import { TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION, type TiberDataProjectionInputBundle } from '../src/contracts/tiberDataProjectionInput.js';
import { toWeeklyScoringRequest } from '../src/adapters/tiberData/toWeeklyScoringRequest.js';

const clearlyLabeledCompleteFixture: TiberDataProjectionInputBundle = {
  input_contract_version: TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION,
  tiber_data_schema_version: 'fixture-tiber-data-schema-v1',
  source_dataset_refs: [
    { dataset_id: 'fixture-weekly-opportunity-dataset', version: 'fixture-2026-week-01', uri: 'memory://fixtures/weekly-opportunity' },
  ],
  identity_ref: {
    identity_artifact_id: 'fixture-canonical-identity-artifact',
    version: 'fixture-identity-v1',
    uri: 'memory://fixtures/identity',
  },
  league_context: {
    teams: 12,
    starters: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 },
    flex_allocation: { RB: 0.4, WR: 0.5, TE: 0.1 },
    replacement_buffer: 0.1,
  },
  player_opportunities: [
    {
      player_id: 'fixture-qb-1',
      player_name: 'Fixture Quarterback',
      team: 'BUF',
      position: 'QB',
      season: 2026,
      week: 1,
      games_sampled: 17,
      pass_attempts_pg: 34,
      pass_yards_per_attempt: 7.5,
      pass_td_rate: 0.058,
      interception_rate: 0.02,
      rush_attempts_pg: 6.2,
      rush_yards_per_attempt: 5.4,
      rush_td_rate: 0.035,
      role_stability: 0.9,
      td_dependency: 0.32,
      injury_risk: 0.18,
    },
    {
      player_id: 'fixture-wr-1',
      player_name: 'Fixture Wide Receiver',
      team: 'MIN',
      position: 'WR',
      season: 2026,
      week: 1,
      games_sampled: 15,
      route_participation: 0.89,
      routes_pg: 35,
      targets_per_route: 0.28,
      first_read_target_share: 0.31,
      air_yards_per_target: 10.8,
      end_zone_targets_pg: 0.55,
      red_zone_target_share: 0.24,
      catch_rate: 0.67,
      yards_per_target: 9.1,
      receiving_td_rate: 0.065,
      role_stability: 0.84,
      td_dependency: 0.4,
      injury_risk: 0.24,
    },
  ],
  comparison_pool: [
    {
      player_id: 'fixture-pool-rb-1',
      player_name: 'Fixture Pool Running Back',
      team: 'DET',
      position: 'RB',
      games_sampled: 16,
      carries_pg: 15.4,
      yards_per_carry: 4.5,
      targets_pg: 4.2,
      catch_rate: 0.78,
      yards_per_reception: 7.2,
    },
  ],
  replacement_points_override: { QB: 18.5, WR: 10.2 },
  adapter_warnings: [
    {
      code: 'FIXTURE_UPSTREAM_NOTE',
      message: 'Fixture warning carried through from the in-memory governed bundle.',
    },
  ],
};

const clearlyLabeledOptionalGapsFixture: TiberDataProjectionInputBundle = {
  input_contract_version: TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION,
  tiber_data_schema_version: 'fixture-tiber-data-schema-v1',
  source_dataset_refs: [{ dataset_id: 'fixture-minimal-opportunity-dataset', version: 'fixture-2026-week-01' }],
  identity_ref: { identity_artifact_id: 'fixture-canonical-identity-artifact', version: 'fixture-identity-v1' },
  league_context: {
    teams: 10,
    starters: { QB: 1, RB: 2, WR: 2, TE: 1 },
  },
  player_opportunities: [
    {
      player_id: 'fixture-minimal-te-1',
      player_name: 'Fixture Minimal Tight End',
      team: 'KC',
      position: 'TE',
      games_sampled: 6,
      routes_pg: 22,
      targets_per_route: 0.18,
    },
  ],
  missing_fields: [
    {
      field: 'catch_rate',
      severity: 'optional',
      reason: 'Fixture upstream projection intentionally omitted catch rate.',
      player_id: 'fixture-minimal-te-1',
      impact: 'Adapter omits catch_rate and reports the coverage gap.',
    },
  ],
};

describe('TIBER-Data weekly scoring adapter', () => {
  it('maps a clearly labeled complete fixture into WeeklyScoringRequest without scoring math changes', () => {
    const result = toWeeklyScoringRequest(clearlyLabeledCompleteFixture);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.request).toEqual({
      players: clearlyLabeledCompleteFixture.player_opportunities,
      league_context: clearlyLabeledCompleteFixture.league_context,
      comparison_pool: clearlyLabeledCompleteFixture.comparison_pool,
      replacement_points_override: clearlyLabeledCompleteFixture.replacement_points_override,
    });
    expect(result.data.report).toMatchObject({
      input_contract_version: TIBER_DATA_PROJECTION_INPUT_CONTRACT_VERSION,
      tiber_data_schema_version: 'fixture-tiber-data-schema-v1',
      source_dataset_refs: clearlyLabeledCompleteFixture.source_dataset_refs,
      identity_ref: clearlyLabeledCompleteFixture.identity_ref,
      player_count: 2,
      comparison_pool_count: 1,
    });
    expect(result.data.report.mapped_required_fields).toEqual(['player_id', 'player_name', 'team', 'position', 'games_sampled']);
    expect(result.warnings).toEqual(result.data.report.warnings);
    expect(result.data.report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'FIXTURE_UPSTREAM_NOTE' }),
        expect.objectContaining({ code: 'TIBER_DATA_OPTIONAL_FIELDS_MISSING' }),
      ]),
    );
  });

  it('reports missing optional fixture fields instead of synthesizing upstream values', () => {
    const result = toWeeklyScoringRequest(clearlyLabeledOptionalGapsFixture);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const player = result.data.request.players[0];
    expect(player).not.toHaveProperty('catch_rate');
    expect(player).not.toHaveProperty('receiving_td_rate');
    expect(result.data.report.missing_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'catch_rate',
          severity: 'optional',
          player_id: 'fixture-minimal-te-1',
        }),
        expect.objectContaining({
          field: 'receiving_td_rate',
          severity: 'optional',
          player_id: 'fixture-minimal-te-1',
          impact: 'Optional scoring input omitted; adapter did not synthesize a substitute value.',
        }),
      ]),
    );
    expect(result.data.report.coverage.optional_fields_missing).toBeGreaterThan(0);
    expect(result.data.report.coverage.required_fields_missing).toBe(0);
  });

  it('fails validation when a clearly labeled fixture is missing required scoring fields', () => {
    const invalidFixture = {
      ...clearlyLabeledCompleteFixture,
      player_opportunities: [
        {
          player_id: 'fixture-invalid-rb-1',
          player_name: 'Fixture Invalid Running Back',
          team: 'DET',
          position: 'RB',
        },
      ],
    } as TiberDataProjectionInputBundle;

    const result = toWeeklyScoringRequest(invalidFixture);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TIBER_DATA_REQUIRED_FIELD_INVALID',
          message: 'player_opportunities[0].games_sampled is required for WeeklyScoringRequest mapping.',
        }),
      ]),
    );
  });

  it('fails validation when a fixture declares required scoring fields unavailable', () => {
    const invalidFixture = {
      ...clearlyLabeledCompleteFixture,
      missing_fields: [
        {
          field: 'games_sampled',
          severity: 'required',
          reason: 'Fixture upstream projection intentionally declares required sample size unavailable.',
          player_id: 'fixture-qb-1',
        },
      ],
    } as TiberDataProjectionInputBundle;

    const result = toWeeklyScoringRequest(invalidFixture);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TIBER_DATA_REQUIRED_FIELD_MISSING',
          message: 'missing_fields[0] declares a required scoring field unavailable.',
        }),
      ]),
    );
  });

  it('fails validation when governed top-level provenance refs are unavailable', () => {
    const invalidFixture = {
      ...clearlyLabeledCompleteFixture,
      source_dataset_refs: [],
      identity_ref: { identity_artifact_id: '', version: '' },
    } as TiberDataProjectionInputBundle;

    const result = toWeeklyScoringRequest(invalidFixture);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'source_dataset_refs must include at least one dataset reference.' }),
        expect.objectContaining({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'identity_ref.identity_artifact_id is required.' }),
        expect.objectContaining({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'identity_ref.version is required.' }),
      ]),
    );
  });
});
