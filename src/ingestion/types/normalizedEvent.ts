import type { ProjectionEvent } from '../../types/event.js';
import type { Position } from '../../types/player.js';

export type EventQualityLabel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface NormalizedPlayerReference {
  id?: string;
  name: string;
  team: string;
  position?: Position;
}

export interface NormalizedEvent {
  id: string;
  dedupeKey: string;
  rawType: 'TRADE' | 'INJURY' | 'SIGNING' | 'ROOKIE';
  event: ProjectionEvent;
  sourceIds: string[];
  sources: string[];
  sourceCount: number;
  reportedAt: string;
  subjectPlayer: NormalizedPlayerReference;
  relatedPlayer?: NormalizedPlayerReference;
  qualityScore: number;
  qualityLabel: EventQualityLabel;
  assumptions: string[];
}
