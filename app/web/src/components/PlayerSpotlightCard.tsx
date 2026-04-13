import type { DecisionBoardPlayer } from '../types';
import { formatPoints, formatSigned, getTrustLabel } from '../utils';
import { ActionTierPill } from './ActionTierPill';
import { EdgeBadge } from './EdgeBadge';
import { ProjectionIntervalBar } from './ProjectionIntervalBar';

export function PlayerSpotlightCard({ player }: { player?: DecisionBoardPlayer }) {
  if (!player) {
    return (
      <section className="detail-card">
        <h3>Select a player</h3>
        <p className="muted">Choose a player to see scoring outputs, uncertainty, and explanation.</p>
      </section>
    );
  }

  return (
    <section className="detail-card detail-card--highlight">
      <div className="detail-card__headline">
        <div>
          <h3>{player.playerName}</h3>
          <p className="muted">{player.position} · {player.team}</p>
        </div>
        <ActionTierPill tier={player.actionTier} />
      </div>
      <div className="spotlight-answer-row">
        <div>
          <span className="kpi-label">TIBER projection</span>
          <strong className="spotlight-answer-score">{formatPoints(player.fusedProjection)}</strong>
          <p className={`spotlight-answer-delta ${player.scenarioDelta >= 0 ? 'accent-positive' : 'accent-negative'}`}>
            {formatSigned(player.scenarioDelta)} vs baseline
          </p>
        </div>
        <div className="spotlight-row">
          <EdgeBadge marketEdge={player.marketEdge} />
          <span className={`direction direction--${player.direction.toLowerCase()}`}>{player.direction}</span>
        </div>
      </div>
      <div className="kpi-grid">
        <div>
          <span className="kpi-label">80% range</span>
          <strong>{player.intervals.lower80.toFixed(1)}–{player.intervals.upper80.toFixed(1)} pts</strong>
        </div>
        <div>
          <span className="kpi-label">90% range</span>
          <strong>{player.intervals.lower90.toFixed(1)}–{player.intervals.upper90.toFixed(1)} pts</strong>
        </div>
        <div>
          <span className="kpi-label">Trust / confidence</span>
          <strong>{getTrustLabel(player.trustworthinessScore)} ({player.trustworthinessScore})</strong>
        </div>
        <div>
          <span className="kpi-label">Edge / actionability</span>
          <strong>{player.marketEdge.trustAdjustedScore} / {player.actionabilityScore}</strong>
        </div>
      </div>
      <ProjectionIntervalBar intervals={player.intervals} projection={player.fusedProjection} />
    </section>
  );
}
