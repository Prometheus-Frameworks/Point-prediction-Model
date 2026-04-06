import type { DecisionBoardPlayer } from '../types';
import { formatPoints, formatSigned, getTrustLabel } from '../utils';
import { ActionTierPill } from './ActionTierPill';
import { DiagnosticTagList } from './DiagnosticTagList';
import { EdgeBadge } from './EdgeBadge';
import { ProjectionIntervalBar } from './ProjectionIntervalBar';

interface PlayerDetailPanelProps {
  player?: DecisionBoardPlayer;
  onClose: () => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function PlayerDetailPanel({ player, onClose }: PlayerDetailPanelProps) {
  const trustLabel = player ? getTrustLabel(player.trustworthinessScore) : '';
  const mergedFlags = player ? Array.from(new Set([...player.diagnostics.flags, ...player.marketEdge.flags])) : [];

  return (
    <aside className={`detail-panel ${player ? 'detail-panel--open' : ''}`}>
      <div className="detail-panel__header">
        <div>
          <p className="eyebrow">Tactical dossier</p>
          <h2>{player ? player.playerName : 'Select a player'}</h2>
          {player ? (
            <>
              <p className="muted">
                {player.position} · {player.team}
              </p>
              <div className="detail-panel__hero-support">
                <ActionTierPill tier={player.actionTier} />
                <span className="detail-panel__direction">{player.direction}</span>
                {player.eventDriven ? <span className="detail-panel__event">Event-driven</span> : null}
              </div>
            </>
          ) : (
            <p className="muted">Choose a row to inspect projection context, uncertainty, and market signals.</p>
          )}
        </div>
        <div className="detail-panel__hero-score">
          {player ? (
            <>
              <span className="kpi-label">Trust profile</span>
              <strong>{player.trustworthinessScore}</strong>
              <span className="muted">{trustLabel}</span>
            </>
          ) : null}
          <button type="button" className="detail-panel__close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {player ? (
        <div className="detail-panel__content">
          <section className="detail-card detail-card--highlight">
            <div className="detail-card__headline">
              <h3>Vital signs</h3>
              <EdgeBadge marketEdge={player.marketEdge} />
            </div>
            <div className="kpi-grid">
              <div>
                <span className="kpi-label">Baseline projection</span>
                <strong>{formatPoints(player.baselineProjection)}</strong>
              </div>
              <div>
                <span className="kpi-label">Fused projection</span>
                <strong>{formatPoints(player.fusedProjection)}</strong>
              </div>
              <div>
                <span className="kpi-label">Scenario delta</span>
                <strong>{formatSigned(player.scenarioDelta)}</strong>
              </div>
              <div>
                <span className="kpi-label">Actionability</span>
                <strong>{player.actionabilityScore}</strong>
              </div>
              <div>
                <span className="kpi-label">Trustworthiness</span>
                <strong>
                  {player.trustworthinessScore} · {trustLabel}
                </strong>
              </div>
              <div>
                <span className="kpi-label">Trust-adjusted edge</span>
                <strong>{player.marketEdge.trustAdjustedScore}</strong>
              </div>
              <div>
                <span className="kpi-label">Confidence multiplier</span>
                <strong>{player.marketEdge.confidenceMultiplier.toFixed(2)}</strong>
              </div>
              <div>
                <span className="kpi-label">Stickiness / fragility</span>
                <strong>
                  {player.diagnostics.stickinessScore} / {player.diagnostics.fragilityScore}
                </strong>
              </div>
              <div>
                <span className="kpi-label">Regression up</span>
                <strong>{player.diagnostics.regressionUpScore}</strong>
              </div>
              <div>
                <span className="kpi-label">Regression down</span>
                <strong>{player.diagnostics.regressionDownScore}</strong>
              </div>
            </div>
            <div className="detail-panel__trust-meter" aria-hidden="true">
              <div className="detail-panel__trust-meter-track" />
              <div className="detail-panel__trust-meter-fill" style={{ width: `${clampPercent(player.trustworthinessScore)}%` }} />
            </div>
          </section>

          <section className="detail-card">
            <h3>FORGE reasoning brief</h3>
            <div className="detail-list detail-list--two-col">
              <div>
                <span>Direction</span>
                <strong>{player.marketEdge.direction.replace('_', ' ')}</strong>
              </div>
              <div>
                <span>Raw delta vs market</span>
                <strong>{formatSigned(player.marketEdge.rawDelta)}</strong>
              </div>
            </div>
            {player.eventSummary ? <p>{player.eventSummary}</p> : <p className="muted">No event-specific note for this profile.</p>}
            <ul className="bullet-list">
              {player.diagnostics.decisionReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <ul className="bullet-list">
              {player.marketEdge.explanation.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <ul className="bullet-list">
              {player.fusionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="detail-card">
            <h3>Range and uncertainty</h3>
            <ProjectionIntervalBar intervals={player.intervals} projection={player.fusedProjection} />
            <div className="detail-list detail-list--two-col">
              <div>
                <span>50% range</span>
                <strong>
                  {player.intervals.lower50.toFixed(1)}–{player.intervals.upper50.toFixed(1)}
                </strong>
              </div>
              <div>
                <span>80% range</span>
                <strong>
                  {player.intervals.lower80.toFixed(1)}–{player.intervals.upper80.toFixed(1)}
                </strong>
              </div>
              <div>
                <span>90% range</span>
                <strong>
                  {player.intervals.lower90.toFixed(1)}–{player.intervals.upper90.toFixed(1)}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-card">
            <h3>Flags and diagnostics</h3>
            <DiagnosticTagList tags={mergedFlags} />
          </section>
        </div>
      ) : null}
    </aside>
  );
}
