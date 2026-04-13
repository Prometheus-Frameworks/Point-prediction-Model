import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { CompareView } from './components/CompareView';
import { OverviewView } from './components/OverviewView';
import { PlayerCardView } from './components/PlayerCardView';
import { RankingsView } from './components/RankingsView';
import { RosView } from './components/RosView';
import { ViewTabs } from './components/ViewTabs';
import { useDecisionBoard } from './hooks/useDecisionBoard';
import type { AppView, DecisionBoardFilters, DecisionBoardPlayer, SortKey } from './types';
import { filterPlayers, isStrongEdge, sortPlayers } from './utils';

const defaultFilters: DecisionBoardFilters = {
  position: 'ALL',
  actionTier: 'ALL',
  direction: 'ALL',
  eventDrivenOnly: false,
  strongEdgeOnly: false,
};

function App() {
  const [activeView, setActiveView] = useState<AppView>('overview');
  const [filters, setFilters] = useState<DecisionBoardFilters>(defaultFilters);
  const [sortKey, setSortKey] = useState<SortKey>('actionability');
  const { data, errorMessage, isEmpty, isLoading, sourceLabel } = useDecisionBoard();
  const [selectedPlayer, setSelectedPlayer] = useState<DecisionBoardPlayer | undefined>(undefined);

  useEffect(() => {
    setSelectedPlayer((current) => {
      if (data.length === 0) return undefined;
      return data.find((player) => player.id === current?.id) ?? data[0];
    });
  }, [data]);

  const visiblePlayers = useMemo(() => sortPlayers(filterPlayers(data, filters), sortKey), [data, filters, sortKey]);

  const boardStats = useMemo(() => {
    if (data.length === 0) return { strongEdges: 0, eventDriven: 0, avgProjection: 0 };

    const strongEdges = data.filter(isStrongEdge).length;
    const eventDriven = data.filter((player) => player.eventDriven).length;
    const avgProjection = data.reduce((sum, player) => sum + player.fusedProjection, 0) / data.length;
    return { strongEdges, eventDriven, avgProjection };
  }, [data]);

  const body = useMemo(() => {
    if (isLoading) {
      return <section className="status-panel"><h2>Loading TIBER Fantasy Points…</h2><p>Fetching the latest scoring board from the decision API.</p></section>;
    }

    if (isEmpty) {
      return <section className="status-panel"><h2>No players returned</h2><p>The data source responded successfully but did not include player rows.</p></section>;
    }

    switch (activeView) {
      case 'overview':
        return (
          <OverviewView
            totalPlayers={data.length}
            strongEdges={boardStats.strongEdges}
            eventDriven={boardStats.eventDriven}
            avgProjection={boardStats.avgProjection}
            onJump={setActiveView}
          />
        );
      case 'player-card':
        return (
          <PlayerCardView
            players={data}
            selectedPlayer={selectedPlayer}
            onSelectPlayer={(playerId) => setSelectedPlayer(data.find((player) => player.id === playerId))}
          />
        );
      case 'rankings':
        return (
          <RankingsView
            players={visiblePlayers}
            selectedPlayer={selectedPlayer}
            filters={filters}
            sortKey={sortKey}
            onSelect={setSelectedPlayer}
            onFiltersChange={setFilters}
            onSortChange={setSortKey}
          />
        );
      case 'compare':
        return <CompareView players={data} />;
      case 'ros':
        return <RosView players={data} selectedPlayerId={selectedPlayer?.id} onSelect={setSelectedPlayer} />;
      default:
        return null;
    }
  }, [activeView, boardStats.avgProjection, boardStats.eventDriven, boardStats.strongEdges, data, filters, isEmpty, isLoading, selectedPlayer, sortKey, visiblePlayers]);

  return (
    <div className="app-shell">
      <AppHeader sourceLabel={sourceLabel} isLoading={isLoading} errorMessage={errorMessage} />
      <ViewTabs value={activeView} onChange={setActiveView} />
      {body}
    </div>
  );
}

export default App;
