import type { DecisionBoardPlayer } from '../types';
import { comparePlayers, formatPoints, formatSigned, getTrustLabel } from '../utils';

interface CompareSummaryCardProps {
  left?: DecisionBoardPlayer;
  right?: DecisionBoardPlayer;
}

export function CompareSummaryCard({ left, right }: CompareSummaryCardProps) {
  if (!left || !right) return null;

  const summary = comparePlayers(left, right);

  return (
    <section className="detail-card detail-card--highlight compare-summary-card">
      <div className="compare-summary-card__headline">
        <p className="eyebrow">Head-to-head answer</p>
        <h3>{summary.verdict}</h3>
        <p className="muted">
          {summary.winner.playerName} projects to {formatPoints(summary.winner.fusedProjection)} versus {formatPoints(summary.loser.fusedProjection)}.
        </p>
      </div>

      <div className="compare-verdict-row">
        <span className="compare-winner-pill">Winner: {summary.winner.playerName}</span>
        <span className="muted">80% range: {summary.winnerIntervalSummary}</span>
      </div>

      <div className="compare-delta-grid">
        <div>
          <span className="kpi-label">Projection delta</span>
          <strong>{formatSigned(summary.projectionDelta)} pts</strong>
        </div>
        <div>
          <span className="kpi-label">Scenario delta gap</span>
          <strong>{formatSigned(summary.scenarioDeltaGap)}</strong>
        </div>
        <div>
          <span className="kpi-label">Trust delta</span>
          <strong>
            {formatSigned(summary.trustGap)} ({getTrustLabel(summary.winner.trustworthinessScore)})
          </strong>
        </div>
        <div>
          <span className="kpi-label">Edge score delta</span>
          <strong>{formatSigned(summary.edgeGap)}</strong>
        </div>
      </div>
    </section>
  );
}
