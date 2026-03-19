import type { ProjectionIntervalSet } from '../types';

interface ProjectionIntervalBarProps {
  intervals: ProjectionIntervalSet;
  projection: number;
}

export function ProjectionIntervalBar({ intervals, projection }: ProjectionIntervalBarProps) {
  const min = Math.max(0, Math.floor(intervals.lower90 - 1));
  const max = Math.ceil(intervals.upper90 + 1);
  const range = max - min || 1;

  const toPercent = (value: number) => `${((value - min) / range) * 100}%`;

  return (
    <div className="interval-bar">
      <div className="interval-bar__track" />
      <div
        className="interval-bar__band interval-bar__band--90"
        style={{ left: toPercent(intervals.lower90), width: `calc(${toPercent(intervals.upper90)} - ${toPercent(intervals.lower90)})` }}
      />
      <div
        className="interval-bar__band interval-bar__band--80"
        style={{ left: toPercent(intervals.lower80), width: `calc(${toPercent(intervals.upper80)} - ${toPercent(intervals.lower80)})` }}
      />
      <div
        className="interval-bar__band interval-bar__band--50"
        style={{ left: toPercent(intervals.lower50), width: `calc(${toPercent(intervals.upper50)} - ${toPercent(intervals.lower50)})` }}
      />
      <div className="interval-bar__marker" style={{ left: toPercent(projection) }} />
      <div className="interval-bar__labels">
        <span>{intervals.lower90.toFixed(1)}</span>
        <span>{projection.toFixed(1)}</span>
        <span>{intervals.upper90.toFixed(1)}</span>
      </div>
    </div>
  );
}
