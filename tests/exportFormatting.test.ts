import { describe, expect, it } from 'vitest';
import { serializeResultsToCsv } from '../src/io/exportCsv.js';
import { toExportRows } from '../src/io/exportJson.js';
import { waddleToBroncosScenario } from '../src/data/scenarios/waddleToBroncos.js';
import { runScenario } from '../src/models/scenarios/runScenario.js';

describe('export formatting', () => {
  it('maps scenario results into structured export rows', () => {
    const result = runScenario(waddleToBroncosScenario);
    const rows = toExportRows([result]);

    expect(rows[0]).toMatchObject({
      scenarioId: 'waddle-to-broncos',
      playerName: 'Jaylen Waddle',
      eventType: 'PLAYER_TRADE',
    });
    expect(rows[0].adjustedPointsPerGame).toBeTypeOf('number');
  });

  it('serializes export rows to CSV with headers', () => {
    const result = runScenario(waddleToBroncosScenario);
    const csv = serializeResultsToCsv([result]);

    expect(csv).toContain('scenarioId,scenarioTitle,playerId');
    expect(csv).toContain('waddle-to-broncos');
    expect(csv.endsWith('\n')).toBe(true);
  });
});
