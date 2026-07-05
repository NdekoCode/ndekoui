'use client';

import { AnimatePresence, motion, type MotionProps } from 'motion/react';
import { useLayoutEffect, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  seriesColorOf,
  type AgentStatus as AgentState,
  type CallStatus,
  type RunAgent,
  type RunSnapshot,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import {
  CALL_STATUS_WORD,
  CallStatusMark,
} from '@/registry/ndeko/ui/call-status';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  EASE_IN_OUT_STRONG,
  slowSpringOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { AGENT_STATUS_WORD, AgentStatus } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CODER, PLANNER, RESEARCHER, RUN_TITLE, WRITER } from './_parts/crew';
import { ToolTile } from './_parts/tool-tile';
import { nounOf } from './_parts/words';

export type GraphLayout = 'tree' | 'flow' | 'hub';

type GraphNode = {
  id: string;
  kind: 'agent' | 'tool';
  parentId: string | null;
  label: string;
  series: SeriesSlot;
  agent?: RunAgent;
  owner?: RunAgent;
  calls: ToolCall[];
};

type Point = { x: number; y: number };

type Size = { width: number; height: number };

type Placement = { depth: number; slot: number };

type Plan = {
  placements: Map<string, Placement>;
  leafCount: number;
  maxDepth: number;
};

const LAYOUTS: Segment<GraphLayout>[] = [
  { value: 'tree', label: 'Tree' },
  { value: 'flow', label: 'Flow' },
  { value: 'hub', label: 'Hub' },
];

const STAGE_HEIGHT_PX = 320;

const PAD_X = 30;

const PAD_TOP = 24;

const PAD_BOTTOM = 36;

const AGENT_PX = 32;

const TOOL_PX = 28;

const INNER_RING = 0.4;

const RECENT_CALLS = 3;

function isKnownParent(agent: RunAgent, ids: Set<string>) {
  if (!agent.parentId) {
    return false;
  }
  return ids.has(agent.parentId);
}

function parentIdOf(agent: RunAgent, ids: Set<string>) {
  if (isKnownParent(agent, ids)) {
    return agent.parentId ?? null;
  }
  return null;
}

/** Agents first, then one node per tool an agent called, so the same tool used by two agents sits under each. */
function nodesOf(agents: RunAgent[], calls: ToolCall[]) {
  const agentIds = agents.map((agent) => agent.id);
  const ids = new Set(agentIds);
  const nodes: GraphNode[] = [];
  for (const agent of agents) {
    const ownCalls = calls.filter((call) => call.agentId === agent.id);
    nodes.push({
      id: agent.id,
      kind: 'agent',
      parentId: parentIdOf(agent, ids),
      label: agent.name,
      series: agent.series,
      agent,
      calls: ownCalls,
    });
  }
  for (const call of calls) {
    const owner = agents.find((agent) => agent.id === call.agentId);
    if (!owner) {
      continue;
    }
    const id = `${owner.id}:${call.tool}`;
    const existing = nodes.find((node) => node.id === id);
    if (existing) {
      existing.calls.push(call);
      continue;
    }
    nodes.push({
      id,
      kind: 'tool',
      parentId: owner.id,
      label: call.tool,
      series: owner.series,
      owner,
      calls: [call],
    });
  }
  return nodes;
}

function childrenOf(nodes: GraphNode[], parentId: string) {
  return nodes.filter((node) => node.parentId === parentId);
}

function planOf(nodes: GraphNode[]): Plan {
  const placements = new Map<string, Placement>();
  const roots = nodes.filter((node) => node.parentId === null);
  let leafCount = 0;
  let maxDepth = 0;

  function place(node: GraphNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    const children = childrenOf(nodes, node.id);
    if (children.length === 0) {
      const slot = leafCount + 0.5;
      leafCount += 1;
      placements.set(node.id, { depth, slot });
      return slot;
    }
    const childSlots = children.map((child) => place(child, depth + 1));
    const first = childSlots[0];
    const last = childSlots[childSlots.length - 1];
    const sum = first + last;
    const slot = sum / 2;
    placements.set(node.id, { depth, slot });
    return slot;
  }

  for (const root of roots) {
    place(root, 0);
  }
  return { placements, leafCount, maxDepth };
}

function depthShareOf(depth: number, maxDepth: number) {
  if (maxDepth === 0) {
    return 0.5;
  }
  return depth / maxDepth;
}

function ringOf(depth: number, maxDepth: number) {
  if (depth === 0) {
    return 0;
  }
  const ringsBeyondFirst = maxDepth - 1;
  const outerRings = Math.max(1, ringsBeyondFirst);
  const ringIndex = depth - 1;
  const step = ringIndex / outerRings;
  const spread = 1 - INNER_RING;
  const reach = spread * step;
  return INNER_RING + reach;
}

function pointOf(
  layout: GraphLayout,
  placement: Placement,
  plan: Plan,
  size: Size
): Point {
  const slots = Math.max(1, plan.leafCount);
  const across = placement.slot / slots;
  const deep = depthShareOf(placement.depth, plan.maxDepth);
  const innerWidth = size.width - PAD_X * 2;
  const innerHeight = size.height - PAD_TOP - PAD_BOTTOM;
  if (layout === 'tree') {
    const x = PAD_X + across * innerWidth;
    const y = PAD_TOP + deep * innerHeight;
    return { x, y };
  }
  if (layout === 'flow') {
    const x = PAD_X + deep * innerWidth;
    const y = PAD_TOP + across * innerHeight;
    return { x, y };
  }
  const centerX = size.width / 2;
  const centerY = PAD_TOP + innerHeight / 2;
  const shortSide = Math.min(innerWidth, innerHeight);
  const outerRadius = shortSide / 2;
  const ring = ringOf(placement.depth, plan.maxDepth);
  const radius = outerRadius * ring;
  const turn = across * Math.PI * 2;
  const angle = turn - Math.PI / 2;
  const offsetX = radius * Math.cos(angle);
  const offsetY = radius * Math.sin(angle);
  return { x: centerX + offsetX, y: centerY + offsetY };
}

function round(value: number) {
  const tenths = Math.round(value * 10);
  return tenths / 10;
}

function between(from: number, to: number, share: number) {
  const distance = to - from;
  const offset = distance * share;
  return round(from + offset);
}

/** Every edge is one cubic curve in all three layouts, so its path morphs while the nodes glide. */
function edgePathOf(layout: GraphLayout, from: Point, to: Point) {
  const fromX = round(from.x);
  const fromY = round(from.y);
  const toX = round(to.x);
  const toY = round(to.y);
  if (layout === 'tree') {
    const middleY = between(fromY, toY, 1 / 2);
    return `M ${fromX} ${fromY} C ${fromX} ${middleY}, ${toX} ${middleY}, ${toX} ${toY}`;
  }
  if (layout === 'flow') {
    const middleX = between(fromX, toX, 1 / 2);
    return `M ${fromX} ${fromY} C ${middleX} ${fromY}, ${middleX} ${toY}, ${toX} ${toY}`;
  }
  const firstX = between(fromX, toX, 1 / 3);
  const firstY = between(fromY, toY, 1 / 3);
  const secondX = between(fromX, toX, 2 / 3);
  const secondY = between(fromY, toY, 2 / 3);
  return `M ${fromX} ${fromY} C ${firstX} ${firstY}, ${secondX} ${secondY}, ${toX} ${toY}`;
}

function useStageSize() {
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    if (!stage) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stage]);

  return { setStage, size };
}

function nodeStatusOf(node: GraphNode): CallStatus {
  if (node.agent) {
    return callStatusOfAgent(node.agent.status);
  }
  const latest = node.calls.at(-1);
  return latest?.status ?? 'queued';
}

function callStatusOfAgent(status: AgentState): CallStatus {
  if (status === 'idle') {
    return 'queued';
  }
  return status;
}

function isBusy(node: GraphNode) {
  const status = nodeStatusOf(node);
  return status === 'running';
}

function nodeLabelOf(node: GraphNode, nodes: GraphNode[]) {
  const parent = nodes.find((candidate) => candidate.id === node.parentId);
  const status = nodeStatusOf(node);
  const word = CALL_STATUS_WORD[status];
  const callCount = node.calls.length;
  const calls = `${callCount} ${nounOf(callCount, 'call')}`;
  if (node.kind === 'tool') {
    return `${node.label}, a tool of ${parent?.label ?? 'an agent'}, ${calls}, ${word}`;
  }
  if (parent) {
    return `${node.label}, started by ${parent.label}, ${word}`;
  }
  return `${node.label}, the lead, ${word}`;
}

function NodeDetails({ node }: { node: GraphNode }) {
  const lastCalls = node.calls.slice(-RECENT_CALLS);
  const recent = [...lastCalls].reverse();
  const hasCalls = recent.length > 0;
  const isAgent = node.kind === 'agent';
  const isTool = node.kind === 'tool';

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2.5'>
        {isAgent && (
          <AgentTile name={node.label} series={node.series} size='md' />
        )}
        {isTool && <ToolTile tool={node.label} size='sm' />}
        <div className='min-w-0 flex-1'>
          <PopoverTitle className='truncate text-[13px] leading-5'>
            {node.label}
          </PopoverTitle>
          <p className='text-muted-foreground truncate text-xs'>
            {isAgent && (node.agent?.model ?? 'Agent')}
            {isTool && `Called by ${node.owner?.name ?? 'an agent'}`}
          </p>
        </div>
        {node.agent && <AgentStatus status={node.agent.status} />}
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-muted-foreground text-xs font-medium'>Last calls</p>
        {!hasCalls && (
          <p className='text-muted-foreground text-xs'>No calls yet</p>
        )}
        <ul className='flex flex-col'>
          {recent.map((call) => (
            <li key={call.id} className='flex items-center gap-2 py-1 text-xs'>
              <CallStatusMark status={call.status} className='size-3.5' />
              <span className='min-w-0 flex-1 truncate'>{call.label}</span>
              {call.startedAt !== undefined && (
                <LiveDuration
                  item={call}
                  isRunning={call.status === 'running'}
                  className='text-muted-foreground shrink-0'
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const GROW_IN = { opacity: 0, scale: 0.9 };

const FADE_IN = { opacity: 0, scale: 1 };

function growOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_IN;
  }
  return GROW_IN;
}

function GraphNodeButton({
  node,
  point,
  label,
}: {
  node: GraphNode;
  point: Point;
  label: string;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = slowSpringOf(shouldReduceMotion);
  const grow = growOf(shouldReduceMotion);
  const isAgent = node.kind === 'agent';
  const isTool = node.kind === 'tool';
  const nodeSize = nodeSizeOf(node);
  const half = nodeSize / 2;
  const x = point.x - half;
  const y = point.y - half;
  const isRunning = isBusy(node);
  const color = seriesColorOf(node.series);
  const haloStyle = {
    boxShadow: `0 0 0 2px color-mix(in oklab, ${color} 45%, transparent)`,
    animationDuration: '2s',
  };

  return (
    <motion.div
      className='absolute start-0 top-0'
      initial={{ ...grow, x, y }}
      animate={{ opacity: 1, scale: 1, x, y }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.14 } }}
      transition={glide}
    >
      <Popover>
        <PopoverTrigger
          render={
            <button
              type='button'
              aria-label={label}
              className={cn(
                'focus-visible:ring-ring focus-visible:ring-offset-background relative flex cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isAgent && 'rounded-lg',
                isTool && 'rounded-md'
              )}
            />
          }
        >
          {isRunning && (
            <span
              aria-hidden='true'
              className={cn(
                'absolute -inset-1 animate-pulse',
                isAgent && 'rounded-[14px]',
                isTool && 'rounded-xl'
              )}
              style={haloStyle}
            />
          )}
          {isAgent && (
            <AgentTile name={node.label} series={node.series} size='lg' />
          )}
          {isTool && <ToolTile tool={node.label} size='md' />}
          {isAgent && (
            <span
              aria-hidden='true'
              className='text-muted-foreground pointer-events-none absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[11px] whitespace-nowrap'
            >
              {node.label}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent className='w-64 p-3'>
          <NodeDetails node={node} />
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}

function nodeSizeOf(node: GraphNode) {
  if (node.kind === 'agent') {
    return AGENT_PX;
  }
  return TOOL_PX;
}

type Edge = {
  id: string;
  path: string;
  series: SeriesSlot;
};

type StreakMotion = Pick<MotionProps, 'initial' | 'animate' | 'transition'>;

const STREAK_TRAVEL: StreakMotion = {
  initial: { pathLength: 0.2, pathOffset: 0, opacity: 0 },
  animate: { pathOffset: 0.85, opacity: [0, 1, 1, 0] },
  transition: { duration: 0.85, ease: EASE_IN_OUT_STRONG },
};

const STREAK_FLASH: StreakMotion = {
  initial: { opacity: 0 },
  animate: { opacity: [0, 0.8, 0] },
  transition: { duration: 0.9 },
};

function streakOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return STREAK_FLASH;
  }
  return STREAK_TRAVEL;
}

function streakKeyOf(call: ToolCall) {
  return `${call.id}-${call.startedAt ?? 0}`;
}

function edgesOf(
  nodes: GraphNode[],
  points: Map<string, Point>,
  layout: GraphLayout
) {
  const edges: Edge[] = [];
  for (const node of nodes) {
    const from = points.get(node.parentId ?? '');
    const to = points.get(node.id);
    if (!from || !to) {
      continue;
    }
    const parent = nodes.find((candidate) => candidate.id === node.parentId);
    const series = parent?.series ?? node.series;
    const path = edgePathOf(layout, from, to);
    edges.push({ id: node.id, path, series });
  }
  return edges;
}

function initialStreakKeys(calls: ToolCall[]) {
  const keys = calls.map(streakKeyOf);
  return new Set(keys);
}

const NO_CALLS: ToolCall[] = [];

export type AgentGraphProps = {
  agents: RunAgent[];
  calls?: ToolCall[];
  defaultLayout?: GraphLayout;
  className?: string;
};

export function AgentGraph({
  agents,
  calls = NO_CALLS,
  defaultLayout = 'tree',
  className,
}: AgentGraphProps) {
  const [layout, setLayout] = useState<GraphLayout>(defaultLayout);
  const [playedKeys, setPlayedKeys] = useState(() => initialStreakKeys(calls));
  const { setStage, size } = useStageSize();
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = slowSpringOf(shouldReduceMotion);
  const streak = streakOf(shouldReduceMotion);
  const nodes = nodesOf(agents, calls);
  const plan = planOf(nodes);
  const points = new Map<string, Point>();
  if (size) {
    for (const node of nodes) {
      const placement = plan.placements.get(node.id);
      if (placement) {
        const point = pointOf(layout, placement, plan, size);
        points.set(node.id, point);
      }
    }
  }
  const edges = edgesOf(nodes, points, layout);
  const freshCalls = calls.filter((call) => {
    const key = streakKeyOf(call);
    return !playedKeys.has(key);
  });
  const agentCount = agents.length;
  const toolCount = nodes.length - agentCount;
  const callCount = calls.length;

  function markPlayed(key: string) {
    setPlayedKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-muted-foreground text-xs tabular-nums'>
          <MotionNumber value={agentCount} /> {nounOf(agentCount, 'agent')},{' '}
          <MotionNumber value={toolCount} /> {nounOf(toolCount, 'tool')},{' '}
          <MotionNumber value={callCount} /> {nounOf(callCount, 'call')}
        </p>
        <Segments
          value={layout}
          segments={LAYOUTS}
          onValueChange={setLayout}
          label='Layout'
          className='w-44'
        />
      </div>
      <div
        ref={setStage}
        className='bg-foreground/[0.025] dark:bg-foreground/[0.04] relative overflow-hidden rounded-lg'
        style={{ height: STAGE_HEIGHT_PX }}
      >
        {size && (
          <svg
            aria-hidden='true'
            width={size.width}
            height={size.height}
            className='pointer-events-none absolute inset-0'
          >
            <AnimatePresence initial={false}>
              {edges.map((edge) => (
                <motion.path
                  key={edge.id}
                  fill='none'
                  strokeWidth={1.25}
                  strokeOpacity={0.5}
                  style={{ stroke: seriesColorOf(edge.series) }}
                  initial={{ opacity: 0, d: edge.path }}
                  animate={{ opacity: 1, d: edge.path }}
                  exit={{ opacity: 0 }}
                  transition={glide}
                />
              ))}
            </AnimatePresence>
            {freshCalls.map((call) => {
              const ownerId = call.agentId ?? '';
              const from = points.get(ownerId);
              const to = points.get(`${ownerId}:${call.tool}`);
              const owner = agents.find((agent) => agent.id === ownerId);
              const key = streakKeyOf(call);
              const canDraw = from !== undefined && to !== undefined;
              const hasOwner = owner !== undefined;
              if (!canDraw || !hasOwner) {
                return null;
              }
              return (
                <motion.path
                  key={key}
                  d={edgePathOf(layout, from, to)}
                  fill='none'
                  strokeWidth={2.5}
                  strokeLinecap='round'
                  style={{ stroke: seriesColorOf(owner.series) }}
                  onAnimationComplete={() => markPlayed(key)}
                  {...streak}
                />
              );
            })}
          </svg>
        )}
        {size && (
          <ul aria-label='Agents and tools' className='absolute inset-0'>
            <AnimatePresence initial={false}>
              {nodes.map((node) => {
                const point = points.get(node.id);
                if (!point) {
                  return null;
                }
                return (
                  <li key={node.id}>
                    <GraphNodeButton
                      node={node}
                      point={point}
                      label={nodeLabelOf(node, nodes)}
                    />
                  </li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-graph',
  title: RUN_TITLE,
  agents: [{ ...PLANNER, status: 'running' }],
});

const PAGE_READER: RunAgent = {
  id: 'page-reader',
  name: 'Page reader',
  series: 2,
  status: 'running',
  model: 'Claude Haiku',
  parentId: RESEARCHER.id,
};

function spawned(agent: RunAgent): RunScriptStep['event'] {
  return { type: 'agent.added', agent: { ...agent, status: 'running' } };
}

function settled(
  id: string,
  status: RunAgent['status']
): RunScriptStep['event'] {
  return { type: 'agent.updated', id, patch: { status } };
}

function called(
  id: string,
  agentId: string,
  tool: string,
  label: string
): RunScriptStep['event'] {
  return {
    type: 'call.started',
    call: { id, agentId, tool, label, status: 'running' },
  };
}

function returned(
  id: string,
  status: CallStatus = 'done'
): RunScriptStep['event'] {
  return { type: 'call.updated', id, patch: { status } };
}

const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  { after: 400, event: spawned(RESEARCHER) },
  {
    after: 500,
    event: called(
      'search-1',
      RESEARCHER.id,
      'web_search',
      'Searched for Brightmoor prices'
    ),
  },
  { after: 900, event: returned('search-1') },
  { after: 300, event: spawned(CODER) },
  {
    after: 400,
    event: called('sheet-1', CODER.id, 'read_sheet', 'Read q3-invoices.xlsx'),
  },
  {
    after: 400,
    event: called(
      'fetch-1',
      RESEARCHER.id,
      'fetch_page',
      'Read the pricing page'
    ),
  },
  { after: 700, event: returned('sheet-1') },
  { after: 300, event: returned('fetch-1', 'failed') },
  { after: 400, event: spawned(PAGE_READER) },
  {
    after: 500,
    event: called(
      'fetch-2',
      PAGE_READER.id,
      'fetch_page',
      'Read the cached pricing page'
    ),
  },
  {
    after: 600,
    event: called('python-1', CODER.id, 'run_python', 'Ran compare_prices.py'),
  },
  { after: 800, event: returned('fetch-2') },
  { after: 300, event: settled(PAGE_READER.id, 'done') },
  {
    after: 400,
    event: called(
      'search-2',
      RESEARCHER.id,
      'web_search',
      'Searched for the contract terms'
    ),
  },
  { after: 700, event: returned('python-1') },
  { after: 300, event: returned('search-2') },
  { after: 200, event: settled(RESEARCHER.id, 'done') },
  {
    after: 400,
    event: called(
      'python-2',
      CODER.id,
      'run_python',
      'Summed what was overpaid'
    ),
  },
  { after: 900, event: returned('python-2') },
  { after: 200, event: settled(CODER.id, 'done') },
  { after: 300, event: spawned(WRITER) },
  {
    after: 500,
    event: called(
      'draft-1',
      WRITER.id,
      'draft_email',
      'Drafted the credit request'
    ),
  },
  { after: 1400, event: returned('draft-1') },
  { after: 200, event: settled(WRITER.id, 'done') },
  { after: 300, event: settled(PLANNER.id, 'done') },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

function announcementOf(run: RunSnapshot) {
  const latest = run.calls.at(-1);
  if (run.status === 'done') {
    return 'The run is done';
  }
  if (!latest) {
    return `${PLANNER.name} leads the run`;
  }
  const agent = run.agents.find((candidate) => candidate.id === latest.agentId);
  const word = CALL_STATUS_WORD[latest.status];
  return `${agent?.name ?? 'An agent'} called ${latest.tool}: ${word}`;
}

function crewWordOf(run: RunSnapshot) {
  const running = run.agents.filter((agent) => agent.status === 'running');
  const count = running.length;
  if (count === 0) {
    return AGENT_STATUS_WORD.done;
  }
  return `${count} ${nounOf(count, 'agent')} running`;
}

export default function Agent03() {
  const { ref, isInView, snapshot, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
  });
  const isEnded = snapshot.endedAt !== undefined;
  const announcement = announcementOf(snapshot);

  return (
    <div ref={ref} className='flex w-full max-w-[44rem] flex-col gap-2'>
      <section
        aria-label='Agent graph'
        className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <header className='flex items-baseline justify-between gap-3'>
          <h3 className='truncate text-sm font-medium'>{snapshot.title}</h3>
          <span className='text-muted-foreground shrink-0 text-xs'>
            {crewWordOf(snapshot)}
          </span>
        </header>
        <ClockGate isActive={isInView}>
          <AgentGraph agents={snapshot.agents} calls={snapshot.calls} />
        </ClockGate>
      </section>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isEnded} onReplay={restart} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
