import type { ActionTier } from '../types';

const tierClassMap: Record<ActionTier, string> = {
  'Aggressive Buy': 'tier-pill tier-pill--aggressive',
  'Lean Buy': 'tier-pill tier-pill--lean',
  Monitor: 'tier-pill tier-pill--monitor',
  Fade: 'tier-pill tier-pill--fade',
};

export function ActionTierPill({ tier }: { tier: ActionTier }) {
  return <span className={tierClassMap[tier]}>{tier}</span>;
}
