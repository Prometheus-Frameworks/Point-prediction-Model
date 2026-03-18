import { buildLabeledRow, HistoricalDatasetValidationError } from './buildLabeledRow.js';
import type { HistoricalLabeledRowInput, WrTeLabeledRow } from '../types/labeledRow.js';

const byChronology = (left: HistoricalLabeledRowInput, right: HistoricalLabeledRowInput) => {
  const leftTime = new Date(left.source.projection.projectionTimestamp).getTime();
  const rightTime = new Date(right.source.projection.projectionTimestamp).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (left.source.projection.season !== right.source.projection.season) {
    return left.source.projection.season - right.source.projection.season;
  }

  if (left.source.projection.week !== right.source.projection.week) {
    return left.source.projection.week - right.source.projection.week;
  }

  return left.source.player.id.localeCompare(right.source.player.id);
};

export const buildHistoricalDataset = (inputs: HistoricalLabeledRowInput[]): WrTeLabeledRow[] => {
  const sortedInputs = [...inputs].sort(byChronology);
  const issues: string[] = [];
  const rows: WrTeLabeledRow[] = [];
  const rowIds = new Set<string>();

  sortedInputs.forEach((input, index) => {
    try {
      const row = buildLabeledRow(input);

      if (rowIds.has(row.row_id)) {
        issues.push(`Duplicate historical row id detected at index ${index}: ${row.row_id}.`);
        return;
      }

      rowIds.add(row.row_id);
      rows.push(row);
    } catch (error) {
      if (error instanceof HistoricalDatasetValidationError) {
        for (const issue of error.issues) {
          issues.push(`historicalInput[${index}]: ${issue}`);
        }
        return;
      }

      issues.push(
        `historicalInput[${index}]: ${error instanceof Error ? error.message : 'Unknown historical dataset build error.'}`,
      );
    }
  });

  if (issues.length > 0) {
    throw new HistoricalDatasetValidationError(issues);
  }

  return rows;
};
