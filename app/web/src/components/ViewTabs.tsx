import type { AppView } from '../types';

interface ViewTabsProps {
  value: AppView;
  onChange: (view: AppView) => void;
}

const tabs: AppView[] = ['overview', 'player-card', 'rankings', 'compare', 'ros'];

const labels: Record<AppView, string> = {
  overview: 'Overview',
  'player-card': 'Player Card',
  rankings: 'Rankings',
  compare: 'Compare',
  ros: 'ROS',
};

export function ViewTabs({ value, onChange }: ViewTabsProps) {
  return (
    <nav className="view-tabs" aria-label="Application views">
      {tabs.map((tab) => (
        <button key={tab} type="button" className={`view-tab ${value === tab ? 'is-active' : ''}`} onClick={() => onChange(tab)}>
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}
