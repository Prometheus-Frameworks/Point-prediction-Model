import type { AppView } from '../types';

interface OverviewViewProps {
  totalPlayers: number;
  strongEdges: number;
  eventDriven: number;
  avgProjection: number;
  onJump: (view: AppView) => void;
}

export function OverviewView({ totalPlayers, strongEdges, eventDriven, avgProjection, onJump }: OverviewViewProps) {
  return (
    <section className="view-stack">
      <div className="hero-stats">
        <div className="stat-card"><span>Active players</span><strong>{totalPlayers}</strong></div>
        <div className="stat-card"><span>Strong edges</span><strong>{strongEdges}</strong></div>
        <div className="stat-card"><span>Event-driven</span><strong>{eventDriven}</strong></div>
        <div className="stat-card"><span>Avg projection</span><strong>{totalPlayers > 0 ? `${avgProjection.toFixed(1)} pts` : '—'}</strong></div>
      </div>

      <div className="overview-grid">
        <button type="button" className="action-card" onClick={() => onJump('rankings')}>
          <h3>Rankings</h3>
          <p>Sort the full board by projection, trust, edge, or actionability.</p>
        </button>
        <button type="button" className="action-card" onClick={() => onJump('player-card')}>
          <h3>Player Card</h3>
          <p>Open the flagship scoring page with answer, range, and decision signals.</p>
        </button>
        <button type="button" className="action-card" onClick={() => onJump('compare')}>
          <h3>Compare</h3>
          <p>Get a direct winner call with projection, trust, and edge deltas.</p>
        </button>
        <button type="button" className="action-card" onClick={() => onJump('ros')}>
          <h3>ROS</h3>
          <p>Prioritize rest-of-season profiles by reliability and decision strength.</p>
        </button>
      </div>
    </section>
  );
}
