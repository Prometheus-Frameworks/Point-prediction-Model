import type { ProjectionScenario } from '../../types/scenario.js';
import type { TeamContext } from '../../types/team.js';
import type { NormalizedEvent } from '../types/normalizedEvent.js';
import { getMockPlayerProfile, getMockTeamContext } from './mockContext.js';

const buildScenarioId = (event: NormalizedEvent) =>
  `${event.event.type.toLowerCase().replaceAll('_', '-')}-${event.subjectPlayer.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}-${event.event.effectiveWeek}`;

const cloneEventTeamContext = (context: TeamContext): TeamContext => ({ ...context });

export const buildScenarioFromEvent = (event: NormalizedEvent): ProjectionScenario => {
  const playerTeam = event.subjectPlayer.team;
  const previousTeamContext =
    event.event.type === 'PLAYER_TRADE'
      ? getMockTeamContext(event.event.fromTeam?.team ?? playerTeam)
      : getMockTeamContext(playerTeam);
  const newTeamContext =
    event.event.type === 'PLAYER_TRADE'
      ? getMockTeamContext(event.event.toTeam?.team ?? playerTeam)
      : getMockTeamContext(playerTeam);
  const player = getMockPlayerProfile(
    event.subjectPlayer.name,
    previousTeamContext.team,
    event.subjectPlayer.position ?? 'WR',
    event.subjectPlayer.id,
  );

  return {
    metadata: {
      id: buildScenarioId(event),
      title: `${event.event.type} :: ${event.subjectPlayer.name}`,
      description: `${event.event.description} Sources: ${event.sources.join(', ')}. Quality ${event.qualityLabel} (${event.qualityScore}).`,
      tags: ['ingested', event.rawType.toLowerCase(), event.qualityLabel.toLowerCase()],
      defaultRun: false,
    },
    player: {
      ...player,
      team: previousTeamContext.team,
    },
    previousTeamContext,
    newTeamContext,
    event: {
      ...event.event,
      fromTeam: event.event.fromTeam ? cloneEventTeamContext(previousTeamContext) : undefined,
      toTeam: event.event.toTeam ? cloneEventTeamContext(newTeamContext) : undefined,
    },
  };
};

export const buildScenariosFromEvents = (events: NormalizedEvent[]): ProjectionScenario[] =>
  events.map(buildScenarioFromEvent);
