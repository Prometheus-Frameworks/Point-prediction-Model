export type Position = 'WR' | 'TE';
export type Direction = 'Up' | 'Down' | 'Neutral';
export type ActionTier = 'Aggressive Buy' | 'Lean Buy' | 'Monitor' | 'Fade';
export type SortKey = 'projection' | 'actionability' | 'trustworthiness' | 'edge';

export interface ProjectionIntervalSet {
  lower50: number;
  upper50: number;
  lower80: number;
  upper80: number;
  lower90: number;
  upper90: number;
}

export interface MarketEdgeSummary {
  direction: 'above_market' | 'below_market' | 'in_line';
  rawDelta: number;
  trustAdjustedScore: number;
  confidenceMultiplier: number;
  flags: string[];
  explanation: string[];
}

export interface DiagnosticsSummary {
  regressionUpScore: number;
  regressionDownScore: number;
  stickinessScore: number;
  fragilityScore: number;
  flags: string[];
  decisionReasons: string[];
}

export interface DecisionBoardPlayer {
  id: string;
  playerName: string;
  team: string;
  position: Position;
  baselineProjection: number;
  fusedProjection: number;
  scenarioDelta: number;
  intervals: ProjectionIntervalSet;
  marketEdge: MarketEdgeSummary;
  diagnostics: DiagnosticsSummary;
  actionTier: ActionTier;
  direction: Direction;
  eventDriven: boolean;
  eventSummary?: string;
  fusionNotes: string[];
  actionabilityScore: number;
  trustworthinessScore: number;
}

export interface DecisionBoardFilters {
  position: 'ALL' | Position;
  actionTier: 'ALL' | ActionTier;
  direction: 'ALL' | Direction;
  eventDrivenOnly: boolean;
  strongEdgeOnly: boolean;
}
