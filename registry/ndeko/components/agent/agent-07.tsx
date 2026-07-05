'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  seriesColorOf,
  type AgentStatus as AgentState,
  type ApprovalRequest,
  type RunAgent,
  type RunSnapshot,
  type RunStatus,
  type SeriesSlot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  ListCollapseIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import { hatchOf } from '@/registry/ndeko/lib/hatch';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
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
import { AgentStatusDot } from './_parts/agent-status';
import { AgentTile } from './_parts/agent-tile';
import { CostFigure } from './_parts/cost-figure';
import { CODER } from './_parts/crew';
import { focusLater } from './_parts/focus-later';
import { ToolTile } from './_parts/tool-tile';
import { countOf } from './_parts/words';

export type MonitorMode =
  'idle' | 'running' | 'waiting' | 'paused' | 'stopped' | 'done' | 'failed';

const MODE_WORD: Record<MonitorMode, string> = {
  idle: 'Not started',
  running: 'Running',
  waiting: 'Waiting on you',
  paused: 'Paused',
  stopped: 'Stopped',
  done: 'Done',
  failed: 'Failed',
};

const MODE_WORDS = Object.values(MODE_WORD);

const MODE_DOT: Record<MonitorMode, AgentState> = {
  idle: 'idle',
  running: 'running',
  waiting: 'waiting',
  paused: 'idle',
  stopped: 'idle',
  done: 'done',
  failed: 'failed',
};

const WAITING_PART: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--warning) 14%, transparent)',
  backgroundImage: hatchOf('var(--warning)', 60),
};

const FAILED_PART: React.CSSProperties = {
  backgroundColor: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
  backgroundImage: hatchOf('var(--destructive)', 55),
};

export function monitorModeOf(status: RunStatus, isPaused: boolean) {
  if (status === 'cancelled') {
    return 'stopped';
  }
  if (status === 'done') {
    return 'done';
  }
  if (status === 'failed') {
    return 'failed';
  }
  if (isPaused) {
    return 'paused';
  }
  if (status === 'waiting') {
    return 'waiting';
  }
  if (status === 'running') {
    return 'running';
  }
  return 'idle';
}

function isOpenCall(call: ToolCall) {
  const isRunning = call.status === 'running';
  const isWaiting = call.status === 'waiting';
  return isRunning || isWaiting;
}

function isFinishedCall(call: ToolCall) {
  const isDone = call.status === 'done';
  const isFailed = call.status === 'failed';
  return isDone || isFailed;
}

export function currentCallOf(calls: ToolCall[]) {
  const openCalls = calls.filter(isOpenCall);
  return openCalls.at(-1);
}

function pendingApprovalFor(
  approvals: ApprovalRequest[],
  call: ToolCall | undefined
) {
  if (!call) {
    return undefined;
  }
  return approvals.find((approval) => {
    const isForCall = approval.id === call.id;
    const isPending = approval.status === 'pending';
    return isForCall && isPending;
  });
}

function finishedDurationOf(call: ToolCall) {
  const end = call.endedAt ?? 0;
  const elapsed = elapsedOf(call, end);
  return formatDuration(elapsed);
}

function lowerFirst(text: string) {
  const first = text.charAt(0).toLowerCase();
  const rest = text.slice(1);
  return `${first}${rest}`;
}

type StripPart = {
  key: string;
  grow: number;
  style: React.CSSProperties;
};

function solidPartOf(
  call: ToolCall,
  series: SeriesSlot,
  isCurrent: boolean
): React.CSSProperties {
  const color = seriesColorOf(series);
  if (call.status === 'failed') {
    return FAILED_PART;
  }
  if (isCurrent) {
    return { backgroundColor: color };
  }
  return { backgroundColor: `color-mix(in oklab, ${color} 42%, transparent)` };
}

function isGateCall(call: ToolCall, approvals: ApprovalRequest[]) {
  return approvals.some((approval) => approval.id === call.id);
}

/** A step that waited on a person keeps its hatch after the decision: the wait stays in the history. */
function stripPartsOf(
  calls: ToolCall[],
  approvals: ApprovalRequest[],
  series: SeriesSlot,
  current: ToolCall | undefined,
  now: number
) {
  const parts: StripPart[] = [];
  for (const call of calls) {
    const hasStarted = call.startedAt !== undefined;
    if (!hasStarted) {
      continue;
    }
    const isWaiting = isGateCall(call, approvals);
    const isCurrent = call.id === current?.id;
    const grow = elapsedOf(call, now);
    if (isWaiting) {
      parts.push({ key: call.id, grow, style: WAITING_PART });
      continue;
    }
    const style = solidPartOf(call, series, isCurrent);
    parts.push({ key: call.id, grow, style });
  }
  return parts;
}

function TimeStrip({
  calls,
  approvals,
  series,
  current,
  isTicking,
}: {
  calls: ToolCall[];
  approvals: ApprovalRequest[];
  series: SeriesSlot;
  current: ToolCall | undefined;
  isTicking: boolean;
}) {
  const now = useLiveNow(100, isTicking);
  const parts = stripPartsOf(calls, approvals, series, current, now);
  const isEmpty = parts.length === 0;

  return (
    <div
      aria-hidden='true'
      className='bg-foreground/[0.05] flex h-1.5 gap-0.5 overflow-hidden rounded-full'
    >
      {isEmpty && <span className='h-full flex-1' />}
      {parts.map((part) => (
        <span
          key={part.key}
          className='h-full min-w-0.5 basis-0 rounded-[2px] first:rounded-s-full last:rounded-e-full'
          style={{ ...part.style, flexGrow: part.grow }}
        />
      ))}
    </div>
  );
}

function CommandAsk({
  agent,
  call,
  approval,
  onAllow,
  onDeny,
}: {
  agent: RunAgent;
  call: ToolCall;
  approval: ApprovalRequest;
  onAllow?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}) {
  const command = approval.command ?? call.label;
  const waitingSince = { startedAt: approval.requestedAt };

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-start gap-3'>
        <ToolTile tool={call.tool} size='lg' />
        <div className='min-w-0 flex-1'>
          <p className='text-warning-foreground text-xs'>
            {agent.name} needs your OK
          </p>
          <p className='text-[15px] leading-6 font-medium text-balance'>
            {approval.title}
          </p>
        </div>
      </div>
      <div className='bg-foreground/[0.04] flex items-start gap-2 rounded-lg py-2 ps-3 pe-1.5'>
        <code className='min-w-0 flex-1 py-0.5 font-mono text-xs leading-5 break-all'>
          <span
            aria-hidden='true'
            className='text-muted-foreground select-none'
          >
            ${' '}
          </span>
          {command}
        </code>
        <CopyButton text={command} label='Copy the command' />
      </div>
      {approval.detail && (
        <p className='text-muted-foreground text-xs leading-5'>
          {approval.detail}
        </p>
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <Button type='button' size='sm' onClick={() => onAllow?.(approval.id)}>
          <CheckIcon />
          Allow
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => onDeny?.(approval.id)}
        >
          Deny
        </Button>
        <span className='text-muted-foreground ms-auto text-xs tabular-nums'>
          Waiting <LiveDuration item={waitingSince} isRunning />
        </span>
      </div>
    </div>
  );
}

function RunningStep({
  agent,
  call,
  isTicking,
}: {
  agent: RunAgent;
  call: ToolCall;
  isTicking: boolean;
}) {
  return (
    <div className='flex items-start gap-3'>
      <ToolTile tool={call.tool} size='lg' />
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground font-mono text-xs leading-5'>
          {call.tool}
        </p>
        <p className='text-[15px] leading-6 font-medium text-balance'>
          {call.label}
        </p>
      </div>
      <div className='shrink-0 text-end'>
        <LiveDuration
          item={call}
          isRunning={isTicking}
          className='block text-2xl leading-8 font-medium'
        />
        <p className='text-muted-foreground text-xs'>
          <CostFigure usd={agent.costUsd ?? 0} /> so far
        </p>
      </div>
    </div>
  );
}

function summaryOf(mode: MonitorMode, finishedCount: number) {
  const steps = countOf(finishedCount, 'step');
  if (mode === 'done') {
    return `Done after ${steps}`;
  }
  if (mode === 'stopped') {
    return `Stopped by you after ${steps}`;
  }
  if (mode === 'failed') {
    return `Failed after ${steps}`;
  }
  if (mode === 'idle') {
    return 'Waits for its first step';
  }
  return 'Thinking about the next step';
}

function RestingStep({
  agent,
  mode,
  finishedCount,
}: {
  agent: RunAgent;
  mode: MonitorMode;
  finishedCount: number;
}) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <p className='text-[15px] leading-6 font-medium'>
        {summaryOf(mode, finishedCount)}
      </p>
      <p className='text-muted-foreground shrink-0 text-xs'>
        <CostFigure usd={agent.costUsd ?? 0} /> in total
      </p>
    </div>
  );
}

function CurrentStep({
  agent,
  mode,
  current,
  pending,
  finishedCount,
  isTicking,
  onAllow,
  onDeny,
}: {
  agent: RunAgent;
  mode: MonitorMode;
  current: ToolCall | undefined;
  pending: ApprovalRequest | undefined;
  finishedCount: number;
  isTicking: boolean;
  onAllow?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}) {
  if (!current) {
    return (
      <RestingStep agent={agent} mode={mode} finishedCount={finishedCount} />
    );
  }
  if (pending) {
    return (
      <CommandAsk
        agent={agent}
        call={current}
        approval={pending}
        onAllow={onAllow}
        onDeny={onDeny}
      />
    );
  }
  return <RunningStep agent={agent} call={current} isTicking={isTicking} />;
}

function noteOf(call: ToolCall) {
  if (call.status === 'failed') {
    return call.error ?? '';
  }
  return '';
}

function FinishedSteps({ calls }: { calls: ToolCall[] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const finished = calls.filter(isFinishedCall);
  const newestFirst = [...finished].reverse();
  const hasFinished = newestFirst.length > 0;

  return (
    <div className='flex flex-col gap-1'>
      <p className='text-muted-foreground text-xs font-medium'>
        Finished steps
      </p>
      {!hasFinished && (
        <p className='text-muted-foreground text-xs leading-6'>
          Each step lands here when it ends
        </p>
      )}
      <ol aria-label='Finished steps' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {newestFirst.map((call) => {
            const isFailed = call.status === 'failed';
            const note = noteOf(call);
            const hasNote = note !== '';

            return (
              <motion.li
                key={call.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <div className='flex items-start gap-3 py-1'>
                  <ToolTile tool={call.tool} size='sm' />
                  <div className='min-w-0 flex-1'>
                    <p
                      className={cn(
                        'truncate text-[13px] leading-6',
                        isFailed && 'text-muted-foreground'
                      )}
                    >
                      {call.label}
                    </p>
                    {hasNote && (
                      <p className='text-destructive-ink text-xs'>{note}</p>
                    )}
                  </div>
                  <span className='text-muted-foreground shrink-0 text-xs leading-6 tabular-nums'>
                    {finishedDurationOf(call)}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}

function FoldedBar({
  agent,
  mode,
  current,
  isTicking,
}: {
  agent: RunAgent;
  mode: MonitorMode;
  current: ToolCall | undefined;
  isTicking: boolean;
}) {
  const word = lowerFirst(MODE_WORD[mode]);

  return (
    <div className='flex min-h-11 items-center gap-2.5 py-2 ps-3.5 pe-12'>
      <AgentStatusDot status={MODE_DOT[mode]} />
      <p className='min-w-0 flex-1 truncate text-[13px] leading-5'>
        <span className='font-medium'>{agent.name}</span>,{' '}
        {current && (
          <>
            {lowerFirst(current.label)},{' '}
            <LiveDuration item={current} isRunning={isTicking} />,{' '}
          </>
        )}
        {!current && <>{word}, </>}
        <CostFigure usd={agent.costUsd ?? 0} />
      </p>
    </div>
  );
}

function pauseLabelOf(isPaused: boolean, name: string) {
  if (isPaused) {
    return `Resume ${name}`;
  }
  return `Pause ${name}`;
}

function foldLabelOf(isFolded: boolean) {
  if (isFolded) {
    return 'Unfold the monitor';
  }
  return 'Fold the monitor into a bar';
}

function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={label}
            onClick={onClick}
            className={cn('text-muted-foreground', className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function canPauseIn(mode: MonitorMode) {
  const isRunning = mode === 'running';
  const isPaused = mode === 'paused';
  return isRunning || isPaused;
}

function canStopIn(mode: MonitorMode) {
  const canPause = canPauseIn(mode);
  const isWaiting = mode === 'waiting';
  return canPause || isWaiting;
}

const NO_APPROVALS: ApprovalRequest[] = [];

export type AgentMonitorProps = {
  agent: RunAgent;
  /** The agent's steps in order. An approval that gates a step shares its id. */
  calls: ToolCall[];
  status: RunStatus;
  approvals?: ApprovalRequest[];
  isPaused?: boolean;
  onPauseChange?: (isPaused: boolean) => void;
  onStop?: () => void;
  onAllow?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
  defaultFolded?: boolean;
  className?: string;
};

export function AgentMonitor({
  agent,
  calls,
  status,
  approvals = NO_APPROVALS,
  isPaused = false,
  onPauseChange,
  onStop,
  onAllow,
  onDeny,
  defaultFolded = false,
  className,
}: AgentMonitorProps) {
  const [isFolded, setIsFolded] = useState(defaultFolded);
  const rootRef = useRef<HTMLElement>(null);
  const bodyId = useId();
  const fade = fadePresence();
  const mode = monitorModeOf(status, isPaused);
  const current = currentCallOf(calls);
  const pending = pendingApprovalFor(approvals, current);
  const isRunning = mode === 'running';
  const isWaiting = mode === 'waiting';
  const isTicking = isRunning || isWaiting;
  const finished = calls.filter(isFinishedCall);
  const showsPause = canPauseIn(mode);
  const showsStop = canStopIn(mode);
  const pauseLabel = pauseLabelOf(isPaused, agent.name);
  const foldLabel = foldLabelOf(isFolded);
  const currentKey = current?.id ?? 'rest';
  const pendingKey = pending?.id ?? 'free';
  const stepKey = `${currentKey}-${pendingKey}-${mode}`;

  function toggleFolded() {
    setIsFolded((value) => !value);
  }

  function togglePause() {
    onPauseChange?.(!isPaused);
  }

  function keepFocus() {
    focusLater(rootRef, '[data-monitor-toggle]');
  }

  function stop() {
    onStop?.();
    keepFocus();
  }

  function allow(approvalId: string) {
    onAllow?.(approvalId);
    keepFocus();
  }

  function deny(approvalId: string) {
    onDeny?.(approvalId);
    keepFocus();
  }

  return (
    <section
      ref={rootRef}
      aria-label={`${agent.name} at work`}
      className={cn(
        'bg-card hairline-ring ring-border relative rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-expanded={!isFolded}
        aria-controls={bodyId}
        aria-label={foldLabel}
        onClick={toggleFolded}
        data-monitor-toggle
        className='text-muted-foreground absolute end-2.5 top-2.5 z-10'
      >
        <Swap swapKey={String(isFolded)}>
          {isFolded && <ChevronsUpDownIcon />}
          {!isFolded && <ListCollapseIcon />}
        </Swap>
      </Button>
      <AnimatedSize>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            {isFolded && (
              <motion.div key='bar' {...fade}>
                <FoldedBar
                  agent={agent}
                  mode={mode}
                  current={current}
                  isTicking={isTicking}
                />
              </motion.div>
            )}
            {!isFolded && (
              <motion.div
                key='card'
                id={bodyId}
                className='flex flex-col gap-4 p-4'
                {...fade}
              >
                <header className='flex items-center gap-3 pe-9'>
                  <AgentTile
                    name={agent.name}
                    series={agent.series}
                    size='lg'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='flex items-baseline gap-2'>
                      <span className='text-sm font-medium'>{agent.name}</span>
                      <span className='text-muted-foreground truncate text-xs'>
                        {agent.model}
                      </span>
                    </p>
                    <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      <AgentStatusDot status={MODE_DOT[mode]} size='sm' />
                      <WordRoll text={MODE_WORD[mode]} labels={MODE_WORDS} />
                    </p>
                  </div>
                  <div className='flex items-center'>
                    {showsPause && (
                      <IconAction label={pauseLabel} onClick={togglePause}>
                        <Swap swapKey={String(isPaused)}>
                          {isPaused && <PlayIcon />}
                          {!isPaused && <PauseIcon />}
                        </Swap>
                      </IconAction>
                    )}
                    {showsStop && (
                      <IconAction
                        label={`Stop ${agent.name}`}
                        onClick={stop}
                        className='hover:text-destructive-ink'
                      >
                        <StopIcon />
                      </IconAction>
                    )}
                  </div>
                </header>
                <div className='relative'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.div key={stepKey} {...fade}>
                      <CurrentStep
                        agent={agent}
                        mode={mode}
                        current={current}
                        pending={pending}
                        finishedCount={finished.length}
                        isTicking={isTicking}
                        onAllow={allow}
                        onDeny={deny}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <TimeStrip
                  calls={calls}
                  approvals={approvals}
                  series={agent.series}
                  current={current}
                  isTicking={isTicking}
                />
                <FinishedSteps calls={calls} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </section>
  );
}

const GATE_ID = 'tests-ask';

const ALLOWED_RUN_ID = 'tests-repeat';

const COMMAND = 'pnpm test checkout.spec.ts --repeat 20';

const GATE: ApprovalRequest = {
  id: GATE_ID,
  title: 'Run the checkout tests 20 times',
  risk: 'low',
  status: 'pending',
  agentId: CODER.id,
  command: COMMAND,
  detail:
    'It runs in the sandbox and writes only the test report. About 30 seconds.',
};

const INITIAL_RUN = emptyRun({
  id: 'coder-monitor',
  title: 'Fix the flaky checkout test',
  agents: [{ ...CODER, parentId: undefined, costUsd: 0 }],
});

function started(
  id: string,
  tool: string,
  label: string
): RunScriptStep['event'] {
  return {
    type: 'call.started',
    call: { id, tool, label, status: 'running', agentId: CODER.id },
  };
}

function finished(id: string, label: string): RunScriptStep['event'] {
  return { type: 'call.updated', id, patch: { status: 'done', label } };
}

function spent(costUsd: number): RunScriptStep['event'] {
  return { type: 'agent.updated', id: CODER.id, patch: { costUsd } };
}

const SCRIPT: RunScriptStep[] = [
  { after: 500, event: { type: 'run.started' } },
  {
    after: 0,
    event: {
      type: 'agent.updated',
      id: CODER.id,
      patch: { status: 'running' },
    },
  },
  {
    after: 300,
    event: started('read-spec', 'read_file', 'Reading checkout.spec.ts'),
  },
  { after: 1300, event: finished('read-spec', 'Read checkout.spec.ts') },
  { after: 0, event: spent(0.004) },
  {
    after: 400,
    event: started('run-tests', 'shell', 'Running the checkout tests'),
  },
  {
    after: 2600,
    event: finished('run-tests', 'Ran the checkout tests: 1 of 12 failed'),
  },
  { after: 0, event: spent(0.011) },
  {
    after: 500,
    event: started('read-mock', 'read_file', 'Reading payment-mock.ts'),
  },
  { after: 1100, event: finished('read-mock', 'Read payment-mock.ts') },
  { after: 0, event: spent(0.016) },
  {
    after: 400,
    event: started(
      'edit-mock',
      'edit_file',
      'Raising the payment timeout to 8s'
    ),
  },
  {
    after: 1500,
    event: finished('edit-mock', 'Raised the payment timeout to 8s'),
  },
  { after: 0, event: spent(0.024) },
  {
    after: 400,
    event: started(GATE_ID, 'shell', 'Asking to run the tests 20 times'),
  },
  {
    after: 0,
    event: { type: 'call.updated', id: GATE_ID, patch: { status: 'waiting' } },
  },
  { after: 0, event: { type: 'approval.requested', approval: GATE } },
  {
    after: 3000,
    event: finished(
      ALLOWED_RUN_ID,
      'Ran the checkout tests 20 times: all passed'
    ),
  },
  { after: 0, event: spent(0.031) },
  {
    after: 500,
    event: started(
      'changelog',
      'edit_file',
      'Writing the fix into CHANGELOG.md'
    ),
  },
  {
    after: 1200,
    event: finished('changelog', 'Wrote the fix into CHANGELOG.md'),
  },
  { after: 0, event: spent(0.035) },
  {
    after: 300,
    event: started('commit', 'git', 'Committing the fix'),
  },
  {
    after: 900,
    event: finished('commit', 'Committed “Raise the payment mock timeout”'),
  },
  {
    after: 300,
    event: { type: 'agent.updated', id: CODER.id, patch: { status: 'done' } },
  },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

function isGateOpen(run: RunSnapshot) {
  const gate = run.calls.find((call) => call.id === GATE_ID);
  return gate?.status === 'waiting';
}

/** The script holds while the person decides, and for good once the run is stopped. */
function isScriptHeld(run: RunSnapshot) {
  const isStopped = run.status === 'cancelled';
  return isGateOpen(run) || isStopped;
}

function announcementOf(run: RunSnapshot, isPaused: boolean) {
  const mode = monitorModeOf(run.status, isPaused);
  const current = currentCallOf(run.calls);
  const word = MODE_WORD[mode];
  if (!current) {
    return `${CODER.name}: ${word}`;
  }
  return `${CODER.name}: ${word}. ${current.label}`;
}

export default function Agent07() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const [isPaused, setIsPaused] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const pausedAt = useRef(0);
  const isUnpaused = !isPaused;
  const isUnheld = !isHeld;
  const canPlay = isUnpaused && isUnheld;
  const isActive = isInView && canPlay;
  const { snapshot, store, restart } = useRunScript(SCRIPT, {
    initial: INITIAL_RUN,
    isActive,
  });
  const shouldHold = isScriptHeld(snapshot);
  if (shouldHold !== isHeld) {
    setIsHeld(shouldHold);
  }
  const [agent] = snapshot.agents;
  const isEnded = snapshot.endedAt !== undefined;
  const announcement = announcementOf(snapshot, isPaused);

  function pause() {
    pausedAt.current = Date.now();
    setIsPaused(true);
  }

  function resume() {
    const pausedFor = Date.now() - pausedAt.current;
    const current = currentCallOf(snapshot.calls);
    const startedAt = current?.startedAt;
    if (current && startedAt !== undefined) {
      store.dispatch({
        type: 'call.updated',
        id: current.id,
        patch: { startedAt: startedAt + pausedFor },
      });
    }
    setIsPaused(false);
  }

  function changePause(shouldPause: boolean) {
    if (shouldPause) {
      pause();
      return;
    }
    resume();
  }

  function allow(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'approved',
    });
    store.dispatch(finished(GATE_ID, 'You allowed the 20 test runs'));
    store.dispatch(
      started(ALLOWED_RUN_ID, 'shell', 'Running the checkout tests 20 times')
    );
  }

  function deny(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'denied',
    });
    store.dispatch({
      type: 'call.updated',
      id: GATE_ID,
      patch: {
        status: 'failed',
        label: 'Did not run the tests 20 times',
        error: 'Denied by you',
      },
    });
  }

  function stop() {
    const current = currentCallOf(snapshot.calls);
    if (current) {
      store.dispatch({
        type: 'call.updated',
        id: current.id,
        patch: { status: 'failed', error: 'Stopped by you' },
      });
    }
    store.dispatch({
      type: 'agent.updated',
      id: CODER.id,
      patch: { status: 'idle' },
    });
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
    setIsPaused(false);
  }

  function replay() {
    setIsPaused(false);
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[30rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <AgentMonitor
          agent={agent}
          calls={snapshot.calls}
          status={snapshot.status}
          approvals={snapshot.approvals}
          isPaused={isPaused}
          onPauseChange={changePause}
          onStop={stop}
          onAllow={allow}
          onDeny={deny}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-between gap-2 px-1'>
        <span className='text-muted-foreground text-xs'>
          Costs are illustrative
        </span>
        <ReplayButton isShown={isEnded} onReplay={replay} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
