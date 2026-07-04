'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { RunScriptStep } from '@/registry/ndeko/hooks/use-agent-run';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  pendingApprovalsOf,
  type ApprovalRequest,
  type CallStatus,
  type PlanStep,
  type RunSnapshot,
  type RunStatus,
  type StepStatus,
} from '@/registry/ndeko/lib/agent-run';
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
import { rowPresenceOf, springOf } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { PAGE_ERROR, RUN_TITLE } from './_parts/scenario';
import { useDemoRun } from '@/registry/ndeko/hooks/use-demo-run';

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

function totalsOf(sentences: RunSentence[], now: number): KindTotals {
  const totals: KindTotals = { thinking: 0, tools: 0, waiting: 0, writing: 0 };
  for (const sentence of sentences) {
    const elapsed = elapsedOf(sentence.step, now);
    totals[sentence.kind] += elapsed;
  }
  return totals;
}

function shareStyleOf(kind: StepKind, total: number): React.CSSProperties {
  return { flexGrow: total, backgroundColor: KIND_COLOR[kind] };
}

function TimeSplit({
  sentences,
  run,
}: {
  sentences: RunSentence[];
  run: RunTiming;
}) {
  const now = useLiveNow(100, isLiveRun(run));
  const totals = totalsOf(sentences, now);
  const spentKinds = KINDS.filter((kind) => totals[kind] > 0);

  return (
    <div className='flex flex-col gap-2.5'>
      <div
        aria-hidden='true'
        className='bg-foreground/[0.05] flex h-2.5 gap-0.5 overflow-hidden rounded-full'
      >
        {spentKinds.map((kind) => (
          <span
            key={kind}
            className='h-full basis-0 rounded-[2px] first:rounded-s-full last:rounded-e-full'
            style={shareStyleOf(kind, totals[kind])}
          />
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
            <span className='tabular-nums'>{formatDuration(totals[kind])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function trackStyleOf(
  sentence: RunSentence,
  run: RunTiming,
  now: number
): React.CSSProperties {
  const runStart = run.startedAt ?? now;
  const runEnd = run.endedAt ?? now;
  const total = Math.max(1, runEnd - runStart);
  const stepStart = sentence.step.startedAt ?? now;
  const stepElapsed = elapsedOf(sentence.step, now);
  const offset = stepStart - runStart;
  const left = (offset / total) * 100;
  const width = (stepElapsed / total) * 100;
  return {
    left: `${left}%`,
    width: `${width}%`,
    backgroundColor: KIND_COLOR[sentence.kind],
  };
}

function StepTrack({
  sentence,
  run,
}: {
  sentence: RunSentence;
  run: RunTiming;
}) {
  const now = useLiveNow(100, isLiveRun(run));
  const style = trackStyleOf(sentence, run, now);

  return (
    <span
      aria-hidden='true'
      className='bg-foreground/[0.06] relative block h-1 overflow-hidden rounded-full'
    >
      <span className='absolute inset-y-0 min-w-1 rounded-full' style={style} />
    </span>
  );
}

function ApprovalAsk({
  approval,
  onApprove,
  onDeny,
}: {
  approval: ApprovalRequest;
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

const SENTENCE_SWAP = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
} as const;

const SENTENCE_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function sentenceMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return SENTENCE_FADE;
  }
  return SENTENCE_SWAP;
}

/** WordRoll never wraps and a step sentence must, so a changed sentence crossfades instead. */
function SentenceText({ text }: { text: string }) {
  const shouldReduceMotion = useReducedMotion();
  const sentenceMotion = sentenceMotionOf(shouldReduceMotion);

  return (
    <span className='relative min-w-0 flex-1 text-[13px] leading-5'>
      <AnimatePresence initial={false} mode='popLayout'>
        <motion.span key={text} className='block' {...sentenceMotion}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type SentenceRowProps = {
  sentence: RunSentence;
  run: RunTiming;
  isDimmed: boolean;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
};

function SentenceRow({
  sentence,
  run,
  isDimmed,
  onApprove,
  onDeny,
}: SentenceRowProps) {
  const shouldReduceMotion = useReducedMotion();
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
                className='text-muted-foreground shrink-0 text-xs'
              />
            )}
          </div>
          {hasFailureDetail && (
            <p className='text-destructive-ink text-xs'>{step.detail}</p>
          )}
          <StepTrack sentence={sentence} run={run} />
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
  className?: string;
};

export function RunInSentences({
  title,
  run,
  sentences,
  onApprove,
  onDeny,
  className,
}: RunInSentencesProps) {
  const shouldReduceMotion = useReducedMotion();
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
                isDimmed={isDimmed(sentence)}
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

const PLAN: PlanStep[] = [
  upcoming('scope', 'Worked out what the review needs'),
  upcoming('search', 'Searched the web for Brightmoor prices'),
  upcoming('page', 'Read the Brightmoor pricing page'),
  upcoming('page-again', 'Read the pricing page again'),
  upcoming('sheet', 'Read the Q3 invoices spreadsheet'),
  upcoming('compare', 'Found six invoice lines above the list price'),
  upcoming('draft', 'Wrote the email to Brightmoor accounts'),
  upcoming('approve', 'Waiting for you to approve the email'),
  upcoming('send', 'Sent the email to Brightmoor accounts'),
  upcoming('summary', 'Wrote the summary for the finance team'),
];

const SEND_APPROVAL: ApprovalRequest = {
  id: 'send-email',
  title: 'Send the Q3 pricing review to accounts@brightmoor-supply.example',
  risk: 'medium',
  status: 'pending',
  detail: '186 words with the comparison attached. It asks for $1,840.20 back.',
};

const INITIAL_RUN = emptyRun({ id: 'brightmoor-sentences', title: RUN_TITLE });

function stepTo(
  id: string,
  status: StepStatus,
  detail?: string
): RunScriptStep['event'] {
  if (detail) {
    return { type: 'step.updated', id, patch: { status, detail } };
  }
  return { type: 'step.updated', id, patch: { status } };
}

const SCRIPT: RunScriptStep[] = [
  { after: 400, event: { type: 'run.started' } },
  { after: 0, event: { type: 'plan.set', steps: PLAN } },
  { after: 0, event: stepTo('scope', 'running') },
  { after: 900, event: stepTo('scope', 'done') },
  { after: 0, event: stepTo('search', 'running') },
  { after: 1000, event: stepTo('search', 'done') },
  { after: 0, event: stepTo('page', 'running') },
  { after: 600, event: stepTo('page', 'failed', PAGE_ERROR) },
  { after: 200, event: stepTo('page-again', 'running') },
  { after: 800, event: stepTo('page-again', 'done') },
  { after: 0, event: stepTo('sheet', 'running') },
  { after: 700, event: stepTo('sheet', 'done') },
  { after: 0, event: stepTo('compare', 'running') },
  { after: 800, event: stepTo('compare', 'done') },
  { after: 0, event: stepTo('draft', 'running') },
  { after: 1400, event: stepTo('draft', 'done') },
  { after: 0, event: stepTo('approve', 'running') },
  { after: 0, event: { type: 'approval.requested', approval: SEND_APPROVAL } },
  { after: 300, event: stepTo('send', 'running') },
  { after: 600, event: stepTo('send', 'done') },
  { after: 0, event: stepTo('summary', 'running') },
  { after: 1000, event: stepTo('summary', 'done') },
  { after: 0, event: { type: 'run.finished', status: 'done' } },
];

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

function isWaitingOrStopped(run: RunSnapshot) {
  const pending = pendingApprovalsOf(run);
  const isWaiting = pending.length > 0;
  const isStopped = run.status === 'cancelled';
  return isWaiting || isStopped;
}

export default function Run03() {
  const { ref, isInView, snapshot, store, restart } = useDemoRun(SCRIPT, {
    initial: INITIAL_RUN,
    holdWhile: isWaitingOrStopped,
  });
  const isEnded = snapshot.endedAt !== undefined;
  const sentences = sentencesOf(snapshot);
  const announcement = announcementOf(snapshot);

  function approve(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'approved',
    });
    store.dispatch({
      type: 'step.updated',
      id: 'approve',
      patch: { status: 'done', title: 'You approved the email' },
    });
  }

  function deny(approvalId: string) {
    store.dispatch({
      type: 'approval.resolved',
      id: approvalId,
      decision: 'denied',
    });
    store.dispatch({
      type: 'step.updated',
      id: 'approve',
      patch: {
        status: 'failed',
        title: 'You stopped the email',
        detail: 'The draft stays in the outbox',
      },
    });
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
  }

  return (
    <div ref={ref} className='flex w-full max-w-[36rem] flex-col gap-2'>
      <ClockGate isActive={isInView}>
        <RunInSentences
          title={snapshot.title}
          run={snapshot}
          sentences={sentences}
          onApprove={approve}
          onDeny={deny}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={isEnded} onReplay={restart} />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
