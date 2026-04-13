import { useMemo, useState } from 'react';
import type { DecisionBoardPlayer } from '../types';
import { CompareSummaryCard } from './CompareSummaryCard';
import { PlayerReasoningSections } from './PlayerReasoningSections';
import { PlayerSpotlightCard } from './PlayerSpotlightCard';

export function CompareView({ players }: { players: DecisionBoardPlayer[] }) {
  const [leftId, setLeftId] = useState(players[0]?.id ?? '');
  const [rightId, setRightId] = useState(players[1]?.id ?? players[0]?.id ?? '');

  const left = useMemo(() => players.find((p) => p.id === leftId), [players, leftId]);
  const right = useMemo(() => players.find((p) => p.id === rightId), [players, rightId]);

  return (
    <section className="view-stack">
      <div className="compare-picker-row">
        <label className="field">
          <span>Player A</span>
          <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
            {players.map((player) => <option key={player.id} value={player.id}>{player.playerName}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Player B</span>
          <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
            {players.map((player) => <option key={player.id} value={player.id}>{player.playerName}</option>)}
          </select>
        </label>
      </div>

      <CompareSummaryCard left={left} right={right} />

      <div className="compare-grid">
        <div>
          <PlayerSpotlightCard player={left} />
          <PlayerReasoningSections player={left} />
        </div>
        <div>
          <PlayerSpotlightCard player={right} />
          <PlayerReasoningSections player={right} />
        </div>
      </div>
    </section>
  );
}
