import { useMemo, useState } from 'react';
import { DecisionBoardTable } from './components/DecisionBoardTable';
import { FilterBar } from './components/FilterBar';
import { PlayerDetailPanel } from './components/PlayerDetailPanel';
import { SortControl } from './components/SortControl';
import { appConfig } from './config';
import { mockDecisionBoard } from './data/mockDecisionBoard';
import type { DecisionBoardFilters, DecisionBoardPlayer, SortKey } from './types';
import { filterPlayers, isStrongEdge, sortPlayers } from './utils';

const defaultFilters: DecisionBoardFilters = {
  position: 'ALL',
  actionTier: 'ALL',
  direction: 'ALL',
  eventDrivenOnly: false,
  strongEdgeOnly: false,
};

function App() {
  const [filters, setFilters] = useState<DecisionBoardFilters>(defaultFilters);
  const [sortKey, setSortKey] = useState<SortKey>('actionability');
  const [selectedPlayer, setSelectedPlayer] = useState<DecisionBoardPlayer | undefined>(mockDecisionBoard[0]);

  const visiblePlayers = useMemo(() => {
    const filtered = filterPlayers(mockDecisionBoard, filters);
    return sortPlayers(filtered, sortKey);
  }, [filters, sortKey]);

  const boardStats = useMemo(() => {
    const strongEdges = mockDecisionBoard.filter(isStrongEdge).length;
    const eventDriven = mockDecisionBoard.filter((player) => player.eventDriven).length;
    const avgProjection = mockDecisionBoard.reduce((sum, player) => sum + player.fusedProjection, 0) / mockDecisionBoard.length;

    return { strongEdges, eventDriven, avgProjection };
  }, []);

  return (
    <div className="app-shell">
      <main className="layout">
        <section className="board-panel">
          <header className="hero">
            <div>
              <p className="eyebrow">PR16 · Read-only frontend prototype</p>
              <h1>WR/TE Decision Board</h1>
              <p className="hero-copy">
                A polished board for fused projections, uncertainty intervals, diagnostics, and market edge signals. This pass stays
                intentionally static so the repo&apos;s existing outputs are easier to review before any full-stack integration.
              </p>
              <p className="hero-copy">Future API-backed views will read from <code>{appConfig.apiBaseUrl}</code>.</p>
            </div>
            <div className="hero-stats">
              <div className="stat-card">
                <span>Players on board</span>
                <strong>{mockDecisionBoard.length}</strong>
              </div>
              <div className="stat-card">
                <span>Strong market edges</span>
                <strong>{boardStats.strongEdges}</strong>
              </div>
              <div className="stat-card">
                <span>Event-driven cases</span>
                <strong>{boardStats.eventDriven}</strong>
              </div>
              <div className="stat-card">
                <span>Average fused projection</span>
                <strong>{boardStats.avgProjection.toFixed(1)} pts</strong>
              </div>
            </div>
          </header>

          <section className="toolbar">
            <FilterBar filters={filters} onChange={setFilters} />
            <SortControl value={sortKey} onChange={setSortKey} />
          </section>

          <section className="board-summary">
            <span>{visiblePlayers.length} players visible</span>
            <span>Static mock data seeded from the repo&apos;s projection, diagnostics, fusion, and market-edge examples.</span>
          </section>

          <DecisionBoardTable
            players={visiblePlayers}
            selectedPlayerId={selectedPlayer?.id}
            onSelect={(player) => setSelectedPlayer(player)}
          />
        </section>

        <PlayerDetailPanel player={selectedPlayer} onClose={() => setSelectedPlayer(undefined)} />
      </main>
    </div>
  );
}

export default App;
