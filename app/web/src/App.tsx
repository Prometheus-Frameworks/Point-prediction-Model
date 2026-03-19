import { useEffect, useMemo, useState } from 'react';
import { DecisionBoardTable } from './components/DecisionBoardTable';
import { FilterBar } from './components/FilterBar';
import { PlayerDetailPanel } from './components/PlayerDetailPanel';
import { SortControl } from './components/SortControl';
import { appConfig } from './config';
import { useDecisionBoard } from './hooks/useDecisionBoard';
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
  const { data, errorMessage, isEmpty, isLoading, sourceLabel, usingFallback } = useDecisionBoard();
  const [selectedPlayer, setSelectedPlayer] = useState<DecisionBoardPlayer | undefined>(undefined);

  useEffect(() => {
    setSelectedPlayer((current) => {
      if (data.length === 0) {
        return undefined;
      }

      return data.find((player) => player.id === current?.id) ?? data[0];
    });
  }, [data]);

  const visiblePlayers = useMemo(() => {
    const filtered = filterPlayers(data, filters);
    return sortPlayers(filtered, sortKey);
  }, [data, filters, sortKey]);

  const boardStats = useMemo(() => {
    if (data.length === 0) {
      return { strongEdges: 0, eventDriven: 0, avgProjection: 0 };
    }

    const strongEdges = data.filter(isStrongEdge).length;
    const eventDriven = data.filter((player) => player.eventDriven).length;
    const avgProjection = data.reduce((sum, player) => sum + player.fusedProjection, 0) / data.length;

    return { strongEdges, eventDriven, avgProjection };
  }, [data]);

  return (
    <div className="app-shell">
      <main className="layout">
        <section className="board-panel">
          <header className="hero">
            <div>
              <p className="eyebrow">PR19 · Live API-backed frontend polish</p>
              <h1>WR/TE Decision Board</h1>
              <p className="hero-copy">
                A polished board for fused projections, uncertainty intervals, diagnostics, and market edge signals. The primary
                experience now loads from the live decision-board API, while preserving a clean mock fallback for local UI work.
              </p>
              <p className="hero-copy">
                API base URL: <code>{appConfig.apiBaseUrl}</code>
              </p>
              <p className="hero-copy muted">Data source: {sourceLabel}</p>
            </div>
            <div className="hero-stats">
              <div className="stat-card">
                <span>Players on board</span>
                <strong>{data.length}</strong>
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
                <strong>{data.length > 0 ? `${boardStats.avgProjection.toFixed(1)} pts` : '—'}</strong>
              </div>
            </div>
          </header>

          {isLoading ? (
            <section className="status-panel" aria-live="polite">
              <h2>Loading decision board…</h2>
              <p>Fetching the live API response from <code>{appConfig.apiBaseUrl}/api/decision-board/mock</code>.</p>
            </section>
          ) : null}

          {!isLoading && errorMessage ? (
            <section className="status-panel status-panel--warning" aria-live="polite">
              <h2>Live API unavailable</h2>
              <p>{errorMessage}</p>
            </section>
          ) : null}

          {!isLoading && isEmpty ? (
            <section className="status-panel" aria-live="polite">
              <h2>No decision-board rows returned</h2>
              <p>
                The API request succeeded, but it did not include any player rows. Confirm the backend is serving
                <code> /api/decision-board/mock </code>
                and try again.
              </p>
            </section>
          ) : null}

          {!isEmpty ? (
            <>
              <section className="toolbar">
                <FilterBar filters={filters} onChange={setFilters} />
                <SortControl value={sortKey} onChange={setSortKey} />
              </section>

              <section className="board-summary">
                <span>{visiblePlayers.length} players visible</span>
                <span>
                  {usingFallback
                    ? 'Rendering local mock data so the UI stays usable while the API is unavailable.'
                    : 'Rendering live API data from the backend decision-board endpoint.'}
                </span>
              </section>

              {visiblePlayers.length > 0 ? (
                <DecisionBoardTable
                  players={visiblePlayers}
                  selectedPlayerId={selectedPlayer?.id}
                  onSelect={(player) => setSelectedPlayer(player)}
                />
              ) : (
                <section className="status-panel">
                  <h2>No players match the current filters</h2>
                  <p>Clear one or more filters to see more decision-board rows.</p>
                </section>
              )}
            </>
          ) : null}
        </section>

        <PlayerDetailPanel player={selectedPlayer} onClose={() => setSelectedPlayer(undefined)} />
      </main>
    </div>
  );
}

export default App;
