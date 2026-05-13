import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  validateProjectionInputCoverageArtifact,
  validateProjectionRunManifest,
  validateReplacementBaselinesArtifact,
  validateRosPlayerProjectionArtifactRow,
  validateWeeklyPlayerProjectionArtifactRow,
  type ProjectionArtifactType,
  type ProjectionInputCoverageArtifact,
  type ProjectionRunManifestArtifact,
  type ReplacementBaselinesArtifact,
  type RosPlayerProjectionArtifactRow,
  type WeeklyPlayerProjectionArtifactRow,
} from '../contracts/projectionArtifacts.js';
import { serviceFailure, serviceSuccess, type ServiceError, type ServiceResult } from '../services/result.js';

export interface WriteProjectionArtifactsInput {
  output_dir: string;
  manifest: ProjectionRunManifestArtifact;
  weekly_player_projections?: WeeklyPlayerProjectionArtifactRow[];
  ros_player_projections?: RosPlayerProjectionArtifactRow[];
  replacement_baselines?: ReplacementBaselinesArtifact;
  projection_input_coverage?: ProjectionInputCoverageArtifact;
}

export interface WrittenProjectionArtifact {
  artifact_type: ProjectionArtifactType;
  path: string;
  row_count: number;
}

export interface WriteProjectionArtifactsOutput {
  output_dir: string;
  written_artifacts: WrittenProjectionArtifact[];
}

interface PlannedProjectionArtifactWrite {
  artifact_type: ProjectionArtifactType;
  filename: string;
  contents: string;
  row_count: number;
}

const prettyJson = (artifact: unknown): string => `${JSON.stringify(artifact, null, 2)}\n`;
const jsonl = (rows: readonly unknown[]): string => (rows.length === 0 ? '' : `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);

const withArtifactContext = (
  errors: ServiceError[],
  artifactType: ProjectionArtifactType,
  rowIndex?: number,
): ServiceError[] =>
  errors.map((error) => ({
    ...error,
    details: {
      ...(typeof error.details === 'object' && error.details !== null && !Array.isArray(error.details)
        ? error.details
        : { validation_details: error.details }),
      artifact_type: artifactType,
      ...(rowIndex === undefined ? {} : { row_index: rowIndex }),
    },
  }));

const assertValidOutputDir = (outputDir: string): ServiceError[] => {
  if (typeof outputDir !== 'string' || outputDir.trim().length === 0) {
    return [{ code: 'PROJECTION_ARTIFACT_OUTPUT_DIR_INVALID', message: 'output_dir is required.' }];
  }

  return [];
};

const validateArtifactsAndPlanWrites = (input: WriteProjectionArtifactsInput): ServiceResult<PlannedProjectionArtifactWrite[]> => {
  const errors: ServiceError[] = assertValidOutputDir(input.output_dir);
  const plannedWrites: PlannedProjectionArtifactWrite[] = [];

  const manifestValidation = validateProjectionRunManifest(input.manifest);
  if (!manifestValidation.ok) {
    errors.push(...withArtifactContext(manifestValidation.errors, 'projection_run_manifest'));
  } else {
    plannedWrites.push({
      artifact_type: 'projection_run_manifest',
      filename: 'projection-run-manifest.json',
      contents: prettyJson(manifestValidation.data),
      row_count: 1,
    });
  }

  if (input.weekly_player_projections !== undefined) {
    if (!Array.isArray(input.weekly_player_projections)) {
      errors.push({
        code: 'PROJECTION_ARTIFACT_ROWS_INVALID',
        message: 'weekly_player_projections must be an array when provided.',
        details: { artifact_type: 'weekly_player_projection' },
      });
    } else {
      const validRows: WeeklyPlayerProjectionArtifactRow[] = [];
      input.weekly_player_projections.forEach((row, rowIndex) => {
        const rowValidation = validateWeeklyPlayerProjectionArtifactRow(row);
        if (!rowValidation.ok) {
          errors.push(...withArtifactContext(rowValidation.errors, 'weekly_player_projection', rowIndex));
        } else {
          validRows.push(rowValidation.data);
        }
      });
      plannedWrites.push({
        artifact_type: 'weekly_player_projection',
        filename: 'weekly-player-projections.jsonl',
        contents: jsonl(validRows),
        row_count: validRows.length,
      });
    }
  }

  if (input.ros_player_projections !== undefined) {
    if (!Array.isArray(input.ros_player_projections)) {
      errors.push({
        code: 'PROJECTION_ARTIFACT_ROWS_INVALID',
        message: 'ros_player_projections must be an array when provided.',
        details: { artifact_type: 'ros_player_projection' },
      });
    } else {
      const validRows: RosPlayerProjectionArtifactRow[] = [];
      input.ros_player_projections.forEach((row, rowIndex) => {
        const rowValidation = validateRosPlayerProjectionArtifactRow(row);
        if (!rowValidation.ok) {
          errors.push(...withArtifactContext(rowValidation.errors, 'ros_player_projection', rowIndex));
        } else {
          validRows.push(rowValidation.data);
        }
      });
      plannedWrites.push({
        artifact_type: 'ros_player_projection',
        filename: 'ros-player-projections.jsonl',
        contents: jsonl(validRows),
        row_count: validRows.length,
      });
    }
  }

  if (input.replacement_baselines !== undefined) {
    const baselineValidation = validateReplacementBaselinesArtifact(input.replacement_baselines);
    if (!baselineValidation.ok) {
      errors.push(...withArtifactContext(baselineValidation.errors, 'replacement_baselines'));
    } else {
      plannedWrites.push({
        artifact_type: 'replacement_baselines',
        filename: 'replacement-baselines.json',
        contents: prettyJson(baselineValidation.data),
        row_count: 1,
      });
    }
  }

  if (input.projection_input_coverage !== undefined) {
    const coverageValidation = validateProjectionInputCoverageArtifact(input.projection_input_coverage);
    if (!coverageValidation.ok) {
      errors.push(...withArtifactContext(coverageValidation.errors, 'projection_input_coverage'));
    } else {
      plannedWrites.push({
        artifact_type: 'projection_input_coverage',
        filename: 'projection-input-coverage.json',
        contents: prettyJson(coverageValidation.data),
        row_count: 1,
      });
    }
  }

  if (errors.length > 0) return serviceFailure(errors);

  return serviceSuccess(plannedWrites);
};

export const writeProjectionArtifacts = async (
  input: WriteProjectionArtifactsInput,
): Promise<ServiceResult<WriteProjectionArtifactsOutput>> => {
  const plannedWrites = validateArtifactsAndPlanWrites(input);
  if (!plannedWrites.ok) return plannedWrites;

  const outputDir = path.resolve(input.output_dir);

  try {
    await mkdir(outputDir, { recursive: true });

    const writtenArtifacts: WrittenProjectionArtifact[] = [];
    for (const plannedWrite of plannedWrites.data) {
      const artifactPath = path.join(outputDir, plannedWrite.filename);
      await writeFile(artifactPath, plannedWrite.contents, 'utf8');
      writtenArtifacts.push({
        artifact_type: plannedWrite.artifact_type,
        path: artifactPath,
        row_count: plannedWrite.row_count,
      });
    }

    return serviceSuccess({ output_dir: outputDir, written_artifacts: writtenArtifacts });
  } catch (error) {
    return serviceFailure({
      code: 'PROJECTION_ARTIFACT_WRITE_FAILED',
      message: 'Failed to write projection artifacts.',
      details: error instanceof Error ? { name: error.name, message: error.message } : error,
    });
  }
};
