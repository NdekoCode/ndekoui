'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  seriesColorOf,
  type AgentStatus,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type RunStatus,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { SearchIcon, XIcon, ZoomOutIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Toggle } from '@/registry/ndeko/ui/toggle';

import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { JsonView } from '@/registry/ndeko/ui/json-view';
import {
  ClockGate,
  LiveDuration,
  useLiveNow,
} from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  applyBatchAt,
  batch,
  reduceBatch,
  restingOf,
  type RunStep,
} from './_parts/run-session';
import {
  EMAIL_INPUT,
  EMAIL_OUTPUT,
  PAGE_ERROR,
  PAGE_INPUT,
  PAGE_OUTPUT,
  PLANNER,
  RESEARCHER,
  RUN_TITLE,
  SCRIPT_INPUT,
  SCRIPT_OUTPUT,
  SEARCH_INPUT,
  SEARCH_OUTPUT,
  SHEET_INPUT,
  SHEET_OUTPUT,
  WRITER,
} from './_parts/scenario';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

type TraceKind = 'agent' | 'call';

type TraceStatus = 'queued' | 'running' | 'waiting' | 'done' | 'failed';

type TraceRow = {
  id: string;
  kind: TraceKind;
  depth: number;
  name: string;
  label: string;
  status: TraceStatus;
  series: SeriesSlot;
  agentName: string;
  startedAt: number;
  endedAt?: number;
  model?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
};

type TraceNode = {
  row: TraceRow;
  children: TraceNode[];
};

type TimeWindow = {
  from: number;
  to: number;
};

type Filter = 'all' | 'errors' | 'slow';

type Brush = {
  startX: number;
  currentX: number;
};

/** Where a bar starts and ends, in percent of the time window. */
type BarSpan = {
  start: number;
  end: number;
};

type LabelSide = 'after' | 'before' | 'inside';

type Reframe = {
  windowKey: string;
  at: number | null;
};

const FILTERS: Segment<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'errors', label: 'Errors' },
  { value: 'slow', label: 'Slow' },
];

const FILTER_WORD: Record<Filter, string> = {
  all: 'every call',
  errors: 'errors',
  slow: 'slow calls',
};

const STATUS_WORD: Record<TraceStatus, string> = {
  queued: 'queued',
  running: 'running',
  waiting: 'waiting on you',
  done: 'done',
  failed: 'failed',
};

const RUN_STATUS_LOOK: Record<
  RunStatus,
  { label: string; variant: 'secondary' | 'success' | 'destructive' }
> = {
  idle: { label: 'Not started', variant: 'secondary' },
  running: { label: 'Running', variant: 'secondary' },
  waiting: { label: 'Waiting on you', variant: 'secondary' },
  done: { label: 'Done', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Stopped', variant: 'secondary' },
};

const ORPHAN_SERIES: SeriesSlot = 1;

/** Two dispatches in one tick can land a few milliseconds apart: one call ending and the next starting. */
const HANDOFF_SLACK_MS = 30;

const MIN_ZOOM_MS = 200;

const MIN_BRUSH_PX = 8;

const LIVE_MARGIN_MS = 1500;

const HORIZONS = [2000, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 15000];

const TICK_STEPS = [
  50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 15000, 30000, 60000,
];

const MAX_TICKS = 5;

const INDENT_PX = 12;

/**
 * A running bar and the playhead are drawn one step ahead and travel there at a constant speed, so
 * one transition plays per step. `GROW` below lasts exactly as long.
 */
const GROW_STEP_MS = 1000;

const MIN_BAR_PERCENT = 0.6;

const GROW =
  'transition-transform duration-1000 ease-linear motion-reduce:transition-none';

const GLIDE =
  'transition-transform duration-300 ease-(--ease-in-out-strong) motion-reduce:transition-none';

/**
 * A bar is a clip that ends where the bar ends, holding a fill that starts where the bar starts.
 * Both move by transform and their offsets add up, so the bar keeps its corners, its ring and its
 * hatch while it grows.
 */
const BAR_CLIP = 'absolute inset-0 my-auto h-2.5 overflow-hidden rounded-[3px]';

const BAR_FILL = 'absolute inset-0 rounded-[3px]';

const LABEL_LANE: Record<LabelSide, string> = {
  after: 'absolute inset-0 flex items-center justify-start ps-1.5',
  before: 'absolute inset-0 flex items-center justify-end pe-1.5',
  inside: 'absolute inset-0 flex items-center justify-end pe-1.5',
};

/**
 * A call that is running starts from nothing, so its bar is seen growing from the first frame. A
 * bar that arrives finished is drawn whole.
 */
const CLIP_BIRTH = 'starting:[transform:translateX(var(--bar-closed))]';

const FILL_BIRTH = 'starting:[transform:translateX(100%)]';

const LABEL_BIRTH = 'starting:[transform:translateX(var(--label-from))]';

function agentStatusOf(status: AgentStatus): TraceStatus {
  if (status === 'idle') {
    return 'queued';
  }
  return status;
}

function agentRowOf(agent: RunAgent, depth: number): TraceRow | null {
  if (agent.startedAt === undefined) {
    return null;
  }
  return {
    id: agent.id,
    kind: 'agent',
    depth,
    name: agent.name,
    label: agent.task ?? agent.name,
    status: agentStatusOf(agent.status),
    series: agent.series,
    agentName: agent.name,
    startedAt: agent.startedAt,
    endedAt: agent.endedAt,
    model: agent.model,
  };
}

function callRowOf(
  call: ToolCall,
  depth: number,
  series: SeriesSlot,
  agentName: string
): TraceRow | null {
  if (call.startedAt === undefined) {
    return null;
  }
  return {
    id: call.id,
    kind: 'call',
    depth,
    name: call.tool,
    label: call.label,
    status: call.status,
    series,
    agentName,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    input: call.input,
    output: call.output,
    error: call.error,
  };
}

function byStart(first: TraceNode, second: TraceNode) {
  return first.row.startedAt - second.row.startedAt;
}

function nodeOfAgent(
  agent: RunAgent,
  depth: number,
  run: RunSnapshot
): TraceNode | null {
  const row = agentRowOf(agent, depth);
  if (!row) {
    return null;
  }
  const childDepth = depth + 1;
  const children: TraceNode[] = [];
  for (const call of run.calls) {
    if (call.agentId !== agent.id) {
      continue;
    }
    const callRow = callRowOf(call, childDepth, agent.series, agent.name);
    if (callRow) {
      children.push({ row: callRow, children: [] });
    }
  }
  for (const child of run.agents) {
    if (child.parentId !== agent.id) {
      continue;
    }
    const childNode = nodeOfAgent(child, childDepth, run);
    if (childNode) {
      children.push(childNode);
    }
  }
  children.sort(byStart);
  return { row, children };
}

function treeOf(run: RunSnapshot) {
  const roots: TraceNode[] = [];
  for (const agent of run.agents) {
    if (agent.parentId !== undefined) {
      continue;
    }
    const node = nodeOfAgent(agent, 0, run);
    if (node) {
      roots.push(node);
    }
  }
  for (const call of run.calls) {
    if (call.agentId !== undefined) {
      continue;
    }
    const callRow = callRowOf(call, 0, ORPHAN_SERIES, 'Run');
    if (callRow) {
      roots.push({ row: callRow, children: [] });
    }
  }
  roots.sort(byStart);
  return roots;
}

function flattenInto(nodes: TraceNode[], rows: TraceRow[]) {
  for (const node of nodes) {
    rows.push(node.row);
    flattenInto(node.children, rows);
  }
}

function rowsOf(tree: TraceNode[]) {
  const rows: TraceRow[] = [];
  flattenInto(tree, rows);
  return rows;
}

function endOf(row: TraceRow, now: number) {
  if (row.endedAt !== undefined) {
    return row.endedAt;
  }
  return Math.max(now, row.startedAt);
}

function durationOf(row: TraceRow, now: number) {
  const end = endOf(row, now);
  return end - row.startedAt;
}

function lastEndingBefore(nodes: TraceNode[], cursor: number, now: number) {
  let best: TraceNode | undefined;
  let bestEnd = -Infinity;
  const limit = cursor + HANDOFF_SLACK_MS;
  for (const node of nodes) {
    const end = endOf(node.row, now);
    const fits = end <= limit;
    const isLater = end > bestEnd;
    if (fits && isLater) {
      best = node;
      bestEnd = end;
    }
  }
  return best;
}

/** Walks back from the end: the child that finished last, then the one that finished before it started, and so on. */
function collectCritical(node: TraceNode, now: number, ids: Set<string>) {
  ids.add(node.row.id);
  const remaining = [...node.children];
  let cursor = endOf(node.row, now);
  let next = lastEndingBefore(remaining, cursor, now);
  while (next) {
    collectCritical(next, now, ids);
    cursor = next.row.startedAt;
    const taken = next;
    const index = remaining.indexOf(taken);
    remaining.splice(index, 1);
    next = lastEndingBefore(remaining, cursor, now);
  }
}

function criticalIdsOf(tree: TraceNode[], now: number) {
  const ids = new Set<string>();
  for (const root of tree) {
    collectCritical(root, now, ids);
  }
  return ids;
}

function matchesFilter(
  row: TraceRow,
  filter: Filter,
  slowAfterMs: number,
  now: number
) {
  if (filter === 'errors') {
    return row.status === 'failed';
  }
  if (filter === 'slow') {
    const isCall = row.kind === 'call';
    const isSlow = durationOf(row, now) >= slowAfterMs;
    return isCall && isSlow;
  }
  return true;
}

function matchingRowsOf(
  rows: TraceRow[],
  filter: Filter,
  slowAfterMs: number,
  now: number
) {
  return rows.filter((row) => matchesFilter(row, filter, slowAfterMs, now));
}

/** How many rows a filter keeps at a given moment, counted from the run itself for the announcement. */
function matchingCountOf(
  run: RunSnapshot,
  filter: Filter,
  slowAfterMs: number,
  now: number
) {
  const tree = treeOf(run);
  const rows = rowsOf(tree);
  const matching = matchingRowsOf(rows, filter, slowAfterMs, now);
  return matching.length;
}

function matchesQuery(row: TraceRow, query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  const inName = row.name.toLowerCase().includes(needle);
  const inLabel = row.label.toLowerCase().includes(needle);
  return inName || inLabel;
}

function steppedHorizonOf(elapsed: number) {
  const needed = elapsed + LIVE_MARGIN_MS;
  const horizon = HORIZONS.find((candidate) => candidate >= needed);
  if (horizon !== undefined) {
    return horizon;
  }
  const minutes = Math.ceil(needed / 60000);
  return minutes * 60000;
}

/** The fixed window holds as long as the run fits in it: bars only grow, none of them moves. */
function fixedHorizonOf(spent: number, windowMs: number | undefined) {
  if (windowMs === undefined) {
    return null;
  }
  if (spent > windowMs) {
    return null;
  }
  return windowMs;
}

function horizonOf(
  run: RunSnapshot,
  now: number,
  windowMs: number | undefined
) {
  if (run.startedAt === undefined) {
    return windowMs ?? HORIZONS[0];
  }
  if (run.endedAt !== undefined) {
    const total = run.endedAt - run.startedAt;
    const fixed = fixedHorizonOf(total, windowMs);
    if (fixed !== null) {
      return fixed;
    }
    return Math.max(total, MIN_ZOOM_MS);
  }
  const elapsed = now - run.startedAt;
  const fixed = fixedHorizonOf(elapsed, windowMs);
  if (fixed !== null) {
    return fixed;
  }
  return steppedHorizonOf(elapsed);
}

function tickStepOf(span: number) {
  for (const step of TICK_STEPS) {
    const count = span / step;
    if (count <= MAX_TICKS) {
      return step;
    }
  }
  const minutes = Math.ceil(span / (MAX_TICKS * 60000));
  return minutes * 60000;
}

function ticksOf(timeWindow: TimeWindow) {
  const span = timeWindow.to - timeWindow.from;
  const step = tickStepOf(span);
  const firstIndex = Math.ceil(timeWindow.from / step);
  const ticks: number[] = [];
  for (let tick = firstIndex * step; tick <= timeWindow.to; tick += step) {
    ticks.push(tick);
  }
  return ticks;
}

function tickLabelOf(milliseconds: number) {
  if (milliseconds === 0) {
    return '0';
  }
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  const seconds = milliseconds / 1000;
  const rounded = Number(seconds.toFixed(2));
  return `${rounded}s`;
}

function percentOf(milliseconds: number, timeWindow: TimeWindow) {
  const span = timeWindow.to - timeWindow.from;
  const offset = milliseconds - timeWindow.from;
  return (offset / span) * 100;
}

function tickAlignOf(left: number) {
  if (left < 4) {
    return 'translate-x-0';
  }
  if (left > 96) {
    return '-translate-x-full';
  }
  return '-translate-x-1/2';
}

function clampWindow(timeWindow: TimeWindow, horizon: number): TimeWindow {
  const span = timeWindow.to - timeWindow.from;
  const boundedSpan = Math.min(span, horizon);
  const latestFrom = horizon - boundedSpan;
  const from = Math.min(Math.max(0, timeWindow.from), latestFrom);
  return { from, to: from + boundedSpan };
}

function zoomedIn(timeWindow: TimeWindow, horizon: number) {
  const span = timeWindow.to - timeWindow.from;
  const center = timeWindow.from + span / 2;
  const nextSpan = Math.max(MIN_ZOOM_MS, span / 2);
  const half = nextSpan / 2;
  return clampWindow({ from: center - half, to: center + half }, horizon);
}

function zoomedOut(timeWindow: TimeWindow, horizon: number) {
  const span = timeWindow.to - timeWindow.from;
  const nextSpan = span * 2;
  if (nextSpan >= horizon) {
    return null;
  }
  const center = timeWindow.from + span / 2;
  const half = nextSpan / 2;
  return clampWindow({ from: center - half, to: center + half }, horizon);
}

function panned(timeWindow: TimeWindow, direction: number, horizon: number) {
  const span = timeWindow.to - timeWindow.from;
  const shift = span * 0.2 * direction;
  const moved = { from: timeWindow.from + shift, to: timeWindow.to + shift };
  return clampWindow(moved, horizon);
}

function windowFromBrush(
  brush: Brush,
  width: number,
  timeWindow: TimeWindow,
  horizon: number
) {
  const span = timeWindow.to - timeWindow.from;
  const startPx = Math.min(brush.startX, brush.currentX);
  const endPx = Math.max(brush.startX, brush.currentX);
  const from = timeWindow.from + (startPx / width) * span;
  const to = timeWindow.from + (endPx / width) * span;
  const center = (from + to) / 2;
  const nextSpan = Math.max(MIN_ZOOM_MS, to - from);
  const half = nextSpan / 2;
  return clampWindow({ from: center - half, to: center + half }, horizon);
}

function panDirectionOf(key: string) {
  if (key === 'ArrowLeft') {
    return -1;
  }
  return 1;
}

function brushStyleOf(brush: Brush): React.CSSProperties {
  const left = Math.min(brush.startX, brush.currentX);
  const width = Math.abs(brush.currentX - brush.startX);
  return { left, width };
}

function zoomMessageOf(timeWindow: TimeWindow) {
  const from = tickLabelOf(Math.round(timeWindow.from));
  const to = tickLabelOf(Math.round(timeWindow.to));
  return `Zoomed to ${from} to ${to}`;
}

const FAILED_TINT = 'color-mix(in oklab, var(--destructive) 12%, transparent)';

const FAILED_RING = 'color-mix(in oklab, var(--destructive) 50%, transparent)';

/** The outline of a bar that has one: a failed call, or an agent, whose bar is a light tint. */
function ringColorOf(row: TraceRow) {
  if (row.status === 'failed') {
    return FAILED_RING;
  }
  if (row.kind === 'agent') {
    const series = seriesColorOf(row.series);
    return `color-mix(in oklab, ${series} 45%, transparent)`;
  }
  return null;
}

function fillLookOf(row: TraceRow): React.CSSProperties {
  const series = seriesColorOf(row.series);
  if (row.status === 'failed') {
    return {
      backgroundColor: FAILED_TINT,
      backgroundImage: hatchOf('var(--destructive)', 55),
    };
  }
  if (row.kind === 'agent') {
    return {
      backgroundColor: `color-mix(in oklab, ${series} 18%, transparent)`,
    };
  }
  return { backgroundColor: series };
}

function outlineOf(ring: string | null) {
  if (ring === null) {
    return undefined;
  }
  return `inset 0 0 0 var(--hairline) ${ring}`;
}

/** The fill is cut at the end of the bar, so the clip draws that side of the outline. */
function endOutlineOf(ring: string | null) {
  if (ring === null) {
    return undefined;
  }
  return `inset calc(var(--hairline) * -1) 0 0 0 ${ring}`;
}

/** Without motion nothing travels, so nothing is drawn ahead of the present. */
function leadOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return GROW_STEP_MS;
}

/** A running bar reaches one step past the present: it gets there as the step ends. */
function reachOf(row: TraceRow, now: number, lead: number) {
  if (row.endedAt !== undefined) {
    return row.endedAt;
  }
  const present = Math.max(now, row.startedAt);
  if (row.status === 'running') {
    return present + lead;
  }
  return present;
}

function spanOf(
  row: TraceRow,
  runStart: number,
  timeWindow: TimeWindow,
  now: number,
  lead: number
): BarSpan {
  const startMs = row.startedAt - runStart;
  const reach = reachOf(row, now, lead);
  const endMs = reach - runStart;
  const start = percentOf(startMs, timeWindow);
  const reached = percentOf(endMs, timeWindow);
  const shortest = start + MIN_BAR_PERCENT;
  const end = Math.max(reached, shortest);
  return { start, end };
}

function clipStyleOf(row: TraceRow, span: BarSpan) {
  const offset = span.end - 100;
  const closed = span.start - 100;
  const ring = ringColorOf(row);
  return {
    transform: `translateX(${offset}%)`,
    boxShadow: endOutlineOf(ring),
    '--bar-closed': `${closed}%`,
  } as React.CSSProperties;
}

function fillStyleOf(row: TraceRow, span: BarSpan): React.CSSProperties {
  const width = span.end - span.start;
  const offset = 100 - width;
  const ring = ringColorOf(row);
  return {
    ...fillLookOf(row),
    boxShadow: outlineOf(ring),
    transform: `translateX(${offset}%)`,
  };
}

function labelSideOf(span: BarSpan): LabelSide {
  if (span.end <= 80) {
    return 'after';
  }
  if (span.start >= 20) {
    return 'before';
  }
  return 'inside';
}

function labelOffsetOf(side: LabelSide, span: BarSpan) {
  if (side === 'after') {
    return span.end;
  }
  if (side === 'before') {
    return span.start - 100;
  }
  return 0;
}

function labelStyleOf(side: LabelSide, span: BarSpan) {
  const offset = labelOffsetOf(side, span);
  return {
    transform: `translateX(${offset}%)`,
    '--label-from': `${span.start}%`,
  } as React.CSSProperties;
}

function barMotionOf(isRunning: boolean, isReframing: boolean) {
  const isGrowing = isRunning && !isReframing;
  if (isGrowing) {
    return GROW;
  }
  return GLIDE;
}

/**
 * True from the render where the time window changes until the next tick of the clock, so a running
 * bar glides to the new scale with the others instead of crawling there.
 */
function useReframing(timeWindow: TimeWindow, now: number) {
  const windowKey = `${timeWindow.from}:${timeWindow.to}`;
  const [reframe, setReframe] = useState<Reframe>({ windowKey, at: null });
  const hasNewWindow = reframe.windowKey !== windowKey;
  if (hasNewWindow) {
    setReframe({ windowKey, at: now });
  }
  return reframe.at === now;
}

function dimOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-30';
  }
  return 'opacity-100';
}

function tabIndexOf(isTabbable: boolean) {
  if (isTabbable) {
    return 0;
  }
  return -1;
}

function tabbableIdOf(activeId: string | null, visibleIds: string[]) {
  const isActiveVisible = activeId !== null && visibleIds.includes(activeId);
  if (isActiveVisible) {
    return activeId;
  }
  return visibleIds[0] ?? null;
}

function callCountOf(run: RunSnapshot) {
  const count = run.calls.length;
  if (count === 1) {
    return '1 call';
  }
  return `${count} calls`;
}

function rowCountOf(count: number) {
  if (count === 1) {
    return '1 row';
  }
  return `${count} rows`;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return text;
  }
  const start = text.toLowerCase().indexOf(needle);
  if (start === -1) {
    return text;
  }
  const end = start + needle.length;
  const before = text.slice(0, start);
  const match = text.slice(start, end);
  const after = text.slice(end);
  return (
    <>
      {before}
      <mark className='bg-primary/15 text-foreground rounded-[3px]'>
        {match}
      </mark>
      {after}
    </>
  );
}

function IndentGuides({ depth }: { depth: number }) {
  const levels = Array.from({ length: depth }, (_, level) => level);
  const width = depth * INDENT_PX;

  return (
    <span
      aria-hidden='true'
      className='relative shrink-0 self-stretch'
      style={{ width }}
    >
      {levels.map((level) => (
        <span
          key={level}
          className='bg-border absolute inset-y-0 w-(--hairline)'
          style={{ left: level * INDENT_PX + 5 }}
        />
      ))}
    </span>
  );
}

function RowName({ row, query }: { row: TraceRow; query: string }) {
  const dotStyle = { backgroundColor: seriesColorOf(row.series) };

  if (row.kind === 'agent') {
    return (
      <span className='flex min-w-0 items-center gap-1.5'>
        <span className='size-2 shrink-0 rounded-full' style={dotStyle} />
        <span className='truncate text-[13px] font-medium'>
          <Highlighted text={row.name} query={query} />
        </span>
      </span>
    );
  }
  return (
    <span className='min-w-0 truncate font-mono text-xs'>
      <Highlighted text={row.name} query={query} />
    </span>
  );
}

function GridLines({
  ticks,
  timeWindow,
}: {
  ticks: number[];
  timeWindow: TimeWindow;
}) {
  return (
    <>
      {ticks.map((tick) => {
        const offset = percentOf(tick, timeWindow);
        return (
          <span
            key={tick}
            aria-hidden='true'
            className={cn(
              'border-foreground/[0.05] hairline-l absolute inset-0',
              GLIDE
            )}
            style={{ transform: `translateX(${offset}%)` }}
          />
        );
      })}
    </>
  );
}

type TraceBarProps = {
  row: TraceRow;
  runStart: number;
  timeWindow: TimeWindow;
  isDimmed: boolean;
};

function TraceBar({ row, runStart, timeWindow, isDimmed }: TraceBarProps) {
  const isRunning = row.status === 'running';
  const shouldReduceMotion = usePrefersReducedMotion();
  const now = useLiveNow(GROW_STEP_MS, isRunning);
  const isReframing = useReframing(timeWindow, now);
  const lead = leadOf(shouldReduceMotion);
  const span = spanOf(row, runStart, timeWindow, now, lead);
  const side = labelSideOf(span);
  const followsEnd = side === 'after' && isRunning;
  const travel = barMotionOf(isRunning, isReframing);

  return (
    <span
      className={cn(
        'absolute inset-0 transition-opacity duration-300',
        dimOf(isDimmed)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(BAR_CLIP, isRunning && CLIP_BIRTH, travel)}
        style={clipStyleOf(row, span)}
      >
        <span
          className={cn(BAR_FILL, isRunning && FILL_BIRTH, travel)}
          style={fillStyleOf(row, span)}
        />
      </span>
      <span
        key={side}
        className={cn(LABEL_LANE[side], followsEnd && LABEL_BIRTH, travel)}
        style={labelStyleOf(side, span)}
      >
        <LiveDuration
          item={row}
          isRunning={isRunning}
          className='text-muted-foreground text-[11px] whitespace-nowrap'
        />
      </span>
    </span>
  );
}

type PlayheadProps = {
  runStart: number;
  timeWindow: TimeWindow;
};

/** The present, as a line that crosses the rows: it travels one step at a time, like the running bars it leads. */
function Playhead({ runStart, timeWindow }: PlayheadProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const now = useLiveNow(GROW_STEP_MS, true);
  const present = Math.max(now, runStart);
  const elapsed = present - runStart;
  const lead = leadOf(shouldReduceMotion);
  const ahead = elapsed + lead;
  const from = percentOf(elapsed, timeWindow);
  const to = percentOf(ahead, timeWindow);
  const style = {
    transform: `translateX(${to}%)`,
    '--playhead-from': `${from}%`,
  } as React.CSSProperties;

  return (
    <span
      className={cn(
        'absolute inset-0 starting:[transform:translateX(var(--playhead-from))]',
        GROW
      )}
      style={style}
    >
      <span className='bg-primary/70 absolute inset-y-0 start-0 w-px' />
    </span>
  );
}

function DetailMeta({ row, runStart }: { row: TraceRow; runStart: number }) {
  const offset = row.startedAt - runStart;
  const startedAt = tickLabelOf(Math.round(offset));
  const isRunning = row.status === 'running';

  return (
    <dl className='text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs'>
      <dt>Agent</dt>
      <dd className='text-foreground'>{row.agentName}</dd>
      <dt>Started</dt>
      <dd className='text-foreground tabular-nums'>at {startedAt}</dd>
      <dt>Took</dt>
      <dd className='text-foreground'>
        <LiveDuration item={row} isRunning={isRunning} />
      </dd>
      {row.model && (
        <>
          <dt>Model</dt>
          <dd className='text-foreground'>{row.model}</dd>
        </>
      )}
    </dl>
  );
}

function RowDetail({ row, runStart }: { row: TraceRow; runStart: number }) {
  const hasInput = row.input !== undefined;
  const hasOutput = row.output !== undefined;
  const isFailed = row.status === 'failed';

  return (
    <div className='bg-card relative flex flex-col gap-3 px-2 pt-1 pb-3'>
      <p className='text-[13px] leading-5'>{row.label}</p>
      <DetailMeta row={row} runStart={runStart} />
      {hasInput && (
        <div>
          <p className='text-muted-foreground mb-1 text-xs font-medium'>
            Input
          </p>
          <JsonView value={row.input} />
        </div>
      )}
      {hasOutput && (
        <div>
          <p className='text-muted-foreground mb-1 text-xs font-medium'>
            Output
          </p>
          <JsonView value={row.output} />
        </div>
      )}
      {isFailed && (
        <div>
          <p className='text-muted-foreground mb-1 text-xs font-medium'>
            Error
          </p>
          <p className='bg-destructive/10 text-destructive-ink rounded-lg p-2.5 font-mono text-xs leading-relaxed'>
            {row.error}
          </p>
        </div>
      )}
    </div>
  );
}

const ROW_GRID = 'grid grid-cols-[7.5rem_1fr] @lg:grid-cols-[10rem_1fr]';

/** Where the time column of `ROW_GRID` starts, for what is drawn across every row at once. */
const TIME_COLUMN = 'start-[7.5rem] @lg:start-[10rem]';

type TraceRowItemProps = {
  row: TraceRow;
  runStart: number;
  timeWindow: TimeWindow;
  ticks: number[];
  query: string;
  isOpen: boolean;
  isDimmed: boolean;
  tabIndex: number;
  onToggle: (rowId: string) => void;
  onFocusRow: (rowId: string) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    row: TraceRow
  ) => void;
  registerButton: (rowId: string, node: HTMLButtonElement | null) => void;
};

function TraceRowItem({
  row,
  runStart,
  timeWindow,
  ticks,
  query,
  isOpen,
  isDimmed,
  tabIndex,
  onToggle,
  onFocusRow,
  onKeyDown,
  registerButton,
}: TraceRowItemProps) {
  const detailId = `trace-detail-${row.id}`;
  const statusWord = STATUS_WORD[row.status];

  return (
    <div>
      <button
        ref={(node) => registerButton(row.id, node)}
        type='button'
        tabIndex={tabIndex}
        aria-expanded={isOpen}
        aria-controls={detailId}
        onClick={() => onToggle(row.id)}
        onFocus={() => onFocusRow(row.id)}
        onKeyDown={(event) => onKeyDown(event, row)}
        className={cn(
          ROW_GRID,
          'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 aria-expanded:bg-foreground/[0.03] h-8 w-full cursor-pointer items-center rounded-md text-start outline-none focus-visible:ring-[3px]'
        )}
      >
        <span className='flex h-full min-w-0 items-center gap-1 ps-2 pe-2'>
          <IndentGuides depth={row.depth} />
          <RowName row={row} query={query} />
          <span className='sr-only'>
            , {row.label}, {statusWord}
          </span>
        </span>
        <span className='relative h-full min-w-0 overflow-hidden'>
          <GridLines ticks={ticks} timeWindow={timeWindow} />
          <TraceBar
            row={row}
            runStart={runStart}
            timeWindow={timeWindow}
            isDimmed={isDimmed}
          />
        </span>
      </button>
      <Fold open={isOpen} id={detailId}>
        <RowDetail row={row} runStart={runStart} />
      </Fold>
    </div>
  );
}

type AxisProps = {
  ticks: number[];
  timeWindow: TimeWindow;
  horizon: number;
  isZoomed: boolean;
  onZoom: (timeWindow: TimeWindow | null, message: string) => void;
};

function TimeAxis({ ticks, timeWindow, horizon, isZoomed, onZoom }: AxisProps) {
  const [brush, setBrush] = useState<Brush | null>(null);

  function positionOf(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - rect.left;
    return Math.min(Math.max(0, offset), rect.width);
  }

  function startBrush(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const x = positionOf(event);
    setBrush({ startX: x, currentX: x });
  }

  function moveBrush(event: React.PointerEvent<HTMLDivElement>) {
    if (!brush) {
      return;
    }
    const x = positionOf(event);
    setBrush({ ...brush, currentX: x });
  }

  function endBrush(event: React.PointerEvent<HTMLDivElement>) {
    if (!brush) {
      return;
    }
    const width = event.currentTarget.getBoundingClientRect().width;
    const draggedPx = Math.abs(brush.currentX - brush.startX);
    setBrush(null);
    if (draggedPx < MIN_BRUSH_PX) {
      return;
    }
    const next = windowFromBrush(brush, width, timeWindow, horizon);
    onZoom(next, zoomMessageOf(next));
  }

  function cancelBrush() {
    setBrush(null);
  }

  function zoomFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isZoomIn = event.key === '+' || event.key === '=';
    if (isZoomIn) {
      event.preventDefault();
      const next = zoomedIn(timeWindow, horizon);
      onZoom(next, zoomMessageOf(next));
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      const next = zoomedOut(timeWindow, horizon);
      if (next) {
        onZoom(next, zoomMessageOf(next));
        return;
      }
      onZoom(null, 'Zoom reset');
      return;
    }
    const isPan = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    if (isPan && isZoomed) {
      event.preventDefault();
      const direction = panDirectionOf(event.key);
      const next = panned(timeWindow, direction, horizon);
      onZoom(next, zoomMessageOf(next));
      return;
    }
    const isReset = event.key === '0' || event.key === 'Escape';
    if (isReset && isZoomed) {
      event.preventDefault();
      onZoom(null, 'Zoom reset');
    }
  }

  return (
    <div
      tabIndex={0}
      role='group'
      aria-label='Time axis. Drag across it to zoom, or press plus and minus. Arrows move the zoomed range.'
      onPointerDown={startBrush}
      onPointerMove={moveBrush}
      onPointerUp={endBrush}
      onPointerCancel={cancelBrush}
      onKeyDown={zoomFromKeys}
      className='focus-visible:ring-ring/25 relative h-7 cursor-crosshair touch-none overflow-hidden rounded-md outline-none select-none focus-visible:ring-[3px]'
    >
      {ticks.map((tick) => {
        const offset = percentOf(tick, timeWindow);
        return (
          <span
            key={tick}
            className='absolute inset-x-0 top-1.5 transition-[transform,opacity] duration-300 ease-(--ease-in-out-strong) motion-reduce:transition-none starting:opacity-0'
            style={{ transform: `translateX(${offset}%)` }}
          >
            <span
              className={cn(
                'text-muted-foreground absolute start-0 top-0 text-[11px] tabular-nums',
                tickAlignOf(offset)
              )}
            >
              {tickLabelOf(tick)}
            </span>
          </span>
        );
      })}
      {brush && (
        <span
          aria-hidden='true'
          className='bg-primary/10 border-primary/50 hairline-x absolute inset-y-0'
          style={brushStyleOf(brush)}
        />
      )}
    </div>
  );
}

function ZoomControl({
  isZoomed,
  onReset,
}: {
  isZoomed: boolean;
  onReset: () => void;
}) {
  const swapKey = String(isZoomed);

  return (
    <Swap swapKey={swapKey} className='h-7'>
      {isZoomed && (
        <Button type='button' variant='secondary' size='sm' onClick={onReset}>
          <ZoomOutIcon />
          Reset zoom
        </Button>
      )}
      {!isZoomed && (
        <span className='text-muted-foreground text-xs'>
          Drag across the time axis to zoom
        </span>
      )}
    </Swap>
  );
}

function shownCriticalIdsOf(tree: TraceNode[], now: number, isShown: boolean) {
  if (!isShown) {
    return null;
  }
  return criticalIdsOf(tree, now);
}

/** True once a live run has lasted longer than its fixed window: from then on the axis follows the clock. */
function useHasOutlasted(run: RunSnapshot, windowMs: number | undefined) {
  const [outlastedStart, setOutlastedStart] = useState<number | null>(null);
  const startedAt = run.startedAt;
  const isRunning = run.status === 'running';

  useEffect(() => {
    if (windowMs === undefined) {
      return;
    }
    if (startedAt === undefined) {
      return;
    }
    if (!isRunning) {
      return;
    }
    const endsAt = startedAt + windowMs;
    const left = endsAt - Date.now();
    const delay = Math.max(0, left);
    const timer = setTimeout(() => setOutlastedStart(startedAt), delay);
    return () => clearTimeout(timer);
  }, [windowMs, startedAt, isRunning]);

  return outlastedStart === startedAt;
}

export type TraceWaterfallProps = {
  run: RunSnapshot;
  slowAfterMs?: number;
  /**
   * How long the time axis spans from the start of the run. While the run fits in it the window
   * holds still and bars only grow. Without it the axis stretches as the run goes on.
   */
  windowMs?: number;
  className?: string;
};

export function TraceWaterfall({
  run,
  slowAfterMs = 1500,
  windowMs,
  className,
}: TraceWaterfallProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [isCriticalShown, setIsCriticalShown] = useState(false);
  const [zoom, setZoom] = useState<TimeWindow | null>(null);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const fade = fadePresence();
  const isRunning = run.status === 'running';
  const hasOutlasted = useHasOutlasted(run, windowMs);
  const hasFixedWindow = windowMs !== undefined;
  const followsClock = !hasFixedWindow || hasOutlasted;
  const watchesRows = filter === 'slow' || isCriticalShown;
  const needsClock = followsClock || watchesRows;
  const isTicking = isRunning && needsClock;
  const now = useLiveNow(1000, isTicking);
  const runStart = run.startedAt ?? now;
  const horizon = horizonOf(run, now, windowMs);
  const fullWindow = { from: 0, to: horizon };
  const timeWindow = zoom ?? fullWindow;
  const windowKey = `${timeWindow.from}:${timeWindow.to}`;
  const isZoomed = zoom !== null;
  const ticks = ticksOf(timeWindow);
  const tree = treeOf(run);
  const allRows = rowsOf(tree);
  const criticalIds = shownCriticalIdsOf(tree, now, isCriticalShown);
  const filteredRows = matchingRowsOf(allRows, filter, slowAfterMs, now);
  const visibleRows = filteredRows.filter((row) => matchesQuery(row, query));
  const visibleIds = visibleRows.map((row) => row.id);
  const tabbableId = tabbableIdOf(activeId, visibleIds);
  const hasRows = allRows.length > 0;
  const hasVisibleRows = visibleRows.length > 0;
  const isFilteredEmpty = hasRows && !hasVisibleRows;
  const hasQuery = query !== '';
  const isFiltered = filter !== 'all' || query.trim() !== '';
  const statusLook = RUN_STATUS_LOOK[run.status];
  const runSpan = { startedAt: run.startedAt, endedAt: run.endedAt };
  const hasStarted = run.startedAt !== undefined;
  const showsPlayhead = isRunning && hasStarted;

  function registerButton(rowId: string, node: HTMLButtonElement | null) {
    if (node) {
      buttons.current.set(rowId, node);
      return;
    }
    buttons.current.delete(rowId);
  }

  function focusRow(rowId: string | undefined) {
    if (rowId === undefined) {
      return;
    }
    buttons.current.get(rowId)?.focus();
  }

  function toggleRow(rowId: string) {
    const isOpen = openIds.includes(rowId);
    if (isOpen) {
      setOpenIds(openIds.filter((id) => id !== rowId));
      return;
    }
    setOpenIds([...openIds, rowId]);
  }

  function closeRow(rowId: string) {
    setOpenIds(openIds.filter((id) => id !== rowId));
  }

  function moveFromKeys(
    event: React.KeyboardEvent<HTMLButtonElement>,
    row: TraceRow
  ) {
    const index = visibleIds.indexOf(row.id);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusRow(visibleIds[index + 1]);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusRow(visibleIds[index - 1]);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusRow(visibleIds[0]);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = visibleIds.length - 1;
      focusRow(visibleIds[lastIndex]);
      return;
    }
    const isOpen = openIds.includes(row.id);
    const isEscape = event.key === 'Escape';
    if (isEscape && isOpen) {
      event.preventDefault();
      closeRow(row.id);
    }
  }

  function changeFilter(next: Filter) {
    setFilter(next);
    const pickedAt = Date.now();
    const matching = matchingCountOf(run, next, slowAfterMs, pickedAt);
    const count = rowCountOf(matching);
    setMessage(`Showing ${FILTER_WORD[next]}, ${count}`);
  }

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearQueryFromKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && hasQuery) {
      event.preventDefault();
      setQuery('');
    }
  }

  function clearQuery() {
    setQuery('');
  }

  function clearFilters() {
    setFilter('all');
    setQuery('');
    setMessage('Showing every call');
  }

  function toggleCritical(pressed: boolean) {
    setIsCriticalShown(pressed);
    if (pressed) {
      setMessage('Critical path shown, other calls faded');
      return;
    }
    setMessage('Critical path hidden');
  }

  function changeZoom(next: TimeWindow | null, zoomMessage: string) {
    setZoom(next);
    setMessage(zoomMessage);
  }

  function resetZoom() {
    changeZoom(null, 'Zoom reset');
  }

  function isDimmed(row: TraceRow) {
    if (criticalIds === null) {
      return false;
    }
    return !criticalIds.has(row.id);
  }

  return (
    <section
      aria-label={`Trace of ${run.title}`}
      className={cn(
        'bg-card hairline-ring ring-border @container flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-4',
        className
      )}
    >
      <header className='flex items-start justify-between gap-3 px-1'>
        <div className='min-w-0'>
          <h3 className='truncate text-sm font-medium'>{run.title}</h3>
          <p className='text-muted-foreground flex items-center gap-2 text-xs tabular-nums'>
            <span>{callCountOf(run)}</span>
            {hasStarted && (
              <LiveDuration item={runSpan} isRunning={isRunning} />
            )}
          </p>
        </div>
        <Badge variant={statusLook.variant}>
          <Swap swapKey={run.status}>{statusLook.label}</Swap>
        </Badge>
      </header>

      <div className='flex flex-wrap items-center gap-2'>
        <Segments
          value={filter}
          segments={FILTERS}
          onValueChange={changeFilter}
          label='Show calls'
        />
        <Toggle
          size='sm'
          variant='outline'
          pressed={isCriticalShown}
          onPressedChange={toggleCritical}
          className='h-7 rounded-lg px-2.5 text-xs'
        >
          Critical path
        </Toggle>
        <div className='relative min-w-40 flex-1'>
          <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2' />
          <Input
            type='search'
            size='sm'
            value={query}
            onChange={changeQuery}
            onKeyDown={clearQueryFromKeys}
            placeholder='Search calls'
            aria-label='Search calls'
            className='ps-7 pe-7'
          />
          {hasQuery && (
            <button
              type='button'
              aria-label='Clear the search'
              onClick={clearQuery}
              className='text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus-visible:ring-ring/25 absolute end-1 top-1/2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[5px] outline-none focus-visible:ring-[3px]'
            >
              <XIcon className='size-3' />
            </button>
          )}
        </div>
      </div>

      <div className='flex flex-1 flex-col'>
        <div className={cn(ROW_GRID, 'items-center')}>
          <span className='text-muted-foreground ps-2 text-xs'>Call</span>
          <TimeAxis
            ticks={ticks}
            timeWindow={timeWindow}
            horizon={horizon}
            isZoomed={isZoomed}
            onZoom={changeZoom}
          />
        </div>
        <div className='relative'>
          <div
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute inset-y-0 end-0 overflow-hidden',
              TIME_COLUMN
            )}
          >
            <AnimatePresence initial={false}>
              {showsPlayhead && (
                <motion.div
                  key={windowKey}
                  className='absolute inset-0'
                  {...fade}
                >
                  <Playhead runStart={runStart} timeWindow={timeWindow} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ul aria-label='Calls on the time axis' className='flex flex-col'>
            <AnimatePresence initial={false}>
              {visibleRows.map((row) => (
                <motion.li
                  key={row.id}
                  className='overflow-hidden'
                  {...rowPresence}
                >
                  <TraceRowItem
                    row={row}
                    runStart={runStart}
                    timeWindow={timeWindow}
                    ticks={ticks}
                    query={query}
                    isOpen={openIds.includes(row.id)}
                    isDimmed={isDimmed(row)}
                    tabIndex={tabIndexOf(row.id === tabbableId)}
                    onToggle={toggleRow}
                    onFocusRow={setActiveId}
                    onKeyDown={moveFromKeys}
                    registerButton={registerButton}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
        {!hasRows && (
          <p className='text-muted-foreground px-2 py-6 text-center text-[13px]'>
            The trace fills in as the run makes its first call
          </p>
        )}
        {isFilteredEmpty && (
          <div className='flex flex-col items-center gap-2 px-2 py-6 text-center'>
            <p className='text-muted-foreground text-[13px]'>
              No call matches these filters
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={clearFilters}
            >
              Show every call
            </Button>
          </div>
        )}
      </div>

      <div className='flex min-h-7 items-center justify-between gap-2 px-1'>
        <ZoomControl isZoomed={isZoomed} onReset={resetZoom} />
        {isFiltered && (
          <span className='text-muted-foreground text-xs tabular-nums'>
            {rowCountOf(visibleRows.length)}
          </span>
        )}
      </div>
      <LiveRegion message={message} />
    </section>
  );
}

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-trace',
  title: RUN_TITLE,
  agents: [
    { ...PLANNER, task: 'Plan the quarterly review and check the result' },
    { ...RESEARCHER, task: 'Gather what Brightmoor charged and lists in Q3' },
    { ...WRITER, task: 'Compare the prices and draft the email' },
  ],
});

function callStart(
  id: string,
  agentId: string,
  tool: string,
  label: string,
  input: Record<string, unknown>
): RunEvent {
  return {
    type: 'call.started',
    call: { id, agentId, tool, label, input, status: 'running' },
  };
}

function callDone(id: string, output: unknown): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'done', output } };
}

function agentState(id: string, status: 'running' | 'done'): RunEvent {
  return { type: 'agent.updated', id, patch: { status } };
}

const PAGE_FAILED: RunEvent = {
  type: 'call.updated',
  id: 'page',
  patch: { status: 'failed', error: PAGE_ERROR },
};

const SCRIPT: RunStep[] = [
  batch(500, { type: 'run.started' }, agentState('planner', 'running')),
  batch(
    150,
    callStart(
      'plan',
      'planner',
      'plan_review',
      'Split the review into research and writing',
      { vendor: 'Brightmoor Supply', quarter: 'Q3' }
    )
  ),
  batch(
    500,
    callDone('plan', { steps: 4, agents: 2 }),
    agentState('researcher', 'running')
  ),
  batch(
    100,
    callStart(
      'search',
      'researcher',
      'web_search',
      'Searched the web for Brightmoor prices',
      SEARCH_INPUT
    )
  ),
  batch(
    120,
    callStart(
      'sheet',
      'researcher',
      'read_sheet',
      'Read the Q3 invoices spreadsheet',
      SHEET_INPUT
    )
  ),
  batch(
    1000,
    callDone('search', SEARCH_OUTPUT),
    callStart(
      'page',
      'researcher',
      'fetch_page',
      'Read the Brightmoor pricing page',
      PAGE_INPUT
    )
  ),
  batch(350, callDone('sheet', SHEET_OUTPUT)),
  batch(450, PAGE_FAILED),
  batch(
    300,
    callStart(
      'page-again',
      'researcher',
      'fetch_page',
      'Read the pricing page again',
      PAGE_INPUT
    )
  ),
  batch(
    900,
    callDone('page-again', PAGE_OUTPUT),
    agentState('researcher', 'done')
  ),
  batch(100, agentState('writer', 'running')),
  batch(
    150,
    callStart(
      'script',
      'writer',
      'run_script',
      'Compared invoice lines with the price list',
      SCRIPT_INPUT
    )
  ),
  batch(
    3200,
    callDone('script', SCRIPT_OUTPUT),
    callStart(
      'email',
      'writer',
      'draft_email',
      'Drafted the email to Brightmoor accounts',
      EMAIL_INPUT
    )
  ),
  batch(1000, callDone('email', EMAIL_OUTPUT), agentState('writer', 'done')),
  batch(
    100,
    callStart(
      'check',
      'planner',
      'check_totals',
      'Checked the totals against the invoices',
      { invoices: 117, overpaid: 1840.2 }
    )
  ),
  batch(
    400,
    callDone('check', { matches: true }),
    agentState('planner', 'done'),
    { type: 'run.finished', status: 'done' }
  ),
];

/** The run takes about nine seconds, so every bar of the demo fits in a window that never moves. */
const WINDOW_MS = 10_000;

const SESSION = {
  reducer: reduceBatch,
  initial: INITIAL_RUN,
  resting: restingOf(INITIAL_RUN, SCRIPT, applyBatchAt),
  script: SCRIPT,
  loopAfter: 3000,
};

export default function Run02() {
  const { ref, isInView, isAutoplaying, state, isFinished, restart } =
    useSession(SESSION);
  const canReplay = isFinished && !isAutoplaying;

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='@container flex w-full max-w-[45rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <TraceWaterfall
          run={state}
          windowMs={WINDOW_MS}
          className='min-h-[36.5rem] @lg:min-h-[34rem]'
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
    </div>
  );
}
