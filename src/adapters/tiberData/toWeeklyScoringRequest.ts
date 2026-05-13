import type { PlayerOpportunityInput, WeeklyScoringRequest } from '../../contracts/scoring.js';
import {
  tiberDataOptionalPlayerOpportunityFields,
  tiberDataRequiredPlayerOpportunityFields,
  tiberDataScoringPositions,
  type TiberDataProjectionCoverageReport,
  type TiberDataProjectionInputBundle,
  type TiberDataProjectionMissingField,
  type TiberDataWeeklyScoringAdapterOutput,
} from '../../contracts/tiberDataProjectionInput.js';
import {
  getTiberDataOptionalFieldsForPosition,
  isTiberDataOptionalFieldRelevantForPosition,
} from '../../contracts/positionFieldExpectations.js';
import { serviceFailure, serviceSuccess, type ServiceError, type ServiceResult, type ServiceWarning } from '../../services/result.js';

type PlayerField = keyof PlayerOpportunityInput;

const hasOwn = (value: object, field: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, field);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const playerLabel = (player: unknown, index: number): string => {
  if (isRecord(player) && isNonEmptyString(player.player_id)) return player.player_id;
  return `index:${index}`;
};

const requiredPlayerFieldIsValid = (player: Record<string, unknown>, field: PlayerField): boolean => {
  const value = player[field];

  if (field === 'games_sampled') return isNumber(value);
  if (field === 'position') return typeof value === 'string' && (tiberDataScoringPositions as readonly string[]).includes(value);
  return isNonEmptyString(value);
};

const validateLeagueContext = (bundle: Record<string, unknown>, errors: ServiceError[]): void => {
  if (!isRecord(bundle.league_context)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'league_context is required.' });
    return;
  }

  const leagueContext = bundle.league_context;
  if (!isNumber(leagueContext.teams)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_INVALID', message: 'league_context.teams must be a finite number.' });
  }

  if (!isRecord(leagueContext.starters)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'league_context.starters is required.' });
    return;
  }

  for (const position of tiberDataScoringPositions) {
    if (!isNumber(leagueContext.starters[position])) {
      errors.push({
        code: 'TIBER_DATA_REQUIRED_FIELD_INVALID',
        message: `league_context.starters.${position} must be a finite number.`,
      });
    }
  }
};

const validateTopLevelRefs = (bundle: Record<string, unknown>, errors: ServiceError[]): void => {
  if (!isNonEmptyString(bundle.input_contract_version)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'input_contract_version is required.' });
  }

  if (!isNonEmptyString(bundle.tiber_data_schema_version)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'tiber_data_schema_version is required.' });
  }

  if (!Array.isArray(bundle.source_dataset_refs) || bundle.source_dataset_refs.length === 0) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'source_dataset_refs must include at least one dataset reference.' });
  }

  if (!isRecord(bundle.identity_ref)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'identity_ref is required.' });
    return;
  }

  if (!isNonEmptyString(bundle.identity_ref.identity_artifact_id)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'identity_ref.identity_artifact_id is required.' });
  }

  if (!isNonEmptyString(bundle.identity_ref.version)) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'identity_ref.version is required.' });
  }
};

const validateDeclaredMissingRequiredFields = (bundle: Record<string, unknown>, errors: ServiceError[]): void => {
  if (!Array.isArray(bundle.missing_fields)) return;

  bundle.missing_fields.forEach((missingField, index) => {
    if (!isRecord(missingField)) return;
    if (missingField.severity !== 'required') return;

    errors.push({
      code: 'TIBER_DATA_REQUIRED_FIELD_MISSING',
      message: `missing_fields[${index}] declares a required scoring field unavailable.`,
      details: {
        field: missingField.field,
        player_id: missingField.player_id,
        reason: missingField.reason,
      },
    });
  });
};

const validatePlayers = (players: unknown, path: 'player_opportunities' | 'comparison_pool', errors: ServiceError[]): void => {
  if (!Array.isArray(players)) {
    if (path === 'player_opportunities') {
      errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'player_opportunities is required.' });
    }
    return;
  }

  if (path === 'player_opportunities' && players.length === 0) {
    errors.push({ code: 'TIBER_DATA_REQUIRED_FIELD_MISSING', message: 'player_opportunities must include at least one player.' });
  }

  players.forEach((player, index) => {
    if (!isRecord(player)) {
      errors.push({
        code: 'TIBER_DATA_PLAYER_INVALID',
        message: `${path}[${index}] must be an object.`,
      });
      return;
    }

    for (const field of tiberDataRequiredPlayerOpportunityFields) {
      if (!requiredPlayerFieldIsValid(player, field)) {
        errors.push({
          code: 'TIBER_DATA_REQUIRED_FIELD_INVALID',
          message: `${path}[${index}].${field} is required for WeeklyScoringRequest mapping.`,
          details: { player: playerLabel(player, index), field, path },
        });
      }
    }
  });
};

const knownMissingKey = (missingField: TiberDataProjectionMissingField): string =>
  `${missingField.player_id ?? '*'}:${missingField.field}:${missingField.severity}`;

const filterPositionRelevantMissingFields = (
  players: PlayerOpportunityInput[],
  missingFields: TiberDataProjectionMissingField[],
): TiberDataProjectionMissingField[] => {
  const positionByPlayerId = new Map(players.map((player) => [player.player_id, player.position]));

  return missingFields.filter((missingField) => {
    if (missingField.severity === 'required') return true;
    if (missingField.player_id === undefined) return true;

    const position = positionByPlayerId.get(missingField.player_id);
    if (position === undefined) return true;

    return isTiberDataOptionalFieldRelevantForPosition(position, missingField.field);
  });
};

const buildImplicitMissingOptionalFields = (
  players: PlayerOpportunityInput[],
  existingMissingFields: TiberDataProjectionMissingField[],
): TiberDataProjectionMissingField[] => {
  const knownMissing = new Set(existingMissingFields.map(knownMissingKey));
  const missingFields: TiberDataProjectionMissingField[] = [];

  for (const player of players) {
    for (const field of getTiberDataOptionalFieldsForPosition(player.position)) {
      if (hasOwn(player, field)) continue;

      const missingField: TiberDataProjectionMissingField = {
        field,
        severity: 'optional',
        reason: 'Field was not supplied by the governed TIBER-Data projection bundle.',
        player_id: player.player_id,
        impact: 'Optional scoring input omitted; adapter did not synthesize a substitute value.',
      };

      if (!knownMissing.has(knownMissingKey(missingField))) missingFields.push(missingField);
    }
  }

  return missingFields;
};

const collectMappedFields = (players: PlayerOpportunityInput[]): { required: string[]; optional: string[]; optionalPresent: number } => {
  const required = new Set<string>();
  const optional = new Set<string>();
  let optionalPresent = 0;

  for (const player of players) {
    for (const field of tiberDataRequiredPlayerOpportunityFields) {
      if (hasOwn(player, field)) required.add(field);
    }

    for (const field of tiberDataOptionalPlayerOpportunityFields) {
      if (hasOwn(player, field)) {
        optional.add(field);
        optionalPresent += 1;
      }
    }
  }

  return { required: [...required], optional: [...optional], optionalPresent };
};

const buildWarnings = (
  bundle: TiberDataProjectionInputBundle,
  allMissingFields: TiberDataProjectionMissingField[],
): ServiceWarning[] => {
  const warnings = [...(bundle.adapter_warnings ?? [])];
  const optionalMissingCount = allMissingFields.filter((field) => field.severity === 'optional').length;

  if (optionalMissingCount > 0) {
    warnings.push({
      code: 'TIBER_DATA_OPTIONAL_FIELDS_MISSING',
      message: 'Optional scoring fields were unavailable and were omitted rather than synthesized.',
      details: { missing_optional_field_count: optionalMissingCount },
    });
  }

  return warnings;
};

const buildReport = (bundle: TiberDataProjectionInputBundle, request: WeeklyScoringRequest): TiberDataProjectionCoverageReport => {
  const suppliedMissingFields = filterPositionRelevantMissingFields(request.players, bundle.missing_fields ?? []);
  const implicitMissingFields = buildImplicitMissingOptionalFields(request.players, suppliedMissingFields);
  const missingFields = [...suppliedMissingFields, ...implicitMissingFields];
  const mappedFields = collectMappedFields(request.players);
  const warnings = buildWarnings(bundle, missingFields);

  return {
    input_contract_version: bundle.input_contract_version,
    tiber_data_schema_version: bundle.tiber_data_schema_version,
    source_dataset_refs: bundle.source_dataset_refs,
    identity_ref: bundle.identity_ref,
    player_count: request.players.length,
    comparison_pool_count: request.comparison_pool?.length ?? 0,
    mapped_required_fields: mappedFields.required,
    mapped_optional_fields: mappedFields.optional,
    missing_fields: missingFields,
    coverage: {
      required_fields_present: request.players.length * tiberDataRequiredPlayerOpportunityFields.length,
      required_fields_missing: missingFields.filter((field) => field.severity === 'required').length,
      optional_fields_present: mappedFields.optionalPresent,
      optional_fields_missing: missingFields.filter((field) => field.severity === 'optional').length,
    },
    warnings,
  };
};

export const toWeeklyScoringRequest = (bundle: TiberDataProjectionInputBundle): ServiceResult<TiberDataWeeklyScoringAdapterOutput> => {
  const errors: ServiceError[] = [];

  if (!isRecord(bundle)) {
    return serviceFailure({ code: 'TIBER_DATA_INPUT_INVALID', message: 'TIBER-Data projection input bundle must be an object.' });
  }

  validateTopLevelRefs(bundle, errors);
  validateLeagueContext(bundle, errors);
  validatePlayers(bundle.player_opportunities, 'player_opportunities', errors);
  validatePlayers(bundle.comparison_pool, 'comparison_pool', errors);
  validateDeclaredMissingRequiredFields(bundle, errors);

  if (errors.length > 0) return serviceFailure(errors, Array.isArray(bundle.adapter_warnings) ? bundle.adapter_warnings : []);

  const typedBundle = bundle as TiberDataProjectionInputBundle;
  const request: WeeklyScoringRequest = {
    players: typedBundle.player_opportunities,
    league_context: typedBundle.league_context,
    ...(typedBundle.comparison_pool === undefined ? {} : { comparison_pool: typedBundle.comparison_pool }),
    ...(typedBundle.replacement_points_override === undefined ? {} : { replacement_points_override: typedBundle.replacement_points_override }),
  };

  const report = buildReport(typedBundle, request);
  return serviceSuccess({ request, report }, report.warnings);
};
