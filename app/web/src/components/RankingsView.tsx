import type { DecisionBoardFilters, DecisionBoardPlayer, SortKey } from '../types';
import { FilterBar } from './FilterBar';
import { PlayerReasoningSections } from './PlayerReasoningSections';
import { PlayerSpotlightCard } from './PlayerSpotlightCard';
import { RankingsTable } from './RankingsTable';
import { SortControl } from './SortControl';

interface RankingsViewProps {
  players: DecisionBoardPlayer[];
  selectedPlayer?: DecisionBoardPlayer;
  filters: DecisionBoardFilters;
  sortKey: SortKey;
  onSelect: (player: DecisionBoardPlayer) => void;
  onFiltersChange: (filters: DecisionBoardFilters) => void;
  onSortChange: (value: SortKey) => void;
}

export function RankingsView({ players, selectedPlayer, filters, sortKey, onSelect, onFiltersChange, onSortChange }: RankingsViewProps) {
  return (
    <section className="view-split">
      <div className="view-main">
        <section className="toolbar">
          <FilterBar filters={filters} onChange={onFiltersChange} />
          <SortControl value={sortKey} onChange={onSortChange} />
        </section>

        <section className="board-summary">
          <span>{players.length} players visible</span>
          <span>Tap any player to open full scoring context.</span>
        </section>

        <RankingsTable players={players} selectedPlayerId={selectedPlayer?.id} onSelect={onSelect} />
      </div>
      <aside className="detail-panel">
        <div className="detail-panel__content">
          <PlayerSpotlightCard player={selectedPlayer} />
          <PlayerReasoningSections player={selectedPlayer} />
        </div>
      </aside>
    </section>
  );
}
