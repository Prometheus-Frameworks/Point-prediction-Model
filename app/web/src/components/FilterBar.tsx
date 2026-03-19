import type { ActionTier, DecisionBoardFilters, Direction, Position } from '../types';

interface FilterBarProps {
  filters: DecisionBoardFilters;
  onChange: (filters: DecisionBoardFilters) => void;
}

const positions: Array<'ALL' | Position> = ['ALL', 'WR', 'TE'];
const actionTiers: Array<'ALL' | ActionTier> = ['ALL', 'Aggressive Buy', 'Lean Buy', 'Monitor', 'Fade'];
const directions: Array<'ALL' | Direction> = ['ALL', 'Up', 'Down', 'Neutral'];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="field">
        <span>Position</span>
        <select value={filters.position} onChange={(event) => onChange({ ...filters, position: event.target.value as DecisionBoardFilters['position'] })}>
          {positions.map((position) => (
            <option key={position} value={position}>
              {position === 'ALL' ? 'All positions' : position}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Action tier</span>
        <select value={filters.actionTier} onChange={(event) => onChange({ ...filters, actionTier: event.target.value as DecisionBoardFilters['actionTier'] })}>
          {actionTiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier === 'ALL' ? 'All tiers' : tier}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Direction</span>
        <select value={filters.direction} onChange={(event) => onChange({ ...filters, direction: event.target.value as DecisionBoardFilters['direction'] })}>
          {directions.map((direction) => (
            <option key={direction} value={direction}>
              {direction === 'ALL' ? 'All directions' : direction}
            </option>
          ))}
        </select>
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={filters.eventDrivenOnly}
          onChange={(event) => onChange({ ...filters, eventDrivenOnly: event.target.checked })}
        />
        <span>Event-driven only</span>
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={filters.strongEdgeOnly}
          onChange={(event) => onChange({ ...filters, strongEdgeOnly: event.target.checked })}
        />
        <span>Strong edge only</span>
      </label>
    </div>
  );
}
