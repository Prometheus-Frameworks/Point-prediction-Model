export type CliCommand =
  | { mode: 'default'; exportFormat?: 'json' | 'csv' }
  | { mode: 'all'; exportFormat?: 'json' | 'csv' }
  | { mode: 'scenario'; scenarioId: string; exportFormat?: 'json' | 'csv' }
  | { mode: 'file'; filePath: string; exportFormat?: 'json' | 'csv' }
  | { mode: 'ingest'; filePath: string; exportFormat?: 'json' };

const isExportFormat = (value: string): value is 'json' | 'csv' => value === 'json' || value === 'csv';

export const parseCliArgs = (argv: string[]): CliCommand => {
  const args = [...argv];
  let exportFormat: 'json' | 'csv' | undefined;
  const exportFlagIndex = args.indexOf('--export');

  if (exportFlagIndex >= 0) {
    const requestedFormat = args[exportFlagIndex + 1];
    if (!requestedFormat || !isExportFormat(requestedFormat)) {
      throw new Error(`Invalid export format '${requestedFormat ?? ''}'. Use json or csv.`);
    }

    exportFormat = requestedFormat;
    args.splice(exportFlagIndex, 2);
  }

  if (args.length === 0) {
    return { mode: 'default', exportFormat };
  }

  if (args[0] === 'all') {
    return { mode: 'all', exportFormat };
  }

  if (args[0] === 'scenario') {
    if (!args[1]) {
      throw new Error('Missing scenario id. Usage: npm run dev -- scenario <scenario-id>');
    }

    return { mode: 'scenario', scenarioId: args[1], exportFormat };
  }

  if (args[0] === 'file') {
    if (!args[1]) {
      throw new Error('Missing file path. Usage: npm run dev -- file <path-to-json-or-csv>');
    }

    return { mode: 'file', filePath: args[1], exportFormat };
  }

  if (args[0] === 'ingest') {
    if (!args[1]) {
      throw new Error('Missing file path. Usage: npm run dev -- ingest <path-to-json-or-csv>');
    }

    if (exportFormat && exportFormat !== 'json') {
      throw new Error('Ingest mode only supports --export json.');
    }

    return { mode: 'ingest', filePath: args[1], exportFormat: exportFormat as 'json' | undefined };
  }

  return { mode: 'scenario', scenarioId: args[0], exportFormat };
};
