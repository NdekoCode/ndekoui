'use client';

import { AnimatePresence, motion } from 'motion/react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  pendingApprovalsOf,
  type ApprovalRequest,
  type CallStatus,
  type PlanStep,
  type RunEvent,
  type RunSnapshot,
  type RunStatus,
  type StepStatus,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import {
  ClockGate,
  LiveDuration,
  useLiveNow,
} from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  INSTANT,
  rowPresenceOf,
  SPRING,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  applyBatchAt,
  batch,
  batchOf,
  reduceBatch,
  restingOf,
  type RunStep,
} from './_parts/run-session';
import { PAGE_ERROR, RUN_TITLE } from './_parts/scenario';

export type StepKind = 'thinking' | 'tools' | 'waiting' | 'writing';

export type RunSentence = {
  step: PlanStep;
  kind: StepKind;
  /** The request a step waits on; while it is pending the step lifts out of the list. */
  approval?: ApprovalRequest;
};

type RunTiming = Pick<RunSnapshot, 'status' | 'startedAt' | 'endedAt'>;

const KINDS: StepKind[] = ['thinking', 'tools', 'waiting', 'writing'];

const KIND_LABEL: Record<StepKind, string> = {
  thinking: 'Thinking',
  tools: 'Tools',
  waiting: 'Waiting on you',
  writing: 'Writing',
};

const KIND_COLOR: Record<StepKind, string> = {
  thinking: 'var(--chart-3)',
  tools: 'var(--chart-1)',
  waiting: 'var(--warning)',
  writing: 'var(--chart-2)',
};

const RUN_STATUS_LOOK: Record<
  RunStatus,
  { label: string; variant: 'secondary' | 'success' | 'warning' }
> = {
  idle: { label: 'Not started', variant: 'secondary' },
  running: { label: 'Running', variant: 'secondary' },
  waiting: { label: 'Waiting on you', variant: 'warning' },
  done: { label: 'Done', variant: 'success' },
  failed: { label: 'Failed', variant: 'secondary' },
  cancelled: { label: 'Stopped', variant: 'secondary' },
};

const LIFT_Y = -3;

function isLiveRun(run: RunTiming) {
  const isRunning = run.status === 'running';
  const isWaiting = run.status === 'waiting';
  return isRunning || isWaiting;
}

function isPending(approval: ApprovalRequest | undefined) {
  if (!approval) {
    return false;
  }
  return approval.status === 'pending';
}

function pendingOf(approval: ApprovalRequest | undefined) {
  if (isPending(approval)) {
    return approval ?? null;
  }
  return null;
}

function markOf(status: StepStatus, isWaiting: boolean): CallStatus {
  if (isWaiting) {
    return 'waiting';
  }
  if (status === 'upcoming') {
    return 'queued';
  }
  if (status === 'skipped') {
    return 'done';
  }
  return status;
}

function liftOf(isLifted: boolean, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  if (isLifted) {
    return LIFT_Y;
  }
  return 0;
}

function rowSurfaceOf(isLifted: boolean, isDimmed: boolean) {
  if (isLifted) {
    return 'surface-raised';
  }
  if (isDimmed) {
    return 'opacity-55';
  }
  return 'opacity-100';
}

type KindTotals = Record<StepKind, number>;

type KindShare = {
  kind: StepKind;
  /** Where the kind starts on the bar and how much of it is its own, both from 0 to 1. */
  start: number;
  share: number;
};

/**
 * The bar and the tracks are drawn one step ahead and travel there at a constant speed, so one
 * transition plays per step. `GROW` below lasts exactly as long.
 */
const GROW_STEP_MS = 1000;

const MIN_TRACK_SHARE = 0.012;

const GROW =
  'transition-transform duration-1000 ease-linear motion-reduce:transition-none';

const GLIDE =
  'transition-transform duration-300 ease-(--ease-in-out-strong) motion-reduce:transition-none';

/** Without motion nothing travels, so nothing is drawn ahead of the present. */
function leadOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return GROW_STEP_MS;
}

function travelOf(isLive: boolean) {
  if (isLive) {
    return GROW;
  }
  return GLIDE;
}

function totalsOf(sentences: RunSentence[], now: number): KindTotals {
  const totals: KindTotals = { thinking: 0, tools: 0, waiting: 0, writing: 0 };
  for (const sentence of sentences) {
    const elapsed = elapsedOf(sentence.step, now);
    totals[sentence.kind] += elapsed;
  }
  return totals;
}

function sharesOf(totals: KindTotals): KindShare[] {
  let sum = 0;
  for (const kind of KINDS) {
    sum += totals[kind];
  }
  const whole = Math.max(1, sum);
  const shares: KindShare[] = [];
  let start = 0;
  for (const kind of KINDS) {
    const share = totals[kind] / whole;
    shares.push({ kind, start, share });
    start += share;
  }
  return shares;
}

/** A segment is the whole bar, moved to its start and scaled to its share: no width to lay out. */
function segmentStyleOf(segment: KindShare): React.CSSProperties {
  const offset = segment.start * 100;
  return {
    backgroundColor: KIND_COLOR[segment.kind],
    transform: `translateX(${offset}%) scaleX(${segment.share})`,
  };
}

/** A gap between two segments: a mark of the surface behind the bar, moved to where they meet. */
function boundaryStyleOf(segment: KindShare): React.CSSProperties {
  const offset = segment.start * 100;
  return { transform: `translateX(${offset}%)` };
}

function isInsideBar(segment: KindShare) {
  const isPastStart = segment.start > 0;
  const isBeforeEnd = segment.start < 1;
  return isPastStart && isBeforeEnd;
}

function isRunningKind(sentences: RunSentence[], kind: StepKind) {
  return sentences.some((sentence) => {
    const isKind = sentence.kind === kind;
    const isRunning = sentence.step.status === 'running';
    return isKind && isRunning;
  });
}

function kindTotalOf(sentences: RunSentence[], kind: StepKind, now: number) {
  let total = 0;
  for (const sentence of sentences) {
    if (sentence.kind === kind) {
      total += elapsedOf(sentence.step, now);
    }
  }
  return total;
}

type KindTimeProps = {
  sentences: RunSentence[];
  kind: StepKind;
  isLive: boolean;
};

/** Only the figure of the kind being spent ticks: the three others hold still. */
function KindTime({ sentences, kind, isLive }: KindTimeProps) {
  const isSpending = isRunningKind(sentences, kind);
  const isTicking = isLive && isSpending;
  const now = useLiveNow(100, isTicking);
  const total = kindTotalOf(sentences, kind, now);

  return (
    <span className='inline-block min-w-7 tabular-nums'>
      {formatDuration(total)}
    </span>
  );
}

function TimeSplit({
  sentences,
  run,
}: {
  sentences: RunSentence[];
  run: RunTiming;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isLive = isLiveRun(run);
  const now = useLiveNow(GROW_STEP_MS, isLive);
  const lead = leadOf(shouldReduceMotion);
  const reach = now + lead;
  const totals = totalsOf(sentences, reach);
  const shares = sharesOf(totals);
  const laterShares = shares.slice(1);
  const boundaries = laterShares.filter(isInsideBar);
  const travel = travelOf(isLive);

  return (
    <div className='flex flex-col gap-2.5'>
      <div
        aria-hidden='true'
        className='bg-foreground/[0.05] relative h-2.5 overflow-hidden rounded-full'
      >
        {shares.map((segment) => (
          <span
            key={segment.kind}
            className={cn('absolute inset-0 origin-left', travel)}
            style={segmentStyleOf(segment)}
          />
        ))}
        {boundaries.map((segment) => (
          <span
            key={segment.kind}
            className={cn('absolute inset-0', travel)}
            style={boundaryStyleOf(segment)}
          >
            <span className='bg-card absolute inset-y-0 -start-px w-0.5' />
          </span>
        ))}
      </div>
      <ul
        aria-label='Time by kind'
        className='flex flex-wrap gap-x-4 gap-y-1 text-xs'
      >
        {KINDS.map((kind) => (
          <li key={kind} className='flex items-center gap-1.5'>
            <span
              className='size-2 rounded-full'
              style={{ backgroundColor: KIND_COLOR[kind] }}
            />
            <span className='text-muted-foreground'>{KIND_LABEL[kind]}</span>
            <KindTime sentences={sentences} kind={kind} isLive={isLive} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function trackWholeOf(run: RunTiming, reach: number, windowMs: number) {
  const runStart = run.startedAt ?? reach;
  const runEnd = run.endedAt ?? reach;
  const spent = runEnd - runStart;
  return Math.max(1, spent, windowMs);
}

/** A track is the whole lane, moved to where its step starts and scaled to how long it took. */
function trackStyleOf(
  sentence: RunSentence,
  run: RunTiming,
  reach: number,
  windowMs: number
) {
  const whole = trackWholeOf(run, reach, windowMs);
  const runStart = run.startedAt ?? reach;
  const stepStart = sentence.step.startedAt ?? reach;
  const stepElapsed = elapsedOf(sentence.step, reach);
  const waited = stepStart - runStart;
  const startShare = waited / whole;
  const share = stepElapsed / whole;
  const shownShare = Math.max(share, MIN_TRACK_SHARE);
  const offset = startShare * 100;
  return {
    backgroundColor: KIND_COLOR[sentence.kind],
    transform: `translateX(${offset}%) scaleX(${shownShare})`,
    '--track-from': `${offset}%`,
  } as React.CSSProperties;
}

/** A step that is running starts from nothing, so its track is seen growing from the first frame. */
function trackBirthOf(isRunning: boolean) {
  if (isRunning) {
    return 'starting:[transform:translateX(var(--track-from))_scaleX(0)]';
  }
  return undefined;
}

function StepTrack({
  sentence,
  run,
  windowMs,
}: {
  sentence: RunSentence;
  run: RunTiming;
  windowMs: number;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isLive = isLiveRun(run);
  const isRunning = sentence.step.status === 'running';
  const now = useLiveNow(GROW_STEP_MS, isLive);
  const stepStart = sentence.step.startedAt ?? now;
  const present = Math.max(now, stepStart);
  const lead = leadOf(shouldReduceMotion);
  const reach = present + lead;
  const style = trackStyleOf(sentence, run, reach, windowMs);

  return (
    <span
      aria-hidden='true'
      className='bg-foreground/[0.06] relative block h-1 overflow-hidden rounded-full'
    >
      <span
        className={cn(
          'absolute inset-0 origin-left',
          travelOf(isLive),
          trackBirthOf(isRunning)
        )}
        style={style}
      />
    </span>
  );
}

function ApprovalAsk({
  approval,
  isApprovePressed,
  onApprove,
  onDeny,
}: {
  approval: ApprovalRequest;
  isApprovePressed: boolean;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}) {
  return (
    <div className='flex flex-col gap-3 pt-3'>
      <div className='bg-foreground/[0.03] rounded-lg p-3'>
        <p className='text-[13px] font-medium'>{approval.title}</p>
        {approval.detail && (
          <p className='text-muted-foreground mt-1 text-xs leading-5'>
            {approval.detail}
          </p>
        )}
      </div>
      <div className='flex items-center gap-3'>
        <Button
          type='button'
          size='sm'
          onClick={() => onApprove?.(approval.id)}
          className={pressedSolidOf(isApprovePressed)}
        >
          <CheckIcon />
          Approve
        </Button>
        <Button
          type='button'
          variant='link'
          size='sm'
          onClick={() => onDeny?.(approval.id)}
          className='px-0'
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

const WORD_SWAP = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1], layout: SPRING },
} as const;

const WORD_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, layout: INSTANT },
} as const;

function wordMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return WORD_FADE;
  }
  return WORD_SWAP;
}

/**
 * A step sentence wraps, so it rewrites itself word by word: a word that changed leaves and its
 * replacement rises in, a word that stayed slides to its new place, once per rewrite.
 */
function SentenceText({ text }: { text: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const wordMotion = wordMotionOf(shouldReduceMotion);
  const words = text.split(' ');

  return (
    <span className='relative min-w-0 flex-1 text-[13px] leading-5'>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true'>
        <AnimatePresence initial={false} mode='popLayout'>
          {words.map((word, index) => (
            <motion.span
              key={`${index}:${word}`}
              layout='position'
              layoutDependency={text}
              className='inline-block whitespace-pre'
              {...wordMotion}
            >
              {`${word} `}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}

type SentenceRowProps = {
  sentence: RunSentence;
  run: RunTiming;
  windowMs: number;
  isDimmed: boolean;
  isApprovePressed: boolean;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
};

function SentenceRow({
  sentence,
  run,
  windowMs,
  isDimmed,
  isApprovePressed,
  onApprove,
  onDeny,
}: SentenceRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const { step, approval } = sentence;
  const askingApproval = pendingOf(approval);
  const isLifted = askingApproval !== null;
  const isRunning = step.status === 'running';
  const isFailed = step.status === 'failed';
  const hasFailureDetail = isFailed && step.detail !== undefined;
  const hasStarted = step.startedAt !== undefined;
  const mark = markOf(step.status, isLifted);
  const liftY = liftOf(isLifted, shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);

  return (
    <motion.div
      animate={{ y: liftY }}
      transition={spring}
      className={cn(
        'relative rounded-xl px-2.5 py-2 transition-[background-color,box-shadow,opacity] duration-200 ease-(--ease-out-strong)',
        rowSurfaceOf(isLifted, isDimmed)
      )}
    >
      <div className='flex items-start gap-3'>
        <CallStatusMark status={mark} className='mt-0.5' />
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <div className='flex items-baseline justify-between gap-3'>
            <SentenceText text={step.title} />
            {hasStarted && (
              <LiveDuration
                item={step}
                isRunning={isRunning}
                className='text-muted-foreground min-w-8 shrink-0 text-end text-xs'
              />
            )}
          </div>
          {hasFailureDetail && (
            <p className='text-destructive-ink text-xs'>{step.detail}</p>
          )}
          <StepTrack sentence={sentence} run={run} windowMs={windowMs} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {askingApproval && (
          <motion.div
            key='ask'
            className='overflow-hidden ps-7'
            {...rowPresence}
          >
            <ApprovalAsk
              approval={askingApproval}
              isApprovePressed={isApprovePressed}
              onApprove={onApprove}
              onDeny={onDeny}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function hasStartedStep(sentence: RunSentence) {
  return sentence.step.status !== 'upcoming';
}

export type RunInSentencesProps = {
  title: string;
  run: RunTiming;
  sentences: RunSentence[];
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
  /**
   * How long each track spans from the start of the run. While the run fits in it a finished track
   * never moves and the running one only grows. Without it the tracks follow the length of the run.
   */
  windowMs?: number;
  /** Shows Approve held down, for a demonstration that presses it. */
  isApprovePressed?: boolean;
  className?: string;
};

export function RunInSentences({
  title,
  run,
  sentences,
  onApprove,
  onDeny,
  windowMs = 0,
  isApprovePressed = false,
  className,
}: RunInSentencesProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const startedSentences = sentences.filter(hasStartedStep);
  const hasLifted = startedSentences.some((sentence) =>
    isPending(sentence.approval)
  );
  const hasSteps = startedSentences.length > 0;
  const statusLook = RUN_STATUS_LOOK[run.status];
  const hasStarted = run.startedAt !== undefined;

  function isDimmed(sentence: RunSentence) {
    const isLifted = isPending(sentence.approval);
    return hasLifted && !isLifted;
  }

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-sm font-medium text-balance'>{title}</h3>
          {hasStarted && (
            <LiveDuration
              item={run}
              isRunning={isLiveRun(run)}
              className='text-muted-foreground text-xs'
            />
          )}
        </div>
        <Badge variant={statusLook.variant}>
          <Swap swapKey={run.status}>{statusLook.label}</Swap>
        </Badge>
      </header>
      <TimeSplit sentences={startedSentences} run={run} />
      <ol aria-label='Steps' className='-mx-2.5 flex flex-col'>
        <AnimatePresence initial={false}>
          {startedSentences.map((sentence) => (
            <motion.li key={sentence.step.id} {...rowPresence}>
              <SentenceRow
                sentence={sentence}
                run={run}
                windowMs={windowMs}
                isDimmed={isDimmed(sentence)}
                isApprovePressed={isApprovePressed}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      {!hasSteps && (
        <p className='text-muted-foreground text-[13px]'>
          The steps show here as the agent takes them
        </p>
      )}
    </section>
  );
}

const STEP_KINDS: Record<string, StepKind> = {
  scope: 'thinking',
  search: 'tools',
  page: 'tools',
  'page-again': 'tools',
  sheet: 'tools',
  compare: 'thinking',
  draft: 'writing',
  approve: 'waiting',
  send: 'tools',
  summary: 'writing',
};

function upcoming(id: string, title: string): PlanStep {
  return { id, title, status: 'upcoming' };
}

/** Each step is told in the present while it runs and rewritten in the past when it ends. */
const PLAN: PlanStep[] = [
  upcoming('scope', 'Working out what the review needs'),
  upcoming('search', 'Searching the web for Brightmoor prices'),
  upcoming('page', 'Reading the Brightmoor pricing page'),
  upcoming('page-again', 'Reading the pricing page again'),
  upcoming('sheet', 'Reading the Q3 invoices spreadsheet'),
  upcoming('compare', 'Comparing invoice lines with the list price'),
  upcoming('draft', 'Writing the email to Brightmoor accounts'),
  upcoming('approve', 'Waiting for you to approve the email'),
  upcoming('send', 'Sending the email to Brightmoor accounts'),
  upcoming('summary', 'Writing the summary for the finance team'),
];

const SEND_APPROVAL: ApprovalRequest = {
  id: 'send-email',
  title: 'Send the Q3 pricing review to accounts@brightmoor-supply.example',
  risk: 'medium',
  status: 'pending',
  detail: '186 words with the comparison attached. It asks for $1,840.20 back.',
};

const INITIAL_RUN = emptyRun({ id: 'brightmoor-sentences', title: RUN_TITLE });

function started(id: string): RunEvent {
  return { type: 'step.updated', id, patch: { status: 'running' } };
}

function ended(id: string, title: string): RunEvent {
  return { type: 'step.updated', id, patch: { status: 'done', title } };
}

const PAGE_FAILED: RunEvent = {
  type: 'step.updated',
  id: 'page',
  patch: {
    status: 'failed',
    title: 'Could not read the Brightmoor pricing page',
    detail: PAGE_ERROR,
  },
};

const APPROVED = batchOf(
  { type: 'approval.resolved', id: SEND_APPROVAL.id, decision: 'approved' },
  ended('approve', 'You approved the email')
);

const DENIED = batchOf(
  { type: 'approval.resolved', id: SEND_APPROVAL.id, decision: 'denied' },
  {
    type: 'step.updated',
    id: 'approve',
    patch: {
      status: 'failed',
      title: 'You stopped the email',
      detail: 'The draft stays in the outbox',
    },
  },
  { type: 'run.finished', status: 'cancelled' }
);

/** A request that waits on a person is answered by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

function hasDecided(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  return pending.length === 0;
}

function isStopped(run: RunSnapshot) {
  return run.status === 'cancelled';
}

const SCRIPT: RunStep[] = [
  batch(
    400,
    { type: 'run.started' },
    { type: 'plan.set', steps: PLAN },
    started('scope')
  ),
  batch(
    900,
    ended('scope', 'Worked out what the review needs'),
    started('search')
  ),
  batch(
    1000,
    ended('search', 'Searched the web for Brightmoor prices'),
    started('page')
  ),
  batch(600, PAGE_FAILED),
  batch(200, started('page-again')),
  batch(
    800,
    ended('page-again', 'Read the pricing page again'),
    started('sheet')
  ),
  batch(
    700,
    ended('sheet', 'Read the Q3 invoices spreadsheet'),
    started('compare')
  ),
  batch(
    800,
    ended('compare', 'Found six invoice lines above the list price'),
    started('draft')
  ),
  batch(
    1400,
    ended('draft', 'Wrote the email to Brightmoor accounts'),
    started('approve'),
    { type: 'approval.requested', approval: SEND_APPROVAL }
  ),
  {
    after: DECIDE_AFTER_MS,
    by: 'person',
    press: 'approve',
    action: APPROVED,
    isAnswered: hasDecided,
  },
  batch(300, started('send')),
  batch(
    600,
    ended('send', 'Sent the email to Brightmoor accounts'),
    started('summary')
  ),
  batch(1000, ended('summary', 'Wrote the summary for the finance team'), {
    type: 'run.finished',
    status: 'done',
  }),
];

/** The run takes about eleven seconds with its approval, so every track fits in a window that never moves. */
const WINDOW_MS = 12_000;

const SESSION = {
  reducer: reduceBatch,
  initial: INITIAL_RUN,
  resting: restingOf(INITIAL_RUN, SCRIPT, applyBatchAt),
  script: SCRIPT,
  loopAfter: 3000,
  holdWhile: isStopped,
};

function sentencesOf(run: RunSnapshot): RunSentence[] {
  const approval = run.approvals.find(
    (request) => request.id === SEND_APPROVAL.id
  );
  return run.plan.map((step) => {
    const kind = STEP_KINDS[step.id] ?? 'thinking';
    if (step.id === 'approve') {
      return { step, kind, approval };
    }
    return { step, kind };
  });
}

function announcementOf(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  const [first] = pending;
  if (first) {
    return `Waiting on you: ${first.title}`;
  }
  if (run.status === 'done') {
    return 'The run finished';
  }
  if (run.status === 'cancelled') {
    return 'The run stopped before sending the email';
  }
  const running = run.plan.find((step) => step.status === 'running');
  if (running) {
    return running.title;
  }
  return '';
}

export default function Run03() {
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const isEnded = state.endedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;
  const sentences = sentencesOf(state);
  const announcement = announcementOf(state);

  function approve() {
    act(APPROVED);
  }

  function deny() {
    act(DENIED);
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[53.5rem] w-full max-w-[36rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <RunInSentences
          title={state.title}
          run={state}
          sentences={sentences}
          onApprove={approve}
          onDeny={deny}
          windowMs={WINDOW_MS}
          isApprovePressed={pressed === 'approve'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
