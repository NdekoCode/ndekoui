'use client';

import { useMemo } from 'react';

import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { noiseAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { placeOf, spanBetween, type ScenePoint } from './_parts/geometry';
import { useSceneAnimations } from './_parts/use-scene-animations';
import { useScenePlay } from './_parts/use-scene-play';

export type PulseLead = {
  name: string;
  series: SeriesSlot;
};

export type PulseTool = {
  id: string;
  name: string;
  brand: BrandSlug;
};

export type PulseAgent = {
  id: string;
  name: string;
  series: SeriesSlot;
  toolIds: string[];
};

type PulseNode = {
  key: string;
  point: ScenePoint;
};

type PulseEdge = {
  key: string;
  fromKey: string;
  toKey: string;
  from: ScenePoint;
  to: ScenePoint;
  color: string;
  startMs: number;
};

type Score = {
  nodes: PulseNode[];
  edges: PulseEdge[];
  cycleMs: number;
};

const STAGE_ASPECT = 8 / 5;

const LEAD_COLUMN = 0.09;

const AGENT_COLUMN = 0.46;

const TOOL_COLUMN = 0.91;

const LEAD_KEY = 'lead';

const FIRST_CALL_MS = 1400;

const TRAVEL_MS = 900;

/** An agent calls its first tool once the hand-off from the lead has landed. */
const AFTER_HAND_OFF_MS = TRAVEL_MS + 160;

const CALL_GAP_MS = 760;

const REST_MS = 1300;

const TRAVEL_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

const BUMP_RISE_MS = 140;

const BUMP_FALL_MS = 420;

/** Under reduced motion one streak in three is drawn where it would be in mid flight. */
const FROZEN_EVERY = 3;

function rowOf(index: number, count: number) {
  return (index + 0.5) / count;
}

function agentPointOf(index: number, count: number): ScenePoint {
  return { x: AGENT_COLUMN, y: rowOf(index, count) };
}

function toolPointOf(index: number, count: number): ScenePoint {
  return { x: TOOL_COLUMN, y: rowOf(index, count) };
}

function agentKeyOf(agent: PulseAgent) {
  return `agent:${agent.id}`;
}

function toolKeyOf(toolId: string) {
  return `tool:${toolId}`;
}

/** The wait between two calls changes from call to call, the same way on every round. */
function gapOf(order: number) {
  const noise = noiseAt(order, 7);
  const stretch = 0.75 + noise * 0.9;
  return CALL_GAP_MS * stretch;
}

/**
 * Where every node sits and when every call leaves: the lead hands work to each agent in turn, and
 * each agent then calls its tools one after the other.
 */
function scoreOf(
  lead: PulseLead,
  agents: PulseAgent[],
  tools: PulseTool[]
): Score {
  const leadPoint: ScenePoint = { x: LEAD_COLUMN, y: 0.5 };
  const nodes: PulseNode[] = [{ key: LEAD_KEY, point: leadPoint }];
  const points = new Map<string, ScenePoint>();
  agents.forEach((agent, index) => {
    const key = agentKeyOf(agent);
    const point = agentPointOf(index, agents.length);
    points.set(key, point);
    nodes.push({ key, point });
  });
  tools.forEach((tool, index) => {
    const key = toolKeyOf(tool.id);
    const point = toolPointOf(index, tools.length);
    points.set(key, point);
    nodes.push({ key, point });
  });

  const edges: PulseEdge[] = [];
  let clock = FIRST_CALL_MS;
  let order = 0;
  for (const agent of agents) {
    const agentKey = agentKeyOf(agent);
    const agentPoint = points.get(agentKey);
    if (!agentPoint) {
      continue;
    }
    edges.push({
      key: `${LEAD_KEY}>${agentKey}`,
      fromKey: LEAD_KEY,
      toKey: agentKey,
      from: leadPoint,
      to: agentPoint,
      color: seriesColorOf(lead.series),
      startMs: clock,
    });
    clock += AFTER_HAND_OFF_MS;
    for (const toolId of agent.toolIds) {
      const toolKey = toolKeyOf(toolId);
      const toolPoint = points.get(toolKey);
      if (!toolPoint) {
        continue;
      }
      edges.push({
        key: `${agentKey}>${toolKey}`,
        fromKey: agentKey,
        toKey: toolKey,
        from: agentPoint,
        to: toolPoint,
        color: seriesColorOf(agent.series),
        startMs: clock,
      });
      clock += gapOf(order);
      order += 1;
    }
  }
  return { nodes, edges, cycleMs: clock + TRAVEL_MS + REST_MS };
}

/** A streak waits hidden at the start of its edge, crosses it once in the round, then waits at the end. */
function streakKeyframesOf(edge: PulseEdge, cycleMs: number): Keyframe[] {
  const leavesAt = edge.startMs / cycleMs;
  const travel = TRAVEL_MS / cycleMs;
  const showsAt = leavesAt + travel * 0.2;
  const arrivesAt = leavesAt + travel;
  const goneAt = arrivesAt + travel * 0.15;
  const atStart = 'translateX(0%)';
  const atEnd = 'translateX(100%)';
  return [
    { offset: 0, transform: atStart, opacity: 0 },
    { offset: leavesAt, transform: atStart, opacity: 0, easing: TRAVEL_EASE },
    { offset: showsAt, opacity: 1 },
    { offset: arrivesAt, transform: atEnd, opacity: 1 },
    { offset: goneAt, transform: atEnd, opacity: 0 },
    { offset: 1, transform: atEnd, opacity: 0 },
  ];
}

/** A node gives a little each time a call lands on it. */
function bumpKeyframesOf(landings: PulseEdge[], cycleMs: number): Keyframe[] {
  const rest = 'scale(1)';
  const frames: Keyframe[] = [{ offset: 0, transform: rest }];
  for (const edge of landings) {
    const landsMs = edge.startMs + TRAVEL_MS;
    const landsAt = landsMs / cycleMs;
    const peakAt = (landsMs + BUMP_RISE_MS) / cycleMs;
    const settledAt = (landsMs + BUMP_FALL_MS) / cycleMs;
    frames.push({ offset: landsAt, transform: rest });
    frames.push({ offset: peakAt, transform: 'scale(1.1)' });
    frames.push({ offset: settledAt, transform: rest });
  }
  frames.push({ offset: 1, transform: rest });
  return frames;
}

function animateScore(stage: HTMLElement, score: Score) {
  const timing = { duration: score.cycleMs, iterations: Infinity };
  const runners = stage.querySelectorAll<HTMLElement>('[data-pulse-streak]');
  const tiles = stage.querySelectorAll<HTMLElement>('[data-pulse-node]');
  const animations: Animation[] = [];
  runners.forEach((runner, index) => {
    const edge = score.edges[index];
    if (edge) {
      const keyframes = streakKeyframesOf(edge, score.cycleMs);
      animations.push(runner.animate(keyframes, timing));
    }
  });
  tiles.forEach((tile) => {
    const nodeKey = tile.dataset.pulseNode;
    const landings = score.edges.filter((edge) => edge.toKey === nodeKey);
    if (landings.length > 0) {
      const keyframes = bumpKeyframesOf(landings, score.cycleMs);
      animations.push(tile.animate(keyframes, timing));
    }
  });
  return animations;
}

function edgeStyleOf(edge: PulseEdge) {
  const span = spanBetween(edge.from, edge.to, STAGE_ASPECT);
  return {
    ...placeOf(edge.from),
    width: `${span.lengthPercent}%`,
    transform: `rotate(${span.angleDeg}deg)`,
  };
}

function streakStyleOf(edge: PulseEdge) {
  return {
    backgroundImage: `linear-gradient(to right, transparent, ${edge.color})`,
  };
}

function isFrozenStreak(isStill: boolean, index: number) {
  const isChosen = index % FROZEN_EVERY === 0;
  return isStill && isChosen;
}

function structureKeyOf(score: Score) {
  const edgeKeys = score.edges.map((edge) => edge.key);
  return edgeKeys.join('|');
}

function labelOf(lead: PulseLead, agents: PulseAgent[], tools: PulseTool[]) {
  const agentNames = agents.map((agent) => agent.name);
  const toolNames = tools.map((tool) => tool.name);
  const crew = agentNames.join(', ');
  const kit = toolNames.join(', ');
  return `${lead.name} hands work to ${crew}, who call ${kit}`;
}

const NODE_CLASS = 'absolute -translate-x-1/2 -translate-y-1/2';

const NAME_CLASS =
  'text-muted-foreground pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[11px] leading-4 whitespace-nowrap';

export type RunPulseProps = {
  lead: PulseLead;
  agents: PulseAgent[];
  tools: PulseTool[];
  className?: string;
};

export function RunPulse({ lead, agents, tools, className }: RunPulseProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const score = useMemo(
    () => scoreOf(lead, agents, tools),
    [lead, agents, tools]
  );

  useSceneAnimations(
    ref,
    isPlaying,
    (stage) => animateScore(stage, score),
    structureKeyOf(score)
  );

  return (
    <div
      ref={ref}
      role='img'
      aria-label={labelOf(lead, agents, tools)}
      className={cn('relative aspect-[8/5] w-full max-w-[26rem]', className)}
    >
      {score.edges.map((edge, index) => (
        <span
          key={edge.key}
          style={edgeStyleOf(edge)}
          className='absolute h-0.5 origin-left -translate-y-1/2 overflow-hidden'
        >
          <span className='bg-foreground/10 absolute inset-x-0 top-1/2 h-px -translate-y-1/2' />
          <span
            data-pulse-streak=''
            data-frozen={isFrozenStreak(isStill, index)}
            className='absolute inset-0 opacity-0 data-[frozen=true]:translate-x-[45%] data-[frozen=true]:opacity-100'
          >
            <span
              style={streakStyleOf(edge)}
              className='absolute inset-y-0 left-0 w-7 rounded-full'
            />
          </span>
        </span>
      ))}
      <span style={placeOf(score.nodes[0].point)} className={NODE_CLASS}>
        <span data-pulse-node={LEAD_KEY} className='block'>
          <MeshTile
            seed={lead.name}
            color={seriesColorOf(lead.series)}
            className='block size-10 rounded-[10px]'
          />
        </span>
        <span className={NAME_CLASS}>{lead.name}</span>
      </span>
      {agents.map((agent, index) => {
        const point = agentPointOf(index, agents.length);

        return (
          <span key={agent.id} style={placeOf(point)} className={NODE_CLASS}>
            <span data-pulse-node={agentKeyOf(agent)} className='block'>
              <MeshTile
                seed={agent.name}
                color={seriesColorOf(agent.series)}
                className='block size-8 rounded-lg'
              />
            </span>
            <span className={NAME_CLASS}>{agent.name}</span>
          </span>
        );
      })}
      {tools.map((tool, index) => {
        const point = toolPointOf(index, tools.length);

        return (
          <span key={tool.id} style={placeOf(point)} className={NODE_CLASS}>
            <span data-pulse-node={toolKeyOf(tool.id)} className='block'>
              <BrandTile brand={tool.brand} size='lg' className='flex' />
            </span>
          </span>
        );
      })}
    </div>
  );
}

const LEAD: PulseLead = { name: 'Planner', series: 1 };

const TOOLS: PulseTool[] = [
  { id: 'notion', name: 'Notion', brand: 'notion' },
  { id: 'drive', name: 'Google Drive', brand: 'googledrive' },
  { id: 'github', name: 'GitHub', brand: 'github' },
  { id: 'sentry', name: 'Sentry', brand: 'sentry' },
  { id: 'linear', name: 'Linear', brand: 'linear' },
];

const AGENTS: PulseAgent[] = [
  {
    id: 'researcher',
    name: 'Researcher',
    series: 2,
    toolIds: ['notion', 'drive'],
  },
  { id: 'coder', name: 'Coder', series: 5, toolIds: ['github', 'sentry'] },
  {
    id: 'reviewer',
    name: 'Reviewer',
    series: 4,
    toolIds: ['sentry', 'linear'],
  },
];

export default function Illustration03() {
  return <RunPulse lead={LEAD} agents={AGENTS} tools={TOOLS} />;
}
