import { appConfig } from '../config';

interface AppHeaderProps {
  sourceLabel: string;
  isLoading: boolean;
  errorMessage?: string;
}

export function AppHeader({ sourceLabel, isLoading, errorMessage }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Weekly scoring intelligence</p>
        <h1>TIBER Fantasy Points</h1>
        <p className="hero-copy">Projection-driven rankings, player cards, and head-to-head decisions in one scoring workspace.</p>
      </div>
      <div className="app-header__meta">
        <span className="muted">API: {appConfig.apiBaseUrl}</span>
        <span className="muted">Source: {isLoading ? 'Loading…' : sourceLabel}</span>
        {errorMessage ? <span className="status-inline status-inline--warning">Live API unavailable · Using fallback</span> : null}
      </div>
    </header>
  );
}
