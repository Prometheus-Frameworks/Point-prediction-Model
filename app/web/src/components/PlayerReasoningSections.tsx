import type { DecisionBoardPlayer } from '../types';
import { formatSigned } from '../utils';
import { DiagnosticTagList } from './DiagnosticTagList';

export function PlayerReasoningSections({ player }: { player?: DecisionBoardPlayer }) {
  if (!player) return null;

  const mergedFlags = Array.from(new Set([...player.diagnostics.flags, ...player.marketEdge.flags]));

  return (
    <>
      <section className="detail-card">
        <h3>Why this call</h3>
        <div className="detail-list detail-list--two-col">
          <div>
            <span>Baseline</span>
            <strong>{player.baselineProjection.toFixed(1)} pts</strong>
          </div>
          <div>
            <span>Market delta</span>
            <strong>{formatSigned(player.marketEdge.rawDelta)}</strong>
          </div>
        </div>
        {player.eventSummary ? <p>{player.eventSummary}</p> : <p className="muted">No major event signal is currently active.</p>}
        <ul className="bullet-list">
          {player.diagnostics.decisionReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="detail-card">
        <h3>Supporting signals</h3>
        <ul className="bullet-list">
          {player.marketEdge.explanation.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <ul className="bullet-list">
          {player.fusionNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="detail-card">
        <h3>Diagnostics</h3>
        <div className="detail-list detail-list--two-col">
          <div>
            <span>Regression up/down</span>
            <strong>
              {player.diagnostics.regressionUpScore} / {player.diagnostics.regressionDownScore}
            </strong>
          </div>
          <div>
            <span>Stickiness/fragility</span>
            <strong>
              {player.diagnostics.stickinessScore} / {player.diagnostics.fragilityScore}
            </strong>
          </div>
        </div>
        <DiagnosticTagList tags={mergedFlags} />
      </section>
    </>
  );
}
