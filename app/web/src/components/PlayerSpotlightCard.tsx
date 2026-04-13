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
      <div className="kpi-grid">
        <div>
          <span className="kpi-label">Top-line score</span>
          <strong>{formatPoints(player.fusedProjection)}</strong>
        </div>
        <div>
          <span className="kpi-label">Scenario delta</span>
          <strong>{formatSigned(player.scenarioDelta)}</strong>
        </div>
        <div>
          <span className="kpi-label">Confidence</span>
          <strong>{getTrustLabel(player.trustworthinessScore)}</strong>
        </div>
        <div>
          <span className="kpi-label">Edge score</span>
          <strong>{player.marketEdge.trustAdjustedScore}</strong>
        </div>
      </div>
      <div className="spotlight-row">
        <EdgeBadge marketEdge={player.marketEdge} />
        <span className={`direction direction--${player.direction.toLowerCase()}`}>{player.direction}</span>
      </div>
      <ProjectionIntervalBar intervals={player.intervals} projection={player.fusedProjection} />
    </section>
  );
}
