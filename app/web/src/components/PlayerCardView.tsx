import type { DecisionBoardPlayer } from '../types';
import { PlayerReasoningSections } from './PlayerReasoningSections';
import { PlayerSpotlightCard } from './PlayerSpotlightCard';

interface PlayerCardViewProps {
  players: DecisionBoardPlayer[];
  selectedPlayer?: DecisionBoardPlayer;
  onSelectPlayer: (playerId: string) => void;
}

export function PlayerCardView({ players, selectedPlayer, onSelectPlayer }: PlayerCardViewProps) {
  return (
    <section className="view-stack">
      <label className="field field--compact">
        <span>Player</span>
        <select value={selectedPlayer?.id ?? ''} onChange={(event) => onSelectPlayer(event.target.value)}>
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.playerName} · {player.team}</option>
          ))}
        </select>
      </label>
      <PlayerSpotlightCard player={selectedPlayer} />
      <PlayerReasoningSections player={selectedPlayer} />
    </section>
  );
}
