'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  seriesColorOf,
  type ApprovalRequest,
  type RunAgent,
} from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  CircleXIcon,
  FileTextIcon,
  MailIcon,
  RotateCcwIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  risePresenceOf,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

export type ApprovalPreview =
  | { kind: 'email'; to: string; subject: string; body: string }
  | { kind: 'file'; path: string; lines: string[] };

/** Where a request is: waiting, being approved, approved (check shown), then folded into its trace. */
export type ApprovalPhase =
  'waiting' | 'approving' | 'confirmed' | 'approved' | 'denied';

export type ApprovalEntry = {
  request: ApprovalRequest;
  agent: Pick<RunAgent, 'name' | 'series'>;
  preview: ApprovalPreview;
  /** The verb of the outcome for the trace line: "Sent", "Written". */
  outcome: string;
  phase: ApprovalPhase;
  reason?: string;
  canUndo?: boolean;
};

const MAX_PEEKS = 2;

const RECENT_MS = 60_000;

function isWaitingPhase(phase: ApprovalPhase) {
  const isWaiting = phase === 'waiting';
  const isApproving = phase === 'approving';
  const isConfirmed = phase === 'confirmed';
  return isWaiting || isApproving || isConfirmed;
}

function isDecided(entry: ApprovalEntry) {
  return !isWaitingPhase(entry.phase);
}

function resolvedAtOf(entry: ApprovalEntry) {
  return entry.request.resolvedAt ?? 0;
}

function byResolvedAt(first: ApprovalEntry, second: ApprovalEntry) {
  return resolvedAtOf(first) - resolvedAtOf(second);
}

function approveStateOf(phase: ApprovalPhase): MorphState {
  if (phase === 'approving') {
    return 'busy';
  }
  if (phase === 'confirmed') {
    return 'done';
  }
  return 'idle';
}

const APPROVE_LABELS: Record<MorphState, string> = {
  idle: 'Approve',
  busy: 'Approving',
  done: 'Approved',
};

/** Once the approval went through, the key is no longer an action: it wears the result. */
const APPROVED_LOOK =
  'bg-success/15 text-success-foreground shadow-none ring-0';

function approveLookOf(phase: ApprovalPhase, isPressed: boolean) {
  if (phase === 'confirmed') {
    return APPROVED_LOOK;
  }
  return pressedSolidOf(isPressed);
}

function isTypingTarget(target: EventTarget) {
  const isElement = target instanceof HTMLElement;
  if (!isElement) {
    return false;
  }
  const isField = target.matches('input, textarea, [contenteditable="true"]');
  return isField;
}

function waitingWordsOf(count: number): WordRollWord[] {
  if (count === 0) {
    return ['Nothing', 'waiting'];
  }
  const countWord = {
    key: 'count',
    text: String(count),
    node: <MotionNumber value={count} />,
  };
  return [countWord, 'waiting'];
}

function relativeTimeOf(resolvedAt: number, now: number) {
  const elapsed = now - resolvedAt;
  if (elapsed < RECENT_MS) {
    return 'just now';
  }
  const minutes = Math.floor(elapsed / RECENT_MS);
  if (minutes === 1) {
    return '1 min ago';
  }
  return `${minutes} min ago`;
}

function RelativeTime({ resolvedAt }: { resolvedAt: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref);
  const now = useNow(1000, isInView);
  const label = relativeTimeOf(resolvedAt, now);
  return (
    <span ref={ref} className='tabular-nums'>
      {label}
    </span>
  );
}

function traceTextOf(entry: ApprovalEntry) {
  if (entry.phase === 'approved') {
    return `${entry.outcome} by ${entry.agent.name}, approved by you,`;
  }
  return `Denied by you,`;
}

function TraceRow({
  entry,
  onUndo,
}: {
  entry: ApprovalEntry;
  onUndo?: (requestId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const isApproved = entry.phase === 'approved';
  const hasReason = Boolean(entry.reason);
  const canUndo = entry.canUndo === true;

  return (
    <div className='flex min-h-9 items-center gap-2.5 px-1 text-xs'>
      {isApproved && (
        <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
      )}
      {!isApproved && (
        <CircleXIcon className='text-muted-foreground size-3.5 shrink-0' />
      )}
      <p className='text-muted-foreground min-w-0 flex-1 leading-5'>
        <span className='text-foreground'>{entry.request.title}.</span>{' '}
        {traceTextOf(entry)} <RelativeTime resolvedAt={resolvedAtOf(entry)} />
        {hasReason && <span>: &ldquo;{entry.reason}&rdquo;</span>}
      </p>
      <AnimatePresence initial={false}>
        {canUndo && (
          <motion.span key='undo' className='shrink-0' {...risePresence}>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onUndo?.(entry.request.id)}
              aria-label={`Undo the decision on ${entry.request.title}`}
              className='relative overflow-hidden'
            >
              <RotateCcwIcon />
              Undo
              <span
                aria-hidden='true'
                className='bg-foreground/25 absolute inset-x-2 bottom-1 h-px origin-left scale-x-0 transition-transform duration-[5000ms] ease-linear starting:scale-x-100'
              />
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmailPreview({
  preview,
}: {
  preview: Extract<ApprovalPreview, { kind: 'email' }>;
}) {
  return (
    <div className='bg-foreground/[0.03] flex flex-col gap-2 rounded-lg p-3 text-xs'>
      <dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
        <dt className='text-muted-foreground'>To</dt>
        <dd className='min-w-0 truncate'>{preview.to}</dd>
        <dt className='text-muted-foreground'>Subject</dt>
        <dd className='min-w-0 truncate font-medium'>{preview.subject}</dd>
      </dl>
      <p className='text-foreground/85 leading-5 whitespace-pre-line'>
        {preview.body}
      </p>
    </div>
  );
}

function FilePreview({
  preview,
}: {
  preview: Extract<ApprovalPreview, { kind: 'file' }>;
}) {
  return (
    <div className='bg-foreground/[0.03] flex flex-col gap-1.5 rounded-lg p-3'>
      <p className='text-muted-foreground font-mono text-xs'>{preview.path}</p>
      <pre className='overflow-x-auto font-mono text-xs leading-5'>
        {preview.lines.map((line, index) => (
          <span key={index} className='block'>
            <span className='text-success-foreground select-none'>+ </span>
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

function PreviewOf({ preview }: { preview: ApprovalPreview }) {
  if (preview.kind === 'email') {
    return <EmailPreview preview={preview} />;
  }
  return <FilePreview preview={preview} />;
}

function PreviewIcon({ preview }: { preview: ApprovalPreview }) {
  if (preview.kind === 'email') {
    return <MailIcon className='size-3.5' />;
  }
  return <FileTextIcon className='size-3.5' />;
}

type RequestCardProps = {
  entry: ApprovalEntry;
  isApprovePressed: boolean;
  onApprove?: (requestId: string) => void;
  onDeny?: (requestId: string, reason: string) => void;
};

function RequestCard({
  entry,
  isApprovePressed,
  onApprove,
  onDeny,
}: RequestCardProps) {
  const [isDenying, setIsDenying] = useState(false);
  const [reason, setReason] = useState('');
  const reasonId = useId();
  const titleId = useId();
  const { request, agent, preview } = entry;
  const isBusy = entry.phase !== 'waiting';
  const chipColor = seriesColorOf(agent.series);

  function approve() {
    if (isBusy) {
      return;
    }
    setIsDenying(false);
    onApprove?.(request.id);
  }

  function openDeny() {
    if (isBusy) {
      return;
    }
    setIsDenying(true);
  }

  function closeDeny() {
    setIsDenying(false);
    setReason('');
  }

  function sendDeny() {
    const trimmed = reason.trim();
    onDeny?.(request.id, trimmed);
  }

  function skipReason() {
    onDeny?.(request.id, '');
  }

  function changeReason(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setReason(event.target.value);
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isDenying) {
      event.preventDefault();
      closeDeny();
      return;
    }
    if (isTypingTarget(event.target)) {
      return;
    }
    const key = event.key.toLowerCase();
    const hasCommandKey = event.metaKey || event.ctrlKey;
    const hasModifier = hasCommandKey || event.altKey;
    if (hasModifier) {
      return;
    }
    if (key === 'a') {
      event.preventDefault();
      approve();
      return;
    }
    if (key === 'd') {
      event.preventDefault();
      openDeny();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-keys`}
      onKeyDown={decideFromKeys}
      className='surface-raised focus-visible:ring-ring/25 @container relative flex flex-col gap-3 rounded-xl p-4 outline-none focus-visible:ring-[3px]'
    >
      <div className='flex items-center gap-2'>
        <Chip color={chipColor}>{agent.name}</Chip>
        <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <PreviewIcon preview={preview} />
          asks you first
        </span>
      </div>
      <p id={titleId} className='text-sm font-medium text-balance'>
        {request.title}
      </p>
      <PreviewOf preview={preview} />
      <AnimatedSize>
        {isDenying && (
          <div className='flex flex-col gap-2 pb-1'>
            <label htmlFor={reasonId} className='text-xs font-medium'>
              Tell {agent.name} why{' '}
              <span className='text-muted-foreground font-normal'>
                (optional)
              </span>
            </label>
            <Textarea
              id={reasonId}
              value={reason}
              onChange={changeReason}
              placeholder='Wait until Dana confirms the figures'
              autoFocus
            />
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={sendDeny}
              >
                Send and deny
              </Button>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={skipReason}
              >
                Deny without a reason
              </Button>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={closeDeny}
                className='text-muted-foreground ms-auto'
              >
                Back
              </Button>
            </div>
          </div>
        )}
        {!isDenying && (
          <div className='flex items-center gap-2'>
            <MorphButton
              type='button'
              size='sm'
              state={approveStateOf(entry.phase)}
              labels={APPROVE_LABELS}
              onClick={approve}
              className={approveLookOf(entry.phase, isApprovePressed)}
            />
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={openDeny}
              disabled={isBusy}
            >
              Deny
            </Button>
            <span
              id={`${titleId}-keys`}
              className='text-muted-foreground ms-auto hidden items-center gap-1 text-xs @sm:flex'
            >
              <Kbd>A</Kbd> approves, <Kbd>D</Kbd> denies
            </span>
          </div>
        )}
      </AnimatedSize>
    </div>
  );
}

function peekStyleOf(depth: number): React.CSSProperties {
  const scale = 1 - depth * 0.04;
  const offset = depth * 7;
  return { transform: `translateY(${offset}px) scale(${scale})` };
}

function peekLayerStyleOf(
  depth: number,
  peekRoom: number
): React.CSSProperties {
  const placement = peekStyleOf(depth);
  return { ...placement, bottom: peekRoom, zIndex: -depth };
}

function peeksOf(waitingCount: number) {
  const behind = Math.max(0, waitingCount - 1);
  const shown = Math.min(behind, MAX_PEEKS);
  return Array.from({ length: shown }, (_, index) => index + 1);
}

export type ApprovalPromptProps = {
  entries: ApprovalEntry[];
  onApprove?: (requestId: string) => void;
  onDeny?: (requestId: string, reason: string) => void;
  onUndo?: (requestId: string) => void;
  /** Shown when nothing waits, for example to load more requests. */
  emptyAction?: React.ReactNode;
  /** Shows Approve held down on the request in front, for a demonstration that presses it. */
  isApprovePressed?: boolean;
  className?: string;
};

export function ApprovalPrompt({
  entries,
  onApprove,
  onDeny,
  onUndo,
  emptyAction,
  isApprovePressed = false,
  className,
}: ApprovalPromptProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const risePresence = risePresenceOf(shouldReduceMotion);
  const titleId = useId();
  const waiting = entries.filter((entry) => isWaitingPhase(entry.phase));
  const decided = entries.filter(isDecided);
  const traces = [...decided].sort(byResolvedAt);
  const [front] = waiting;
  const peeks = peeksOf(waiting.length);
  const waitingWords = waitingWordsOf(waiting.length);
  const peekRoom = peeks.length * 7;

  return (
    <section
      aria-labelledby={titleId}
      className={cn('flex flex-col gap-3', className)}
    >
      <header className='flex items-center justify-between gap-3 px-1'>
        <h3 id={titleId} className='text-sm font-medium'>
          Waiting for you
        </h3>
        <span className='text-muted-foreground text-xs'>
          <WordRoll words={waitingWords} />
        </span>
      </header>

      <ul aria-label='Decisions' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {traces.map((entry) => (
            <motion.li
              key={entry.request.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <TraceRow entry={entry} onUndo={onUndo} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className='relative isolate' style={{ paddingBottom: peekRoom }}>
        <AnimatePresence initial={false}>
          {peeks.map((depth) => (
            <motion.span
              key={depth}
              aria-hidden='true'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='surface-raised absolute inset-x-0 top-0 rounded-xl transition-transform duration-300 ease-(--ease-out-strong)'
              style={peekLayerStyleOf(depth, peekRoom)}
            />
          ))}
        </AnimatePresence>
        <AnimatePresence initial={false} mode='popLayout'>
          {front && (
            <motion.div key={front.request.id} {...risePresence}>
              <RequestCard
                entry={front}
                isApprovePressed={isApprovePressed}
                onApprove={onApprove}
                onDeny={onDeny}
              />
            </motion.div>
          )}
          {!front && (
            <motion.div
              key='empty'
              className='hairline-border border-foreground/20 flex flex-col items-center gap-3 rounded-xl border-dashed px-4 py-8 text-center'
              {...risePresence}
            >
              <p className='text-muted-foreground text-[13px]'>
                Nothing waits for you. New requests show up here.
              </p>
              {emptyAction}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

const WRITER: Pick<RunAgent, 'name' | 'series'> = { name: 'Writer', series: 3 };

const CODER: Pick<RunAgent, 'name' | 'series'> = { name: 'Coder', series: 5 };

const INITIAL_ENTRIES: ApprovalEntry[] = [
  {
    request: {
      id: 'send-review',
      title: 'Send the Q3 pricing review to Brightmoor accounts',
      risk: 'medium',
      status: 'pending',
    },
    agent: WRITER,
    outcome: 'Sent',
    phase: 'waiting',
    preview: {
      kind: 'email',
      to: 'accounts@brightmoor-supply.example',
      subject: 'Q3 pricing review: six lines above list price',
      body: 'Hello Dana,\nOur Q3 invoices show six lines billed above your published list price, $1,840.20 in total. The comparison is attached. Could you credit it on the next invoice?',
    },
  },
  {
    request: {
      id: 'write-note',
      title: 'Write the vendor note to vendors/brightmoor.md',
      risk: 'low',
      status: 'pending',
    },
    agent: CODER,
    outcome: 'Written',
    phase: 'waiting',
    preview: {
      kind: 'file',
      path: 'vendors/brightmoor.md',
      lines: [
        '## Q3 review',
        '- Six invoice lines above the list price',
        '- Credit of $1,840.20 requested on Nov 11',
      ],
    },
  },
];

const APPROVING_MS = 700;

const CONFIRMED_MS = 500;

const UNDO_MS = 5000;

type EntryPatch = Partial<Omit<ApprovalEntry, 'request'>> & {
  request?: Partial<ApprovalRequest>;
};

function patched(entry: ApprovalEntry, patch: EntryPatch): ApprovalEntry {
  const request = { ...entry.request, ...patch.request };
  return { ...entry, ...patch, request };
}

function titleOf(entries: ApprovalEntry[], requestId: string) {
  const entry = entries.find((candidate) => candidate.request.id === requestId);
  return entry?.request.title ?? '';
}

/** A request that waits on a person is approved by the demonstration after this long. */
const DECIDE_AFTER_MS = 2500;

type PressKey = 'approve';

export default function Review01() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES);
  const [message, setMessage] = useState('');
  const { schedule, clearAll } = useTimeouts();
  const { pressed, press } = usePress<PressKey>();

  function update(requestId: string, patch: EntryPatch) {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.request.id !== requestId) {
          return entry;
        }
        return patched(entry, patch);
      })
    );
  }

  /** A decision undone and taken again keeps its own window: only the matching decision closes. */
  function closeUndo(requestId: string, resolvedAt: number) {
    setEntries((current) =>
      current.map((entry) => {
        const isTarget = entry.request.id === requestId;
        const isSameDecision = entry.request.resolvedAt === resolvedAt;
        if (isTarget && isSameDecision) {
          return { ...entry, canUndo: false };
        }
        return entry;
      })
    );
  }

  function approve(requestId: string) {
    update(requestId, { phase: 'approving' });
    schedule(() => update(requestId, { phase: 'confirmed' }), APPROVING_MS);
    const foldDelay = APPROVING_MS + CONFIRMED_MS;
    schedule(() => {
      const resolvedAt = Date.now();
      update(requestId, {
        phase: 'approved',
        canUndo: true,
        request: { status: 'approved', resolvedAt },
      });
      setMessage(`Approved: ${titleOf(entries, requestId)}`);
      schedule(() => closeUndo(requestId, resolvedAt), UNDO_MS);
    }, foldDelay);
  }

  function deny(requestId: string, reason: string) {
    const resolvedAt = Date.now();
    update(requestId, {
      phase: 'denied',
      reason,
      canUndo: true,
      request: { status: 'denied', resolvedAt },
    });
    setMessage(`Denied: ${titleOf(entries, requestId)}`);
    schedule(() => closeUndo(requestId, resolvedAt), UNDO_MS);
  }

  function undo(requestId: string) {
    update(requestId, {
      phase: 'waiting',
      reason: undefined,
      canUndo: false,
      request: { status: 'pending', resolvedAt: undefined },
    });
    setMessage(`Undone: ${titleOf(entries, requestId)} waits for you again`);
  }

  function reset() {
    clearAll();
    setEntries(INITIAL_ENTRIES);
    setMessage('Two requests wait for you again');
  }

  const approveTime = APPROVING_MS + CONFIRMED_MS;
  const nextAfter = approveTime + DECIDE_AFTER_MS;
  const restAfter = approveTime + 2600;
  const steps: AutoplayStep[] = [
    { after: DECIDE_AFTER_MS, run: () => press('approve') },
    { after: PRESS_LEAD_MS, run: () => approve('send-review') },
    { after: nextAfter, run: () => press('approve') },
    { after: PRESS_LEAD_MS, run: () => approve('write-note') },
    { after: restAfter, run: hold },
  ];
  const { ref, isInView, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 3000,
    onReset: reset,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[27.5rem] w-full max-w-[28rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ApprovalPrompt
          entries={entries}
          onApprove={approve}
          onDeny={deny}
          onUndo={undo}
          isApprovePressed={pressed === 'approve'}
          emptyAction={
            <Button type='button' variant='outline' size='sm' onClick={reset}>
              <RotateCcwIcon />
              Bring the requests back
            </Button>
          }
        />
      </ClockGate>
      <LiveRegion message={spokenUnless(isAutoplaying, message)} />
    </div>
  );
}
