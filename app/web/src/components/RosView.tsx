import type { DecisionBoardPlayer } from '../types';
import { RankingsTable } from './RankingsTable';

interface RosViewProps {
  players: DecisionBoardPlayer[];
  selectedPlayerId?: string;
  onSelect: (player: DecisionBoardPlayer) => void;
}

export function RosView({ players, selectedPlayerId, onSelect }: RosViewProps) {
  const rosPlayers = [...players].sort((a, b) => (b.trustworthinessScore + b.actionabilityScore) - (a.trustworthinessScore + a.actionabilityScore));

  return (
    <section className="view-stack">
      <section className="board-summary">
        <span>TIBER ROS Priority Board</span>
        <span>Sorted by trustworthiness and actionability scores.</span>
      </section>
      <RankingsTable players={rosPlayers} selectedPlayerId={selectedPlayerId} onSelect={onSelect} />
    </section>
  );
}
