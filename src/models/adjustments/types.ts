export interface AdjustmentMultipliers {
  volume: number;
  competition: number;
  qbEfficiency: number;
  passTdEnvironment: number;
}

export interface AdjustedProjectionInputs {
  routesPerGame: number;
  targetsPerRouteRun: number;
  catchRate: number;
  yardsPerTarget: number;
  tdPerTarget: number;
  rushPointsPerGame?: number;
  multipliers: AdjustmentMultipliers;
  explanation: string[];
  materiallyChangedVariables: string[];
}
