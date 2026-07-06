'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLayoutEffect, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  emptyRun,
  pendingApprovalsOf,
  seriesColorOf,
  type ApprovalRequest,
  type RunAgent,
  type RunEvent,
  type RunSnapshot,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { CheckIcon, HandIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import {
  applyBatchAt,
  batch,
  batchOf,
  reduceBatch,
  restingOf,
  type RunStep,
} from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  ClockGate,
  LiveDuration,
  useLiveNow,
} from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import {
  AGENT_STATUS_WORD,
  AgentStatusDot,
  pulsingIdsOf,
} from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import {
  CODER,
  PLANNER,
  RESEARCHER,
  REVIEWER,
  RUN_TITLE,
  WRITER,
} from './_parts/crew';
import { DECIDE_AFTER_MS } from './_parts/demo';

type Orientation = 'across' | 'down';

/** Under this width the lanes stand side by side and time runs down. */
const WIDE_PX = 560;

const LANE_PX = 44;

const DOWN_HEIGHT_PX = 300;

const DEFAULT_WINDOW_MS = 24_000;

/** The demonstration takes about sixteen seconds with its approval: the whole run fits, so no lane ever moves. */
const DEMO_WINDOW_MS = 18_000;

/** Tasks that left the window a moment ago stay mounted while the lagging track carries them out. */
const KEEP_MS = 2500;

/**
 * The now line is drawn one step ahead and travels there at a constant speed, so one transition
 * plays per step. `GROW` below lasts exactly as long.
 */
const GROW_STEP_MS = 1000;

const GROW =
  'transition-transform duration-1000 ease-linear motion-reduce:transition-none';

const GLIDE =
  'transition-transform duration-300 ease-(--ease-in-out-strong) motion-reduce:transition-none';

const HATCH_WAITING: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--warning) 16%, transparent)',
  backgroundImage: hatchOf('var(--warning)', 60),
};

function orientationOf(isWide: boolean): Orientation {
  if (isWide) {
    return 'across';
  }
  return 'down';
}

/** The lanes turn with their own width, never with the window: a narrow tile on a wide screen runs down too. */
function useOrientation() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [isWide, setIsWide] = useState(true);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const isWideEnough = entry.contentRect.width >= WIDE_PX;
      setIsWide(isWideEnough);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { setElement, orientation: orientationOf(isWide) };
}

/** Without motion nothing travels, so nothing is drawn ahead of the present. */
function leadOf(isLive: boolean, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  if (isLive) {
    return GROW_STEP_MS;
  }
  return 0;
}

function travelOf(isLive: boolean) {
  if (isLive) {
    return GROW;
  }
  return GLIDE;
}

type Frame = {
  origin: number;
  time: number;
  windowMs: number;
};

/** Where a moment sits on the track, in percent of the window from the start of the run. */
function alongOf(frame: Frame, time: number) {
  const offset = time - frame.origin;
  const ratio = offset / frame.windowMs;
  return ratio * 100;
}

function spanOf(frame: Frame, from: number, to: number) {
  const span = to - from;
  const ratio = span / frame.windowMs;
  return ratio * 100;
}

function livedOf(frame: Frame) {
  const lived = frame.time - frame.origin;
  return Math.max(0, lived);
}

/** How far the run has outgrown the window, in percent of it. While the run fits, nothing drifts. */
function driftOf(frame: Frame) {
  const lived = livedOf(frame);
  const overflow = Math.max(0, lived - frame.windowMs);
  const ratio = overflow / frame.windowMs;
  return ratio * 100;
}

/** Where the now line stands in the window, in percent. It stops at the far edge once the lanes drift. */
function nowShareOf(frame: Frame) {
  const lived = livedOf(frame);
  const shown = Math.min(lived, frame.windowMs);
  const ratio = shown / frame.windowMs;
  return ratio * 100;
}

function trackStyleOf(
  frame: Frame,
  orientation: Orientation
): React.CSSProperties {
  const drift = driftOf(frame);
  if (orientation === 'down') {
    return { transform: `translateY(${-drift}%)` };
  }
  return { transform: `translateX(${-drift}%)` };
}

function coverStyleOf(
  frame: Frame,
  orientation: Orientation
): React.CSSProperties {
  const share = nowShareOf(frame);
  if (orientation === 'down') {
    return { transform: `translateY(${share}%)` };
  }
  return { transform: `translateX(${share}%)` };
}

function placeOf(
  orientation: Orientation,
  start: number,
  size: number
): React.CSSProperties {
  if (orientation === 'down') {
    return { top: `${start}%`, height: `${size}%` };
  }
  return { left: `${start}%`, width: `${size}%` };
}

/**
 * What is still open (a running task, a request that waits) is drawn to the end of the window after
 * the one being filled. The cover ahead of the now line hides the part not lived yet, so its growing
 * end is the now line itself, and its own box changes once per window instead of once per tick.
 */
function openEndOf(frame: Frame) {
  const lived = livedOf(frame);
  const windowsLived = Math.floor(lived / frame.windowMs);
  const windowsDrawn = windowsLived + 2;
  return frame.origin + windowsDrawn * frame.windowMs;
}

function endOf(task: ToolCall, frame: Frame) {
  if (task.endedAt !== undefined) {
    return task.endedAt;
  }
  return openEndOf(frame);
}

function isInWindow(task: ToolCall, frame: Frame) {
  const end = endOf(task, frame);
  const windowStart = frame.time - frame.windowMs - KEEP_MS;
  return end >= windowStart;
}

function tintOf(task: ToolCall) {
  if (task.status === 'running') {
    return 20;
  }
  return 13;
}

function startEdgeOf(orientation: Orientation, color: string) {
  if (orientation === 'down') {
    return `inset 0 2px 0 ${color}`;
  }
  return `inset 2px 0 0 ${color}`;
}

function barStyleOf(
  task: ToolCall,
  series: SeriesSlot,
  orientation: Orientation
): React.CSSProperties {
  const color = seriesColorOf(series);
  const tint = tintOf(task);
  const startEdge = startEdgeOf(orientation, color);
  return {
    backgroundColor: `color-mix(in oklab, ${color} ${tint}%, transparent)`,
    boxShadow: `${startEdge}, inset 0 0 0 var(--hairline) color-mix(in oklab, ${color} 40%, transparent)`,
  };
}

function laneStyleOf(
  orientation: Orientation,
  index: number,
  count: number
): React.CSSProperties {
  if (orientation === 'down') {
    const share = 100 / count;
    const left = index * share;
    return { left: `${left}%`, width: `${share}%`, top: 0, bottom: 0 };
  }
  const top = index * LANE_PX;
  return { top, height: LANE_PX, left: 0, right: 0 };
}

const BAR_INSET: Record<Orientation, string> = {
  across: 'inset-y-2',
  down: 'inset-x-1.5',
};

function TaskBar({
  task,
  agent,
  frame,
  orientation,
  isLive,
}: {
  task: ToolCall;
  agent: RunAgent;
  frame: Frame;
  orientation: Orientation;
  isLive: boolean;
}) {
  const start = task.startedAt ?? frame.time;
  const end = endOf(task, frame);
  const along = alongOf(frame, start);
  const size = spanOf(frame, start, end);
  const place = placeOf(orientation, along, size);
  const isRunning = task.status === 'running';
  const isTicking = isRunning && isLive;
  const label = `${task.label}, ${agent.name}`;
  const barStyle = barStyleOf(task, agent.series, orientation);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type='button'
            aria-label={label}
            className={cn(
              'focus-visible:ring-ring/40 absolute flex min-w-1 cursor-default items-center overflow-hidden rounded-md text-start outline-none focus-visible:z-10 focus-visible:ring-[3px]',
              BAR_INSET[orientation]
            )}
            style={{ ...place, ...barStyle }}
          />
        }
      >
        {orientation === 'across' && (
          <span className='text-foreground/80 truncate px-2 text-[11px] leading-none font-medium'>
            {task.label}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent align='start'>
        <span className='block'>{task.label}</span>
        <span className='text-muted-foreground block font-normal tabular-nums'>
          <LiveDuration item={task} isRunning={isTicking} />
          {isRunning && ', still running'}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function WaitingHatch({
  approval,
  frame,
  orientation,
}: {
  approval: ApprovalRequest;
  frame: Frame;
  orientation: Orientation;
}) {
  const start = approval.requestedAt ?? frame.time;
  const openEnd = openEndOf(frame);
  const end = approval.resolvedAt ?? openEnd;
  const along = alongOf(frame, start);
  const size = spanOf(frame, start, end);
  const place = placeOf(orientation, along, size);

  return (
    <span
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute rounded-md',
        BAR_INSET[orientation]
      )}
      style={{ ...place, ...HATCH_WAITING }}
    />
  );
}

function markerPlaceOf(
  orientation: Orientation,
  along: number
): React.CSSProperties {
  if (orientation === 'down') {
    return { top: `${along}%`, left: 2, transform: 'translateY(-50%)' };
  }
  return { left: `${along}%`, top: 2, transform: 'translateX(-50%)' };
}

function ApprovalMarker({
  approval,
  agent,
  frame,
  orientation,
  isPressed,
  onApprove,
}: {
  approval: ApprovalRequest;
  agent: RunAgent;
  frame: Frame;
  orientation: Orientation;
  isPressed: boolean;
  onApprove?: (approvalId: string) => void;
}) {
  const fade = fadePresence();
  const requestedAt = approval.requestedAt ?? frame.time;
  const along = alongOf(frame, requestedAt);
  const isPending = approval.status === 'pending';
  const label = markerLabelOf(approval, agent);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type='button'
            aria-label={label}
            className={cn(
              'surface-raised focus-visible:ring-ring absolute z-20 flex size-5 cursor-pointer items-center justify-center rounded-md transition-[scale,background-color] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.97] [&_svg]:size-3',
              isPending && 'text-warning-foreground',
              !isPending && 'text-success-foreground',
              pressedQuietOf(isPressed)
            )}
            style={markerPlaceOf(orientation, along)}
          />
        }
      >
        <Swap swapKey={approval.status}>
          {isPending && <HandIcon />}
          {!isPending && <CheckIcon />}
        </Swap>
      </PopoverTrigger>
      <PopoverContent side='top' className='w-64 p-3'>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={approval.status}
              className='flex flex-col gap-2.5'
              {...fade}
            >
              <PopoverTitle className='flex items-center gap-2 text-[13px] leading-5'>
                <AgentTile name={agent.name} series={agent.series} size='sm' />
                {agent.name} asks you first
              </PopoverTitle>
              <PopoverDescription className='text-foreground text-[13px] leading-5'>
                {approval.title}
              </PopoverDescription>
              {approval.detail && (
                <p className='text-muted-foreground text-xs leading-5'>
                  {approval.detail}
                </p>
              )}
              {isPending && (
                <Button
                  type='button'
                  size='sm'
                  onClick={() => onApprove?.(approval.id)}
                  className='self-start'
                >
                  <CheckIcon />
                  Approve
                </Button>
              )}
              {!isPending && (
                <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <CheckIcon className='text-success-foreground size-3.5' />
                  Approved by you
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function markerLabelOf(approval: ApprovalRequest, agent: RunAgent) {
  if (approval.status === 'pending') {
    return `${agent.name} waits for your approval: ${approval.title}. Open to approve`;
  }
  return `Approved by you: ${approval.title}`;
}

type Connector = {
  key: string;
  from: { lane: number; along: number };
  to: { lane: number; along: number };
  series: SeriesSlot;
};

function connectorsOf(
  tasks: ToolCall[],
  agents: RunAgent[],
  frame: Frame
): Connector[] {
  const connectors: Connector[] = [];
  for (const task of tasks) {
    const parent = tasks.find((candidate) => candidate.id === task.parentId);
    const toLane = agents.findIndex((agent) => agent.id === task.agentId);
    const fromLane = agents.findIndex((agent) => agent.id === parent?.agentId);
    const fromAgent = agents[fromLane];
    const hasEnds = toLane >= 0 && fromLane >= 0;
    const isHandoff = hasEnds && fromLane !== toLane;
    const hasParent = parent !== undefined;
    const hasFromAgent = fromAgent !== undefined;
    if (!hasParent || !isHandoff || !hasFromAgent) {
      continue;
    }
    const parentEnd = parent.endedAt ?? parent.startedAt;
    const handedAt = parentEnd ?? frame.time;
    const takenAt = task.startedAt ?? frame.time;
    connectors.push({
      key: task.id,
      from: { lane: fromLane, along: alongOf(frame, handedAt) },
      to: { lane: toLane, along: alongOf(frame, takenAt) },
      series: fromAgent.series,
    });
  }
  return connectors;
}

/** SVG units: 10 per percent of the window along time, 100 per lane across. */
function pathOf(connector: Connector, orientation: Orientation) {
  const fromAlong = connector.from.along * 10;
  const toAlong = connector.to.along * 10;
  const fromAcross = connector.from.lane * 100 + 50;
  const toAcross = connector.to.lane * 100 + 50;
  const distance = toAlong - fromAlong;
  const halfway = distance / 2;
  const bend = Math.max(60, halfway);
  const fromBend = fromAlong + bend;
  const toBend = toAlong - bend;
  if (orientation === 'down') {
    return `M ${fromAcross} ${fromAlong} C ${fromAcross} ${fromBend}, ${toAcross} ${toBend}, ${toAcross} ${toAlong}`;
  }
  return `M ${fromAlong} ${fromAcross} C ${fromBend} ${fromAcross}, ${toBend} ${toAcross}, ${toAlong} ${toAcross}`;
}

function viewBoxOf(orientation: Orientation, laneCount: number) {
  const across = laneCount * 100;
  if (orientation === 'down') {
    return `0 0 ${across} 1000`;
  }
  return `0 0 1000 ${across}`;
}

function Connectors({
  connectors,
  laneCount,
  orientation,
}: {
  connectors: Connector[];
  laneCount: number;
  orientation: Orientation;
}) {
  return (
    <svg
      aria-hidden='true'
      viewBox={viewBoxOf(orientation, laneCount)}
      preserveAspectRatio='none'
      className='pointer-events-none absolute inset-0 size-full overflow-visible'
    >
      {connectors.map((connector) => (
        <path
          key={connector.key}
          d={pathOf(connector, orientation)}
          fill='none'
          strokeWidth={1.25}
          strokeOpacity={0.55}
          vectorEffect='non-scaling-stroke'
          style={{ stroke: seriesColorOf(connector.series) }}
        />
      ))}
    </svg>
  );
}

function LaneLabel({
  agent,
  orientation,
  isStill,
}: {
  agent: RunAgent;
  orientation: Orientation;
  isStill: boolean;
}) {
  if (orientation === 'down') {
    return (
      <span className='flex min-w-0 flex-col items-center gap-1 px-0.5'>
        <span className='relative'>
          <AgentTile name={agent.name} series={agent.series} size='sm' />
          <AgentStatusDot
            status={agent.status}
            size='sm'
            isStill={isStill}
            className='ring-card absolute -end-0.5 -bottom-0.5 rounded-full ring-2'
          />
        </span>
        <span className='text-muted-foreground w-full truncate text-center text-[10px] leading-3'>
          {agent.name}
        </span>
      </span>
    );
  }
  return (
    <span
      className='flex min-w-0 items-center gap-2'
      style={{ height: LANE_PX }}
    >
      <AgentTile name={agent.name} series={agent.series} size='sm' />
      <span className='min-w-0 flex-1 truncate text-xs'>{agent.name}</span>
      <AgentStatusDot status={agent.status} size='sm' isStill={isStill} />
    </span>
  );
}

function secondsOf(windowMs: number, share: number) {
  const milliseconds = windowMs * share;
  return Math.round(milliseconds / 1000);
}

/** While the run fits in the window the marks count from its start. */
function sinceStartWordOf(windowMs: number, share: number) {
  const seconds = secondsOf(windowMs, share);
  return `${seconds}s`;
}

/** Once the lanes drift, the far edge is now and the marks count back from it. */
function agoWordOf(windowMs: number, share: number) {
  const seconds = secondsOf(windowMs, share);
  return `${seconds}s ago`;
}

function startWordOf(windowMs: number, isDrifting: boolean) {
  if (isDrifting) {
    return agoWordOf(windowMs, 1);
  }
  return sinceStartWordOf(windowMs, 0);
}

const NOW_LINE: Record<Orientation, string> = {
  across: 'inset-y-0 left-0 w-px',
  down: 'inset-x-0 top-0 h-px',
};

/**
 * What lies ahead of now, drawn as the surface of the lanes: it hides the part of an open task that
 * has not been lived yet and its edge is the now line. Moving this one cover fills every lane, so
 * no bar is resized while it grows.
 */
function NowCover({
  frame,
  orientation,
  isLive,
}: {
  frame: Frame;
  orientation: Orientation;
  isLive: boolean;
}) {
  return (
    <span
      aria-hidden='true'
      className={cn('bg-card absolute inset-0 z-10', travelOf(isLive))}
      style={coverStyleOf(frame, orientation)}
    >
      <span className='bg-foreground/[0.025] dark:bg-foreground/[0.04] absolute inset-0' />
      <span
        className={cn('bg-foreground/45 absolute', NOW_LINE[orientation])}
      />
      {isLive && (
        <span className='text-foreground absolute top-1 left-1.5 text-[10px] leading-3 font-medium'>
          Now
        </span>
      )}
    </span>
  );
}

function viewportStyleOf(
  orientation: Orientation,
  laneCount: number
): React.CSSProperties {
  if (orientation === 'down') {
    return { height: DOWN_HEIGHT_PX };
  }
  const height = laneCount * LANE_PX;
  return { height };
}

const NO_APPROVALS: ApprovalRequest[] = [];

export type AgentLanesProps = {
  /** One lane per agent, in this order. */
  agents: RunAgent[];
  /** Tasks sit in the lane of their `agentId`; a `parentId` in another lane draws a hand-off. */
  tasks: ToolCall[];
  /** Requests sit on the lane of their `agentId` at `requestedAt`. */
  approvals?: ApprovalRequest[];
  startedAt?: number;
  endedAt?: number;
  isLive: boolean;
  /**
   * How much time the lanes show. While the run fits in it the lanes fill from the start and no task
   * moves; once the run outgrows it, the far edge is now and time drifts back.
   */
  windowMs?: number;
  onApprove?: (approvalId: string) => void;
  /** The request whose marker a demonstration holds down. */
  pressedApprovalId?: string | null;
  className?: string;
};

export function AgentLanes({
  agents,
  tasks,
  approvals = NO_APPROVALS,
  startedAt,
  endedAt,
  isLive,
  windowMs = DEFAULT_WINDOW_MS,
  onApprove,
  pressedApprovalId = null,
  className,
}: AgentLanesProps) {
  const { setElement, orientation } = useOrientation();
  const shouldReduceMotion = usePrefersReducedMotion();
  const now = useLiveNow(GROW_STEP_MS, isLive);
  const lead = leadOf(isLive, shouldReduceMotion);
  const reach = now + lead;
  const time = endedAt ?? reach;
  const origin = startedAt ?? time;
  const frame: Frame = { origin, time, windowMs };
  const laneCount = agents.length;
  const visibleTasks = tasks.filter((task) => isInWindow(task, frame));
  const connectors = connectorsOf(visibleTasks, agents, frame);
  const pulsingIds = pulsingIdsOf(agents);
  const isAcross = orientation === 'across';
  const isDown = orientation === 'down';
  const drift = driftOf(frame);
  const isDrifting = drift > 0;
  const showsCover = !isDrifting;
  const showsNowAtFoot = isDown && isDrifting;
  const showsTicksFromStart = isAcross && showsCover;
  const showsTicksBack = isAcross && isDrifting;
  const trackKey = `${startedAt ?? 'idle'}-${orientation}`;
  const viewportStyle = viewportStyleOf(orientation, laneCount);

  return (
    <div ref={setElement} className={cn('flex flex-col gap-1.5', className)}>
      {isDown && (
        <div
          aria-hidden='true'
          className='grid'
          style={{
            gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
          }}
        >
          {agents.map((agent) => (
            <LaneLabel
              key={agent.id}
              agent={agent}
              orientation={orientation}
              isStill={!pulsingIds.has(agent.id)}
            />
          ))}
        </div>
      )}
      <div className='flex'>
        {isAcross && (
          <div aria-hidden='true' className='flex w-28 shrink-0 flex-col pe-2'>
            {agents.map((agent) => (
              <LaneLabel
                key={agent.id}
                agent={agent}
                orientation={orientation}
                isStill={!pulsingIds.has(agent.id)}
              />
            ))}
          </div>
        )}
        <div
          className='bg-foreground/[0.025] dark:bg-foreground/[0.04] relative min-w-0 flex-1 overflow-hidden rounded-lg'
          style={viewportStyle}
        >
          <div
            key={trackKey}
            className={cn('absolute inset-0', travelOf(isLive))}
            style={trackStyleOf(frame, orientation)}
          >
            <Connectors
              connectors={connectors}
              laneCount={laneCount}
              orientation={orientation}
            />
            <ul aria-label='Lanes' className='absolute inset-0'>
              {agents.map((agent, index) => {
                const laneTasks = visibleTasks.filter(
                  (task) => task.agentId === agent.id
                );
                const laneApprovals = approvals.filter(
                  (approval) => approval.agentId === agent.id
                );
                const statusWord = AGENT_STATUS_WORD[agent.status];

                return (
                  <li
                    key={agent.id}
                    className='absolute'
                    style={laneStyleOf(orientation, index, laneCount)}
                  >
                    <span className='sr-only'>
                      {agent.name}, {statusWord}
                    </span>
                    <ul aria-label={`Tasks of ${agent.name}`}>
                      {laneTasks.map((task) => (
                        <li key={task.id}>
                          <TaskBar
                            task={task}
                            agent={agent}
                            frame={frame}
                            orientation={orientation}
                            isLive={isLive}
                          />
                        </li>
                      ))}
                    </ul>
                    {laneApprovals.map((approval) => (
                      <WaitingHatch
                        key={`${approval.id}-hatch`}
                        approval={approval}
                        frame={frame}
                        orientation={orientation}
                      />
                    ))}
                    {laneApprovals.map((approval) => (
                      <ApprovalMarker
                        key={approval.id}
                        approval={approval}
                        agent={agent}
                        frame={frame}
                        orientation={orientation}
                        isPressed={pressedApprovalId === approval.id}
                        onApprove={onApprove}
                      />
                    ))}
                  </li>
                );
              })}
            </ul>
            {showsCover && (
              <NowCover
                frame={frame}
                orientation={orientation}
                isLive={isLive}
              />
            )}
          </div>
          {isDrifting && (
            <span
              aria-hidden='true'
              className={cn(
                'bg-foreground/45 absolute',
                isAcross && 'inset-y-0 right-0 w-px',
                isDown && 'inset-x-0 bottom-0 h-px'
              )}
            />
          )}
          {isDown && (
            <span
              aria-hidden='true'
              className='text-muted-foreground pointer-events-none absolute end-1.5 top-1 z-20 text-[10px] leading-3 tabular-nums'
            >
              {startWordOf(windowMs, isDrifting)}
            </span>
          )}
          {showsNowAtFoot && (
            <span
              aria-hidden='true'
              className='text-foreground pointer-events-none absolute end-1.5 bottom-1 text-[10px] leading-3 font-medium'
            >
              Now
            </span>
          )}
        </div>
      </div>
      {showsTicksFromStart && (
        <div
          aria-hidden='true'
          className='text-muted-foreground ms-28 flex justify-between text-[11px] tabular-nums'
        >
          <span>{sinceStartWordOf(windowMs, 0)}</span>
          <span>{sinceStartWordOf(windowMs, 1 / 3)}</span>
          <span>{sinceStartWordOf(windowMs, 2 / 3)}</span>
          <span>{sinceStartWordOf(windowMs, 1)}</span>
        </div>
      )}
      {showsTicksBack && (
        <div
          aria-hidden='true'
          className='text-muted-foreground ms-28 flex justify-between text-[11px] tabular-nums'
        >
          <span>{agoWordOf(windowMs, 1)}</span>
          <span>{agoWordOf(windowMs, 2 / 3)}</span>
          <span>{agoWordOf(windowMs, 1 / 3)}</span>
          <span className='text-foreground font-medium'>Now</span>
        </div>
      )}
    </div>
  );
}

const LANES: RunAgent[] = [PLANNER, RESEARCHER, CODER, WRITER, REVIEWER];

const SEND_APPROVAL: ApprovalRequest = {
  id: 'send',
  title: 'Send the credit request to accounts@brightmoor-supply.example',
  risk: 'medium',
  status: 'pending',
  agentId: WRITER.id,
  detail: '186 words, the comparison attached. It asks for $1,840.20 back.',
};

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-lanes',
  title: RUN_TITLE,
  agents: LANES,
});

function begin(
  id: string,
  agentId: string,
  label: string,
  parentId?: string
): RunEvent {
  return {
    type: 'call.started',
    call: { id, tool: 'task', label, status: 'running', agentId, parentId },
  };
}

function finish(id: string): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'done' } };
}

function agentTo(id: string, status: RunAgent['status']): RunEvent {
  return { type: 'agent.updated', id, patch: { status } };
}

function approvedBatchOf(approvalId: string) {
  return batchOf(
    { type: 'approval.resolved', id: approvalId, decision: 'approved' },
    agentTo(WRITER.id, 'running')
  );
}

function hasDecided(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  return pending.length === 0;
}

const SCRIPT: RunStep[] = [
  batch(
    500,
    { type: 'run.started' },
    agentTo(PLANNER.id, 'running'),
    begin('split', PLANNER.id, 'Split the review into tasks')
  ),
  batch(1700, finish('split')),
  batch(
    250,
    begin('collect', RESEARCHER.id, 'Collect 14 price lists', 'split'),
    agentTo(RESEARCHER.id, 'running')
  ),
  batch(350, begin('track', PLANNER.id, 'Track the agents')),
  batch(3200, finish('collect')),
  batch(
    250,
    begin('compare', CODER.id, 'Compare invoices with prices', 'collect'),
    agentTo(CODER.id, 'running')
  ),
  batch(450, begin('terms', RESEARCHER.id, 'Read the contract terms')),
  batch(1700, finish('terms'), agentTo(RESEARCHER.id, 'done')),
  batch(1100, finish('compare'), agentTo(CODER.id, 'done')),
  batch(
    250,
    begin('draft', WRITER.id, 'Draft the credit request', 'compare'),
    agentTo(WRITER.id, 'running')
  ),
  batch(1900, finish('draft')),
  batch(
    250,
    begin('check', REVIEWER.id, 'Check the figures', 'draft'),
    agentTo(REVIEWER.id, 'running')
  ),
  batch(
    250,
    begin('send', WRITER.id, 'Send the email'),
    agentTo(WRITER.id, 'waiting'),
    { type: 'approval.requested', approval: SEND_APPROVAL }
  ),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: SEND_APPROVAL.id,
    action: approvedBatchOf(SEND_APPROVAL.id),
    isAnswered: hasDecided,
  },
  batch(900, finish('send'), agentTo(WRITER.id, 'done')),
  batch(700, finish('check'), agentTo(REVIEWER.id, 'done')),
  batch(500, finish('track'), agentTo(PLANNER.id, 'done'), {
    type: 'run.finished',
    status: 'done',
  }),
];

const SESSION = {
  reducer: reduceBatch,
  initial: INITIAL_RUN,
  resting: restingOf(INITIAL_RUN, SCRIPT, applyBatchAt),
  script: SCRIPT,
  loopAfter: 3000,
};

function isLiveRun(run: RunSnapshot) {
  const isRunning = run.status === 'running';
  const isWaiting = run.status === 'waiting';
  return isRunning || isWaiting;
}

function announcementOf(run: RunSnapshot) {
  const [pending] = pendingApprovalsOf(run);
  if (pending) {
    return `${WRITER.name} waits for your approval: ${pending.title}`;
  }
  if (run.status === 'done') {
    return 'All lanes are done';
  }
  const running = run.calls.filter((call) => call.status === 'running');
  const latest = running.at(-1);
  if (!latest) {
    return '';
  }
  const agent = LANES.find((candidate) => candidate.id === latest.agentId);
  return `${agent?.name ?? 'An agent'} started: ${latest.label}`;
}

export default function Agent02() {
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const isEnded = state.endedAt !== undefined;
  const hasStarted = state.startedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;
  const isLive = isLiveRun(state);
  const announcement = announcementOf(state);

  function approve(approvalId: string) {
    act(approvedBatchOf(approvalId));
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[21.5rem] w-full max-w-[44rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <section
          aria-label='Agent lanes'
          className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          <header className='flex items-baseline justify-between gap-3'>
            <h3 className='truncate text-sm font-medium'>{state.title}</h3>
            <span className='text-muted-foreground min-w-8 shrink-0 text-end text-xs'>
              {hasStarted && <LiveDuration item={state} isRunning={isLive} />}
            </span>
          </header>
          <AgentLanes
            agents={state.agents}
            tasks={state.calls}
            approvals={state.approvals}
            startedAt={state.startedAt}
            endedAt={state.endedAt}
            isLive={isLive}
            windowMs={DEMO_WINDOW_MS}
            onApprove={approve}
            pressedApprovalId={pressed}
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
