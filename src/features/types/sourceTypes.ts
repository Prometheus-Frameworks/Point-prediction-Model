import type { ProjectionEvent, ProjectionEventType } from '../../types/event.js';
import type { Position } from '../../types/player.js';

export interface FeatureWindowSummary {
  label: 'trailing3' | 'trailing5' | 'seasonToDate' | 'baseline';
  games: number;
  windowStart: string;
  windowEnd: string;
  routesPerGame: number;
  snapRate: number;
  targetsPerGame: number;
  targetsPerRouteRun: number;
  targetShare: number;
  airYardsShare: number;
  firstReadTargetShare: number;
  redZoneTargetShare: number;
  endZoneTargetShare: number;
  averageDepthOfTarget: number;
  catchRate: number;
  yardsPerTarget: number;
  yardsPerRouteRun: number;
  touchdownsPerTarget: number;
  explosiveTargetRate: number;
  fantasyPointsPerGame: number;
}

export interface FeaturePlayerInput {
  id: string;
  name: string;
  position: Position;
  currentTeam: string;
  listedTeam?: string;
  age: number;
  experienceYears: number;
  isRookie: boolean;
}

export interface FeatureTeamInput {
  team: string;
  impliedPoints: number;
  playVolumeIndex: number;
  passRateOverExpected: number;
  neutralPassRate: number;
  qbEfficiencyIndex: number;
  paceIndex: number;
  redZonePassRate: number;
  targetCompetitionIndex: number;
  passBlockGrade: number;
  opponentPressureRate: number;
}

export interface FeatureMatchupInput {
  opponentTeam: string;
  venue: 'HOME' | 'AWAY' | 'NEUTRAL';
  gameTotal: number;
  spread: number;
  defenseVsWrRank: number;
  defenseVsTeRank: number;
  manCoverageRate: number;
  zoneCoverageRate: number;
  pressureRate: number;
  blitzRate: number;
  explosivePassRateAllowed: number;
  redZoneTdRateAllowed: number;
  slotCoverageWeakness: number;
  linebackerCoverageWeakness: number;
}

export interface FeatureEventInput {
  type: ProjectionEventType | 'NONE';
  timestamp: string;
  effectiveWeek: number;
  severity: number;
  clarity: number;
  teammateTargetShareDelta?: number;
  depthChartDelta?: number;
  quarterbackChange?: boolean;
  notes?: string[];
}

export interface FeatureProjectionContext {
  season: number;
  week: number;
  projectionTimestamp: string;
  projectionLabel: string;
}

export interface WrTeFeatureSourceInput {
  scenarioId: string;
  player: FeaturePlayerInput;
  team: FeatureTeamInput;
  matchup: FeatureMatchupInput;
  event: FeatureEventInput;
  projection: FeatureProjectionContext;
  windows: {
    trailing3: FeatureWindowSummary;
    trailing5: FeatureWindowSummary;
    seasonToDate: FeatureWindowSummary;
    baseline: FeatureWindowSummary;
  };
  priorGames: Array<{
    week: number;
    playedAt: string;
    team: string;
    opponent: string;
    routes: number;
    targets: number;
    receptions: number;
    receivingYards: number;
    touchdowns: number;
    fantasyPoints: number;
  }>;
  eventHistory?: ProjectionEvent[];
}
