import type { DecisionBoardPlayer } from '../types';
import { formatPoints, getIntervalSummary, getTrustLabel } from '../utils';
import { ActionTierPill } from './ActionTierPill';
import { DiagnosticTagList } from './DiagnosticTagList';
import { EdgeBadge } from './EdgeBadge';

interface RankingsTableProps {
  players: DecisionBoardPlayer[];
  selectedPlayerId?: string;
  onSelect: (player: DecisionBoardPlayer) => void;
}

export function RankingsTable({ players, selectedPlayerId, onSelect }: RankingsTableProps) {
  return (
    <div className="table-shell">
      <table className="decision-board-table rankings-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
            <th>Range</th>
            <th>Edge</th>
            <th>Signals</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isSelected = player.id === selectedPlayerId;
            return (
              <tr key={player.id} className={isSelected ? 'is-selected' : ''} onClick={() => onSelect(player)}>
                <td>
                  <div className="player-cell">
                    <button type="button" className="player-link" onClick={() => onSelect(player)}>
                      {player.playerName}
                    </button>
                    <div className="player-meta">
                      <span>{player.position}</span>
                      <span>{player.team}</span>
                      {player.eventDriven ? <span className="accent-text">Event-driven</span> : null}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <strong>{formatPoints(player.fusedProjection)}</strong>
                    <span className={player.scenarioDelta >= 0 ? 'accent-positive' : 'accent-negative'}>
                      {player.scenarioDelta >= 0 ? '+' : ''}
                      {player.scenarioDelta.toFixed(1)} baseline
                    </span>
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <span>{getIntervalSummary(player)}</span>
                    <span className="muted">Trust: {getTrustLabel(player.trustworthinessScore)}</span>
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <EdgeBadge marketEdge={player.marketEdge} />
                    <span className="muted">Score {player.marketEdge.trustAdjustedScore}</span>
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <span>Sticky {player.diagnostics.stickinessScore} · Fragile {player.diagnostics.fragilityScore}</span>
                    <DiagnosticTagList tags={player.diagnostics.flags.slice(0, 2)} />
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <ActionTierPill tier={player.actionTier} />
                    <span className={`direction direction--${player.direction.toLowerCase()}`}>{player.direction}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="rankings-mobile-list">
        {players.map((player) => (
          <button key={player.id} type="button" className={`rankings-mobile-card ${player.id === selectedPlayerId ? 'is-selected' : ''}`} onClick={() => onSelect(player)}>
            <div className="rankings-mobile-card__top">
              <strong>{player.playerName}</strong>
              <ActionTierPill tier={player.actionTier} />
            </div>
            <div className="player-meta">
              <span>{player.position}</span>
              <span>{player.team}</span>
              <span>{formatPoints(player.fusedProjection)}</span>
            </div>
            <div className="rankings-mobile-card__bottom">
              <EdgeBadge marketEdge={player.marketEdge} />
              <span className={`direction direction--${player.direction.toLowerCase()}`}>{player.direction}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
