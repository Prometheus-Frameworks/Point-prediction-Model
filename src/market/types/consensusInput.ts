export interface ConsensusInput {
  rowId: string;
  playerId: string;
  playerName: string;
  source: string;
  consensusPoints: number;
  consensusRank?: number;
  timestamp?: string;
}
