import type { Position } from '../../types/player.js';

export type RawEventType = 'TRADE' | 'INJURY' | 'SIGNING' | 'ROOKIE';
export type RawEventCertainty = 'CONFIRMED' | 'LIKELY' | 'SPECULATIVE';

export interface RawEvent {
  id: string;
  source: string;
  sourceEventId?: string;
  eventType: RawEventType;
  headline: string;
  summary?: string;
  reportedAt: string;
  effectiveWeek?: number;
  certainty?: RawEventCertainty;
  subjectPlayerName: string;
  subjectPlayerId?: string;
  subjectTeam: string;
  subjectPosition?: Position;
  relatedPlayerName?: string;
  relatedPlayerId?: string;
  relatedTeam?: string;
  fromTeam?: string;
  toTeam?: string;
  severity?: number;
  notes?: string;
}
