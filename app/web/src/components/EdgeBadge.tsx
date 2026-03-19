import type { DecisionBoardPlayer } from '../types';
import { formatSigned } from '../utils';

export function EdgeBadge({ marketEdge }: Pick<DecisionBoardPlayer, 'marketEdge'>) {
  const className = `edge-badge edge-badge--${marketEdge.direction}`;
  const label =
    marketEdge.direction === 'above_market'
      ? 'Above market'
      : marketEdge.direction === 'below_market'
        ? 'Below market'
        : 'In line';

  return (
    <div className={className}>
      <span>{label}</span>
      <strong>{formatSigned(marketEdge.rawDelta)}</strong>
    </div>
  );
}
