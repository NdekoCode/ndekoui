'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useSyncExternalStore } from 'react';

import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  pendingApprovalsOf,
  seriesColorOf,
  type ApprovalRequest,
  type RunAgent,
  type RunSnapshot,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import { CheckIcon, HandIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { hatchOf } from '@/registry/ndeko/lib/hatch';
import {
  ClockGate,
  LiveDuration,
  useLiveNow,
} from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';
import { AGENT_STATUS_WORD, AgentStatusDot } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import {
  CODER,
  PLANNER,
  RESEARCHER,
  REVIEWER,
  RUN_TITLE,
  WRITER,
} from './_parts/crew';

type Orientation = 'across' | 'down';

const WIDE_QUERY = '(min-width: 640px)';

const LANE_PX = 44;

const DOWN_HEIGHT_PX = 300;

const DEFAULT_WINDOW_MS = 24_000;

const DEMO_WINDOW_MS = 12_000;

/** Tasks that left the window a moment ago stay mounted while the lagging track carries them out. */
const KEEP_MS = 2500;

const HATCH_WAITING: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--warning) 16%, transparent)',
  backgroundImage: hatchOf('var(--warning)', 60),
};

function subscribeToWidth(listener: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

function isWideNow() {
  return window.matchMedia(WIDE_QUERY).matches;
}

function wideOnServer() {
  return true;
}

function useOrientation(): Orientation {
  const isWide = useSyncExternalStore(
    subscribeToWidth,
    isWideNow,
    wideOnServer
  );
  if (isWide) {
    return 'across';
  }
  return 'down';
}

type Frame = {
  origin: number;
  time: number;
  windowMs: number;
};

/** Where a moment sits on the track, in percent of the visible window from the start of the run. */
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

function shiftOf(frame: Frame) {
  const visibleStart = frame.time - frame.windowMs;
  return alongOf(frame, visibleStart);
}

function trackStyleOf(
  frame: Frame,
  orientation: Orientation
): React.CSSProperties {
  const shift = shiftOf(frame);
  if (orientation === 'down') {
    return { transform: `translateY(${-shift}%)` };
  }
  return { transform: `translateX(${-shift}%)` };
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

/** A running task runs past the now edge, which clips it: its growing end is the edge itself. */
function endOf(task: ToolCall, frame: Frame) {
  if (task.endedAt !== undefined) {
    return task.endedAt;
  }
  return frame.time + frame.windowMs;
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
  const openEnd = frame.time + frame.windowMs;
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
  onApprove,
}: {
  approval: ApprovalRequest;
  agent: RunAgent;
  frame: Frame;
  orientation: Orientation;
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
              'surface-raised focus-visible:ring-ring absolute z-10 flex size-5 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-1 [&_svg]:size-3',
              isPending && 'text-warning-foreground',
              !isPending && 'text-success-foreground'
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
}: {
  agent: RunAgent;
  orientation: Orientation;
}) {
  if (orientation === 'down') {
    return (
      <span className='flex min-w-0 flex-col items-center gap-1 px-0.5'>
        <span className='relative'>
          <AgentTile name={agent.name} series={agent.series} size='sm' />
          <AgentStatusDot
            status={agent.status}
            size='sm'
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
      <AgentStatusDot status={agent.status} size='sm' />
    </span>
  );
}

function tickWordOf(windowMs: number, share: number) {
  const milliseconds = windowMs * share;
  const seconds = Math.round(milliseconds / 1000);
  return `${seconds}s ago`;
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
  /** How much time the lanes show, from the now line back. */
  windowMs?: number;
  onApprove?: (approvalId: string) => void;
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
  className,
}: AgentLanesProps) {
  const orientation = useOrientation();
  const shouldReduceMotion = usePrefersReducedMotion();
  const now = useLiveNow(1000, isLive);
  const time = endedAt ?? now;
  const origin = startedAt ?? time;
  const frame: Frame = { origin, time, windowMs };
  const laneCount = agents.length;
  const visibleTasks = tasks.filter((task) => isInWindow(task, frame));
  const connectors = connectorsOf(visibleTasks, agents, frame);
  const isAcross = orientation === 'across';
  const isDown = orientation === 'down';
  const trackKey = `${startedAt ?? 'idle'}-${orientation}`;
  const glides = isLive && !shouldReduceMotion;
  const viewportStyle = viewportStyleOf(orientation, laneCount);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {isDown && (
        <div
          aria-hidden='true'
          className='grid'
          style={{
            gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
          }}
        >
          {agents.map((agent) => (
            <LaneLabel key={agent.id} agent={agent} orientation={orientation} />
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
            className={cn(
              'absolute inset-0',
              glides && 'transition-transform duration-1000 ease-linear'
            )}
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
                        onApprove={onApprove}
                      />
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
          <span
            aria-hidden='true'
            className={cn(
              'bg-foreground/45 absolute',
              isAcross && 'inset-y-0 end-0 w-px',
              isDown && 'inset-x-0 bottom-0 h-px'
            )}
          />
          {isDown && (
            <span
              aria-hidden='true'
              className='text-muted-foreground pointer-events-none absolute start-1.5 top-1 text-[10px] tabular-nums'
            >
              {tickWordOf(windowMs, 1)}
            </span>
          )}
          {isDown && (
            <span
              aria-hidden='true'
              className='text-foreground pointer-events-none absolute end-1.5 bottom-1 text-[10px] font-medium'
            >
              Now
            </span>
          )}
        </div>
      </div>
      {isAcross && (
        <div
          aria-hidden='true'
          className='text-muted-foreground ms-28 flex justify-between text-[11px] tabular-nums'
        >
          <span>{tickWordOf(windowMs, 1)}</span>
          <span>{tickWordOf(windowMs, 2 / 3)}</span>
          <span>{tickWordOf(windowMs, 1 / 3)}</span>
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
): RunScriptStep['event'] {
  return {
    type: 'call.started',
    call: { id, tool: 'task', label, status: 'running', agentId, parentId },
  };
}

function finish(id: string): RunScriptStep['event'] {
  return { type: 'call.updated', id, patch: { status: 'done' } };
}

function agentTo(
  id: string,
  status: RunAgent['status']
): RunScriptStep['event'] {
  return { type: 'agent.updated', id, patch: { status } };
}

const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  { after: 0, event: agentTo(PLANNER.id, 'running') },
  {
    after: 0,
    event: begin('split', PLANNER.id, 'Split the review into tasks'),
  },
  { after: 2600, event: finish('split') },
  {
    after: 300,
    event: begin('collect', RESEARCHER.id, 'Collect 14 price lists', 'split'),
  },
  { after: 0, event: agentTo(RESEARCHER.id, 'running') },
  { after: 400, event: begin('track', PLANNER.id, 'Track the agents') },
  { after: 6200, event: finish('collect') },
  {
    after: 300,
    event: begin(
      'compare',
      CODER.id,
      'Compare invoices with prices',
      'collect'
    ),
  },
  { after: 0, event: agentTo(CODER.id, 'running') },
  {
    after: 600,
    event: begin('terms', RESEARCHER.id, 'Read the contract terms'),
  },
  { after: 3000, event: finish('terms') },
  { after: 0, event: agentTo(RESEARCHER.id, 'done') },
  { after: 2400, event: finish('compare') },
  { after: 0, event: agentTo(CODER.id, 'done') },
  {
    after: 300,
    event: begin('draft', WRITER.id, 'Draft the credit request', 'compare'),
  },
  { after: 0, event: agentTo(WRITER.id, 'running') },
  { after: 2600, event: finish('draft') },
  {
    after: 300,
    event: begin('check', REVIEWER.id, 'Check the figures', 'draft'),
  },
  { after: 0, event: agentTo(REVIEWER.id, 'running') },
  { after: 300, event: begin('send', WRITER.id, 'Send the email') },
  { after: 0, event: agentTo(WRITER.id, 'waiting') },
  { after: 0, event: { type: 'approval.requested', approval: SEND_APPROVAL } },
  { after: 1600, event: finish('send') },
  { after: 0, event: agentTo(WRITER.id, 'done') },
  { after: 1200, event: finish('check') },
  { after: 0, event: agentTo(REVIEWER.id, 'done') },
  { after: 600, event: finish('track') },
  { after: 0, event: agentTo(PLANNER.id, 'done') },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

function isWaitingOnPerson(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  return pending.length > 0;
}

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
  const { ref, isInView, snapshot, store, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
    holdWhile: isWaitingOnPerson,
  });
  const isEnded = snapshot.endedAt !== undefined;
  const isLive = isLiveRun(snapshot);
  const announcement = announcementOf(snapshot);

  function approve(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'approved',
    });
    store.dispatch(agentTo(WRITER.id, 'running'));
  }

  return (
    <div ref={ref} className='flex w-full max-w-[44rem] flex-col gap-2'>
      <section
        aria-label='Agent lanes'
        className='bg-card hairline-ring ring-border flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
      >
        <header className='flex items-baseline justify-between gap-3'>
          <h3 className='truncate text-sm font-medium'>{snapshot.title}</h3>
          <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
            {snapshot.startedAt !== undefined && (
              <LiveDuration item={snapshot} isRunning={isLive} />
            )}
          </span>
        </header>
        <ClockGate isActive={isInView}>
          <AgentLanes
            agents={snapshot.agents}
            tasks={snapshot.calls}
            approvals={snapshot.approvals}
            startedAt={snapshot.startedAt}
            endedAt={snapshot.endedAt}
            isLive={isLive}
            windowMs={DEMO_WINDOW_MS}
            onApprove={approve}
          />
        </ClockGate>
      </section>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isEnded} onReplay={restart} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
