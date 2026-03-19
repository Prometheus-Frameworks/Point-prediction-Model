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

export function PlayerDetailPanel({ player, onClose }: PlayerDetailPanelProps) {
  return (
    <aside className={`detail-panel ${player ? 'detail-panel--open' : ''}`}>
      <div className="detail-panel__header">
        <div>
          <p className="eyebrow">Player detail</p>
          <h2>{player ? player.playerName : 'Select a player'}</h2>
          {player ? (
            <p className="muted">
              {player.position} · {player.team}
            </p>
          ) : (
            <p className="muted">Choose a row to inspect projection context, uncertainty, and market signals.</p>
          )}
        </div>
        <button type="button" className="detail-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      {player ? (
        <div className="detail-panel__content">
          <section className="detail-card detail-card--highlight">
            <div className="detail-card__headline">
              <ActionTierPill tier={player.actionTier} />
              <EdgeBadge marketEdge={player.marketEdge} />
            </div>
            <div className="kpi-grid">
              <div>
                <span className="kpi-label">Baseline</span>
                <strong>{formatPoints(player.baselineProjection)}</strong>
              </div>
              <div>
                <span className="kpi-label">Fused</span>
                <strong>{formatPoints(player.fusedProjection)}</strong>
              </div>
              <div>
                <span className="kpi-label">Fusion delta</span>
                <strong>{formatSigned(player.scenarioDelta)}</strong>
              </div>
              <div>
                <span className="kpi-label">Trustworthiness</span>
                <strong>
                  {player.trustworthinessScore} · {getTrustLabel(player.trustworthinessScore)}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-card">
            <h3>Intervals and uncertainty</h3>
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
              <div>
                <span>Stickiness / fragility</span>
                <strong>
                  {player.diagnostics.stickinessScore} / {player.diagnostics.fragilityScore}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-card">
            <h3>Diagnostics and decision reasons</h3>
            <div className="detail-list detail-list--two-col">
              <div>
                <span>Regression up</span>
                <strong>{player.diagnostics.regressionUpScore}</strong>
              </div>
              <div>
                <span>Regression down</span>
                <strong>{player.diagnostics.regressionDownScore}</strong>
              </div>
            </div>
            <DiagnosticTagList tags={player.diagnostics.flags} />
            <ul className="bullet-list">
              {player.diagnostics.decisionReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <section className="detail-card">
            <h3>Market comparison</h3>
            <div className="detail-list detail-list--two-col">
              <div>
                <span>Raw delta vs market</span>
                <strong>{formatSigned(player.marketEdge.rawDelta)}</strong>
              </div>
              <div>
                <span>Trust-adjusted edge</span>
                <strong>{player.marketEdge.trustAdjustedScore}</strong>
              </div>
              <div>
                <span>Confidence multiplier</span>
                <strong>{player.marketEdge.confidenceMultiplier.toFixed(2)}</strong>
              </div>
              <div>
                <span>Direction</span>
                <strong>{player.marketEdge.direction.replace('_', ' ')}</strong>
              </div>
            </div>
            <ul className="bullet-list">
              {player.marketEdge.explanation.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <section className="detail-card">
            <h3>Event and fusion notes</h3>
            {player.eventSummary ? <p>{player.eventSummary}</p> : <p className="muted">No event-specific note for this profile.</p>}
            <ul className="bullet-list">
              {player.fusionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
