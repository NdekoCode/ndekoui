'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  seriesColorOf,
  type AgentStatus as AgentState,
  type CallStatus,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { slowSpringOf } from '@/registry/ndeko/lib/motion-presets';
import {
  applyBatchAt,
  batch,
  reduceBatch,
  restingOf,
  type RunStep,
} from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { nounOf } from '@/registry/ndeko/lib/words';
import {
  CALL_STATUS_WORD,
  CallStatusMark,
} from '@/registry/ndeko/ui/call-status';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import {
  AGENT_STATUS_WORD,
  AgentStatus,
  pulsingIdsOf,
} from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CODER, PLANNER, RESEARCHER, RUN_TITLE, WRITER } from './_parts/crew';
import { ToolTile } from './_parts/tool-tile';

export type GraphLayout = 'tree' | 'flow' | 'hub';

/** The agents and the calls a run is expected to involve, when they are known before it starts. */
export type ExpectedGraph = {
  agents: RunAgent[];
  calls: ToolCall[];
};

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
        {node.agent && <AgentStatus status={node.agent.status} isStill />}
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
  isPulsing,
}: {
  node: GraphNode;
  point: Point;
  label: string;
  /** Only the halo of a running agent breathes, and three at most in the graph. */
  isPulsing: boolean;
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
                'absolute -inset-1',
                isPulsing && 'animate-pulse',
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

/**
 * An edge draws itself once, when one agent calls another or reaches for a tool, then holds still:
 * its length is normalised to 1. The edges the graph is first shown with are there, they do not arrive.
 */
const EDGE_DRAW =
  'transition-[stroke-dashoffset] duration-500 ease-(--ease-out-strong) [stroke-dasharray:1] [stroke-dashoffset:0] starting:[stroke-dashoffset:1]';

function edgeDrawOf(edgeId: string, firstNodeIds: Set<string>) {
  const wasThereAtFirst = firstNodeIds.has(edgeId);
  if (wasThereAtFirst) {
    return undefined;
  }
  return EDGE_DRAW;
}

const QUICK_EXIT = { duration: 0.14 };

/**
 * A call sends a dot from the agent to its tool. Each axis travels on its own curve, and the two
 * curves below are the ones that trace the edge itself: a cubic whose handles sit halfway along one
 * axis moves like a smooth step on the other. Both are transitions on `translate`, so the dot costs
 * no script and no layout.
 */
const HOP_TRAVEL = 'transition-[translate] duration-700';

const SMOOTH_STEP = 'cubic-bezier(0.3333, 0, 0.6667, 1)';

const HALFWAY_HANDLES = 'cubic-bezier(0.3333, 0.5, 0.6667, 0.5)';

type HopEasing = { across: string; down: string };

const HOP_EASING: Record<GraphLayout, HopEasing> = {
  tree: { across: SMOOTH_STEP, down: HALFWAY_HANDLES },
  flow: { across: HALFWAY_HANDLES, down: SMOOTH_STEP },
  hub: { across: 'linear', down: 'linear' },
};

type Hop = {
  key: string;
  from: Point;
  to: Point;
  series: SeriesSlot;
};

type HopStyle = React.CSSProperties & {
  '--hop-from': string;
  '--hop-to': string;
};

function hopStyleOf(from: number, to: number, easing: string): HopStyle {
  return {
    '--hop-from': `${round(from)}px`,
    '--hop-to': `${round(to)}px`,
    transitionTimingFunction: easing,
  };
}

function CallHop({ hop, layout }: { hop: Hop; layout: GraphLayout }) {
  const easing = HOP_EASING[layout];
  const acrossStyle = hopStyleOf(hop.from.x, hop.to.x, easing.across);
  const downStyle = hopStyleOf(hop.from.y, hop.to.y, easing.down);

  return (
    <span
      className={cn(
        'absolute top-0 left-0 translate-x-(--hop-to) starting:translate-x-(--hop-from)',
        HOP_TRAVEL
      )}
      style={acrossStyle}
    >
      <span
        className={cn(
          'block translate-y-(--hop-to) starting:translate-y-(--hop-from)',
          HOP_TRAVEL
        )}
        style={downStyle}
      >
        <span
          className='block size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity delay-500 duration-200 starting:opacity-100'
          style={{ backgroundColor: seriesColorOf(hop.series) }}
        />
      </span>
    </span>
  );
}

function hopKeyOf(call: ToolCall) {
  return `${call.id}-${call.startedAt ?? 0}`;
}

function isRunningCall(call: ToolCall) {
  return call.status === 'running';
}

/** A dot belongs to a call in flight and leaves when the call returns, so a long run keeps no trail of them. */
function hopsOf(
  calls: ToolCall[],
  agents: RunAgent[],
  points: Map<string, Point>,
  seenKeys: Set<string>
) {
  const hops: Hop[] = [];
  const runningCalls = calls.filter(isRunningCall);
  for (const call of runningCalls) {
    const key = hopKeyOf(call);
    const ownerId = call.agentId ?? '';
    const owner = agents.find((agent) => agent.id === ownerId);
    const from = points.get(ownerId);
    const to = points.get(`${ownerId}:${call.tool}`);
    const isSeen = seenKeys.has(key);
    if (isSeen || !owner) {
      continue;
    }
    if (!from || !to) {
      continue;
    }
    hops.push({ key, from, to, series: owner.series });
  }
  return hops;
}

/** What was planned keeps its order, so a node that joins later takes the place kept for it. */
function mergedById<Item extends { id: string }>(
  planned: Item[],
  present: Item[]
) {
  const plannedIds = planned.map((item) => item.id);
  const known = new Set(plannedIds);
  const extras = present.filter((item) => !known.has(item.id));
  return [...planned, ...extras];
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

function initialHopKeys(calls: ToolCall[]) {
  const keys = calls.map(hopKeyOf);
  return new Set(keys);
}

function initialNodeIds(agents: RunAgent[], calls: ToolCall[]) {
  const nodes = nodesOf(agents, calls);
  const ids = nodes.map((node) => node.id);
  return new Set(ids);
}

const NO_CALLS: ToolCall[] = [];

const NOTHING_EXPECTED: ExpectedGraph = { agents: [], calls: [] };

export type AgentGraphProps = {
  agents: RunAgent[];
  calls?: ToolCall[];
  /**
   * What the run is expected to involve. Every node then has its place from the start and appears
   * there when it joins, so the rest of the graph holds still. Without it the graph is laid out
   * again each time a node joins.
   */
  expected?: ExpectedGraph;
  defaultLayout?: GraphLayout;
  className?: string;
};

export function AgentGraph({
  agents,
  calls = NO_CALLS,
  expected = NOTHING_EXPECTED,
  defaultLayout = 'tree',
  className,
}: AgentGraphProps) {
  const [layout, setLayout] = useState<GraphLayout>(defaultLayout);
  const [seenHopKeys] = useState(() => initialHopKeys(calls));
  const [firstNodeIds] = useState(() => initialNodeIds(agents, calls));
  const { setStage, size } = useStageSize();
  const shouldReduceMotion = usePrefersReducedMotion();
  const glide = slowSpringOf(shouldReduceMotion);
  const nodes = nodesOf(agents, calls);
  const placedAgents = mergedById(expected.agents, agents);
  const placedCalls = mergedById(expected.calls, calls);
  const placedNodes = nodesOf(placedAgents, placedCalls);
  const plan = planOf(placedNodes);
  const points = new Map<string, Point>();
  if (size) {
    for (const node of placedNodes) {
      const placement = plan.placements.get(node.id);
      if (placement) {
        const point = pointOf(layout, placement, plan, size);
        points.set(node.id, point);
      }
    }
  }
  const edges = edgesOf(nodes, points, layout);
  const hops = hopsOf(calls, agents, points, seenHopKeys);
  const pulsingIds = pulsingIdsOf(agents);
  const agentCount = agents.length;
  const toolCount = nodes.length - agentCount;
  const callCount = calls.length;

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
                  pathLength={1}
                  fill='none'
                  strokeWidth={1.25}
                  strokeOpacity={0.5}
                  className={edgeDrawOf(edge.id, firstNodeIds)}
                  style={{ stroke: seriesColorOf(edge.series) }}
                  initial={{ d: edge.path }}
                  animate={{ d: edge.path }}
                  exit={{ opacity: 0, transition: QUICK_EXIT }}
                  transition={glide}
                />
              ))}
            </AnimatePresence>
          </svg>
        )}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0'
        >
          {hops.map((hop) => (
            <CallHop key={hop.key} hop={hop} layout={layout} />
          ))}
        </div>
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
                      isPulsing={pulsingIds.has(node.id)}
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

function spawned(agent: RunAgent): RunEvent {
  return { type: 'agent.added', agent: { ...agent, status: 'running' } };
}

function settled(id: string, status: RunAgent['status']): RunEvent {
  return { type: 'agent.updated', id, patch: { status } };
}

function called(
  id: string,
  agentId: string,
  tool: string,
  label: string
): RunEvent {
  return {
    type: 'call.started',
    call: { id, agentId, tool, label, status: 'running' },
  };
}

function returned(id: string, status: CallStatus = 'done'): RunEvent {
  return { type: 'call.updated', id, patch: { status } };
}

const SCRIPT: RunStep[] = [
  batch(500, { type: 'run.started' }),
  batch(400, spawned(RESEARCHER)),
  batch(
    500,
    called(
      'search-1',
      RESEARCHER.id,
      'web_search',
      'Searched for Brightmoor prices'
    )
  ),
  batch(900, returned('search-1')),
  batch(300, spawned(CODER)),
  batch(
    400,
    called('sheet-1', CODER.id, 'read_sheet', 'Read q3-invoices.xlsx')
  ),
  batch(
    400,
    called('fetch-1', RESEARCHER.id, 'fetch_page', 'Read the pricing page')
  ),
  batch(700, returned('sheet-1')),
  batch(300, returned('fetch-1', 'failed')),
  batch(400, spawned(PAGE_READER)),
  batch(
    500,
    called(
      'fetch-2',
      PAGE_READER.id,
      'fetch_page',
      'Read the cached pricing page'
    )
  ),
  batch(
    600,
    called('python-1', CODER.id, 'run_python', 'Ran compare_prices.py')
  ),
  batch(800, returned('fetch-2')),
  batch(300, settled(PAGE_READER.id, 'done')),
  batch(
    400,
    called(
      'search-2',
      RESEARCHER.id,
      'web_search',
      'Searched for the contract terms'
    )
  ),
  batch(700, returned('python-1')),
  batch(300, returned('search-2')),
  batch(200, settled(RESEARCHER.id, 'done')),
  batch(
    400,
    called('python-2', CODER.id, 'run_python', 'Summed what was overpaid')
  ),
  batch(900, returned('python-2')),
  batch(200, settled(CODER.id, 'done')),
  batch(300, spawned(WRITER)),
  batch(
    500,
    called('draft-1', WRITER.id, 'draft_email', 'Drafted the credit request')
  ),
  batch(1400, returned('draft-1')),
  batch(200, settled(WRITER.id, 'done')),
  batch(300, settled(PLANNER.id, 'done'), {
    type: 'run.finished',
    status: 'done',
  }),
];

/** The script is known ahead, so every agent and every tool has its place before it joins. */
function expectedOf(initial: RunSnapshot, script: RunStep[]): ExpectedGraph {
  const agents = [...initial.agents];
  const calls: ToolCall[] = [];
  for (const step of script) {
    for (const event of step.action.events) {
      if (event.type === 'agent.added') {
        agents.push(event.agent);
      }
      if (event.type === 'call.started') {
        calls.push(event.call);
      }
    }
  }
  return { agents, calls };
}

const EXPECTED = expectedOf(INITIAL_RUN, SCRIPT);

const SESSION = {
  reducer: reduceBatch,
  initial: INITIAL_RUN,
  resting: restingOf(INITIAL_RUN, SCRIPT, applyBatchAt),
  script: SCRIPT,
  loopAfter: 3000,
};

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
  const { ref, isInView, isAutoplaying, state, restart } = useSession(SESSION);
  const isEnded = state.endedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;
  const announcement = announcementOf(state);

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[28.75rem] w-full max-w-[44rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <section
          aria-label='Agent graph'
          className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          <header className='flex items-baseline justify-between gap-3'>
            <h3 className='truncate text-sm font-medium'>{state.title}</h3>
            <span className='text-muted-foreground shrink-0 text-xs'>
              {crewWordOf(state)}
            </span>
          </header>
          <AgentGraph
            agents={state.agents}
            calls={state.calls}
            expected={EXPECTED}
          />
        </section>
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
