import type { DecisionBoardPlayer } from '../types';
import { formatPoints, getIntervalSummary, getTrustLabel } from '../utils';
import { ActionTierPill } from './ActionTierPill';
import { DiagnosticTagList } from './DiagnosticTagList';
import { EdgeBadge } from './EdgeBadge';

interface DecisionBoardTableProps {
  players: DecisionBoardPlayer[];
  selectedPlayerId?: string;
  onSelect: (player: DecisionBoardPlayer) => void;
}

export function DecisionBoardTable({ players, selectedPlayerId, onSelect }: DecisionBoardTableProps) {
  return (
    <div className="table-shell">
      <table className="decision-board-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Projection</th>
            <th>Interval</th>
            <th>Market edge</th>
            <th>Regression</th>
            <th>Stickiness / fragility</th>
            <th>Action tier</th>
            <th>Direction</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isSelected = player.id === selectedPlayerId;

            return (
              <tr key={player.id} className={isSelected ? 'is-selected' : undefined} onClick={() => onSelect(player)}>
                <td>
                  <div className="player-cell">
                    <button type="button" className="player-link" onClick={() => onSelect(player)}>
                      {player.playerName}
                    </button>
                    <div className="player-meta">
                      <span>{player.position}</span>
                      <span>{player.team}</span>
                      {player.eventDriven && <span className="accent-text">Event-driven</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="projection-cell">
                    <strong>{formatPoints(player.fusedProjection)}</strong>
                    <span className={player.scenarioDelta >= 0 ? 'accent-positive' : 'accent-negative'}>
                      {player.scenarioDelta >= 0 ? '+' : ''}
                      {player.scenarioDelta.toFixed(1)} vs baseline
                    </span>
                  </div>
                </td>
                <td>{getIntervalSummary(player)}</td>
                <td>
                  <div className="metric-stack">
                    <EdgeBadge marketEdge={player.marketEdge} />
                    <span className="muted">Edge score {player.marketEdge.trustAdjustedScore}</span>
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <span>Up {player.diagnostics.regressionUpScore} · Down {player.diagnostics.regressionDownScore}</span>
                    <DiagnosticTagList tags={player.diagnostics.flags.slice(0, 2)} />
                  </div>
                </td>
                <td>
                  <div className="metric-stack">
                    <span>Sticky {player.diagnostics.stickinessScore}</span>
                    <span>Fragile {player.diagnostics.fragilityScore}</span>
                    <span className="muted">Trust {getTrustLabel(player.trustworthinessScore)}</span>
                  </div>
                </td>
                <td>
                  <ActionTierPill tier={player.actionTier} />
                </td>
                <td>
                  <span className={`direction direction--${player.direction.toLowerCase()}`}>{player.direction}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
