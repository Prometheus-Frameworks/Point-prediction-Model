export type ActionTier =
  | 'ELITE_SIGNAL'
  | 'STRONG_SIGNAL'
  | 'WATCHLIST'
  | 'CAUTION'
  | 'PASS';

export const actionTierOrder: ActionTier[] = [
  'ELITE_SIGNAL',
  'STRONG_SIGNAL',
  'WATCHLIST',
  'CAUTION',
  'PASS',
];
