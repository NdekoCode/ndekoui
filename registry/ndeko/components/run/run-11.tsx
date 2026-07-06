'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  StopIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { useOpenState } from './_parts/use-open-state';
import {
  useInterval,
  useIsOwnClockOn,
  useTimeout,
} from './_parts/use-own-clock';

export type RetryPhase = 'waiting' | 'retrying' | 'recovered' | 'stopped';

const RING_SIZE = 36;

const RING_STROKE = 3;

const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

const RING_CENTER = RING_SIZE / 2;

const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const SPINNING_SHARE = 0.28;

const WAITING_RING = 'stroke-warning duration-1000 ease-linear';

const RETRYING_RING = 'stroke-primary duration-500 ease-(--ease-out-strong)';

const QUIET_RING = 'stroke-transparent duration-300 ease-(--ease-out-strong)';

function ringFillOf(phase: RetryPhase) {
  if (phase === 'waiting') {
    return WAITING_RING;
  }
  if (phase === 'retrying') {
    return RETRYING_RING;
  }
  return QUIET_RING;
}

/** The ring runs one second ahead of the figure, so it is empty the moment the next try starts. */
function ringShareOf(
  phase: RetryPhase,
  secondsLeft: number,
  waitSeconds: number
) {
  if (phase === 'retrying') {
    return SPINNING_SHARE;
  }
  if (phase !== 'waiting') {
    return 0;
  }
  const secondsAfterThisOne = Math.max(0, secondsLeft - 1);
  return secondsAfterThisOne / waitSeconds;
}

function spinOf(phase: RetryPhase) {
  if (phase === 'retrying') {
    return 'animate-spin';
  }
  return undefined;
}

type CountdownRingProps = {
  phase: RetryPhase;
  secondsLeft: number;
  waitSeconds: number;
};

function CountdownRing({
  phase,
  secondsLeft,
  waitSeconds,
}: CountdownRingProps) {
  const share = ringShareOf(phase, secondsLeft, waitSeconds);
  const dashOffset = CIRCUMFERENCE * (1 - share);

  return (
    <span aria-hidden='true' className={cn('inline-flex', spinOf(phase))}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className='-rotate-90'
      >
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill='none'
          strokeWidth={RING_STROKE}
          className='stroke-foreground/10'
        />
        <circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill='none'
          strokeWidth={RING_STROKE}
          strokeLinecap='round'
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-[stroke-dashoffset,stroke] motion-reduce:transition-none',
            ringFillOf(phase)
          )}
        />
      </svg>
    </span>
  );
}

function RingCenter({
  phase,
  secondsLeft,
}: {
  phase: RetryPhase;
  secondsLeft: number;
}) {
  if (phase === 'waiting') {
    return (
      <span className='text-warning-foreground text-xs font-medium tabular-nums'>
        {secondsLeft}
      </span>
    );
  }
  if (phase === 'retrying') {
    return <RefreshCwIcon className='text-primary-ink size-3.5' />;
  }
  if (phase === 'recovered') {
    return <DrawnCheck tone='success' entrance='draw' label='Recovered' />;
  }
  return <StopIcon className='text-muted-foreground size-3.5' />;
}

function PhaseWords({
  phase,
  secondsLeft,
}: {
  phase: RetryPhase;
  secondsLeft: number;
}) {
  if (phase === 'waiting') {
    return <span className='tabular-nums'>Next try in {secondsLeft}s</span>;
  }
  if (phase === 'retrying') {
    return <span>Trying now</span>;
  }
  if (phase === 'recovered') {
    return <span>Back on track</span>;
  }
  return <span>No more automatic tries</span>;
}

function headlineOf(phase: RetryPhase, title: string, recoveredTitle: string) {
  if (phase === 'waiting') {
    return title;
  }
  if (phase === 'retrying') {
    return 'Trying again';
  }
  if (phase === 'recovered') {
    return recoveredTitle;
  }
  return 'Stopped retrying';
}

function attemptBadgeOf(phase: RetryPhase) {
  if (phase === 'recovered') {
    return 'success';
  }
  return 'secondary';
}

function primaryLabelOf(phase: RetryPhase) {
  if (phase === 'stopped') {
    return 'Try again';
  }
  return 'Retry now';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

export type RetryCardProps = {
  phase: RetryPhase;
  /** The attempt that failed last while waiting, the one in progress while retrying, the one that worked once recovered. */
  attempt: number;
  maxAttempts: number;
  secondsLeft: number;
  /** The wait the countdown started from, so the ring knows how full to be. */
  waitSeconds: number;
  title: string;
  cause: string;
  details: string;
  recoveredTitle: string;
  onRetryNow?: () => void;
  onStop?: () => void;
  isDetailsOpen?: boolean;
  onDetailsOpenChange?: (isOpen: boolean) => void;
  /** Shows Retry now held down, for a demonstration that presses it. */
  isRetryPressed?: boolean;
  /** Shows Details held down, for a demonstration that presses it. */
  isDetailsPressed?: boolean;
  className?: string;
};

export function RetryCard({
  phase,
  attempt,
  maxAttempts,
  secondsLeft,
  waitSeconds,
  title,
  cause,
  details,
  recoveredTitle,
  onRetryNow,
  onStop,
  isDetailsOpen,
  onDetailsOpenChange,
  isRetryPressed = false,
  isDetailsPressed = false,
  className,
}: RetryCardProps) {
  const detailsId = useId();
  const detailsState = useOpenState({
    isOpen: isDetailsOpen,
    defaultOpen: false,
    onOpenChange: onDetailsOpenChange,
  });
  const isRecovered = phase === 'recovered';
  const isRetrying = phase === 'retrying';
  const isStopped = phase === 'stopped';
  const canStop = !isStopped && !isRecovered;
  const headline = headlineOf(phase, title, recoveredTitle);
  const primaryLabel = primaryLabelOf(phase);

  return (
    <section
      aria-label='Agent error'
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='flex items-center gap-3'>
        <span className='relative inline-flex size-9 shrink-0 items-center justify-center'>
          <span className='absolute inset-0'>
            <CountdownRing
              phase={phase}
              secondsLeft={secondsLeft}
              waitSeconds={waitSeconds}
            />
          </span>
          <Swap swapKey={phase} className='relative'>
            <RingCenter phase={phase} secondsLeft={secondsLeft} />
          </Swap>
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <p className='min-w-0 truncate text-[13px] font-medium'>
            <WordRoll text={headline} />
          </p>
          <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs'>
            <Badge variant={attemptBadgeOf(phase)}>
              Attempt <MotionNumber value={attempt} /> of {maxAttempts}
            </Badge>
            <Swap swapKey={phase}>
              <PhaseWords phase={phase} secondsLeft={secondsLeft} />
            </Swap>
          </p>
        </div>
      </div>
      <Fold open={!isRecovered}>
        <div className='flex flex-col gap-3 pt-3'>
          <p className='text-muted-foreground text-xs leading-5'>{cause}</p>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              disabled={isRetrying}
              focusableWhenDisabled
              onClick={onRetryNow}
              className={pressedSolidOf(isRetryPressed)}
            >
              <RefreshCwIcon />
              <Swap swapKey={primaryLabel}>{primaryLabel}</Swap>
            </Button>
            {canStop && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onStop}
              >
                <XIcon />
                Stop retrying
              </Button>
            )}
          </div>
          <div className='flex flex-col'>
            <button
              type='button'
              aria-expanded={detailsState.isOpen}
              aria-controls={detailsId}
              onClick={detailsState.toggle}
              className={cn(
                'text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex h-6 w-fit cursor-pointer items-center gap-1 rounded-md text-xs transition-[color,scale] outline-none focus-visible:ring-[3px]',
                pressedQuietOf(isDetailsPressed)
              )}
            >
              Details
              <ChevronDownIcon
                className={cn(
                  'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
                  chevronTurnOf(detailsState.isOpen)
                )}
              />
            </button>
            <Fold open={detailsState.isOpen} id={detailsId}>
              <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] mt-1 flex items-start gap-2 rounded-lg p-2.5'>
                <pre className='relative min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-5'>
                  {details}
                </pre>
                <CopyButton text={details} label='Copy the error details' />
              </div>
            </Fold>
          </div>
        </div>
      </Fold>
    </section>
  );
}

const MAX_ATTEMPTS = 4;

/** Each failed attempt lengthens the wait before the next one. */
const WAITS_SECONDS = [4, 8, 16];

const RECOVERS_ON_ATTEMPT = 3;

const TICK_MS = 1000;

const RETRY_MS = 1300;

const TITLE = 'Could not read the pricing page';

const RECOVERED_TITLE = 'Read the pricing page';

const CAUSE =
  'The supplier site answered "too many requests". The agent waits a little longer after each failed try, then asks again on its own.';

const DETAILS = [
  'HTTP 429 Too Many Requests',
  'GET https://pricing.brightmoor.example/wholesale',
  'retry-after: 8',
  'x-request-id: 7f3c0d1a',
].join('\n');

type RetryState = {
  phase: RetryPhase;
  attempt: number;
  secondsLeft: number;
  waitSeconds: number;
  isDetailsOpen: boolean;
  isHandled: boolean;
};

type RetryAction =
  | { type: 'tick' }
  | { type: 'settle' }
  | { type: 'retry-now' }
  | { type: 'stop' }
  | { type: 'details'; isOpen: boolean }
  | { type: 'hold' };

type RetryStep = SessionStep<RetryState, RetryAction>;

const INITIAL: RetryState = {
  phase: 'waiting',
  attempt: 1,
  secondsLeft: 4,
  waitSeconds: 4,
  isDetailsOpen: false,
  isHandled: false,
};

const RESTING: RetryState = {
  phase: 'waiting',
  attempt: 2,
  secondsLeft: 5,
  waitSeconds: 8,
  isDetailsOpen: false,
  isHandled: false,
};

function waitSecondsOf(failedAttempts: number) {
  const lastIndex = WAITS_SECONDS.length - 1;
  const index = Math.min(failedAttempts - 1, lastIndex);
  return WAITS_SECONDS[index];
}

function tried(state: RetryState): RetryState {
  return { ...state, phase: 'retrying', attempt: state.attempt + 1 };
}

function ticked(state: RetryState): RetryState {
  if (state.phase !== 'waiting') {
    return state;
  }
  const secondsLeft = state.secondsLeft - 1;
  const isOver = secondsLeft <= 0;
  if (isOver) {
    return tried(state);
  }
  return { ...state, secondsLeft };
}

function settled(state: RetryState): RetryState {
  if (state.phase !== 'retrying') {
    return state;
  }
  const hasRecovered = state.attempt >= RECOVERS_ON_ATTEMPT;
  if (hasRecovered) {
    return { ...state, phase: 'recovered' };
  }
  const waitSeconds = waitSecondsOf(state.attempt);
  return { ...state, phase: 'waiting', secondsLeft: waitSeconds, waitSeconds };
}

function retriedNow(state: RetryState): RetryState {
  const isWaiting = state.phase === 'waiting';
  const isStopped = state.phase === 'stopped';
  const canRetry = isWaiting || isStopped;
  if (!canRetry) {
    return state;
  }
  return { ...tried(state), isHandled: true };
}

function stopped(state: RetryState): RetryState {
  const isWaiting = state.phase === 'waiting';
  const isRetrying = state.phase === 'retrying';
  const canStop = isWaiting || isRetrying;
  if (!canStop) {
    return state;
  }
  return { ...state, phase: 'stopped', isHandled: true };
}

function reducer(state: RetryState, action: RetryAction): RetryState {
  switch (action.type) {
    case 'tick':
      return ticked(state);
    case 'settle':
      return settled(state);
    case 'retry-now':
      return retriedNow(state);
    case 'stop':
      return stopped(state);
    case 'details':
      return { ...state, isDetailsOpen: action.isOpen };
    case 'hold':
      return state;
  }
}

function tickStep(after: number): RetryStep {
  return { after, by: 'demo', action: { type: 'tick' } };
}

function detailsStep(after: number, isOpen: boolean): RetryStep {
  const action: RetryAction = { type: 'details', isOpen };
  return { after, by: 'demo', press: 'details', action };
}

function hasSecondTryStarted(state: RetryState) {
  const isStopped = state.phase === 'stopped';
  const isPastSecondTry = state.attempt >= RECOVERS_ON_ATTEMPT;
  return isStopped || isPastSecondTry;
}

const SCRIPT: RetryStep[] = [
  tickStep(1200),
  detailsStep(100, true),
  tickStep(900),
  tickStep(1000),
  detailsStep(100, false),
  tickStep(900),
  { after: RETRY_MS, by: 'demo', action: { type: 'settle' } },
  tickStep(1000),
  tickStep(1000),
  tickStep(1000),
  {
    after: 500,
    by: 'person',
    press: 'retry',
    action: { type: 'retry-now' },
    isAnswered: hasSecondTryStarted,
  },
  { after: RETRY_MS, by: 'demo', action: { type: 'settle' } },
  { after: 4200, by: 'demo', action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(state: RetryState) {
  if (state.phase === 'waiting') {
    const failed = `Attempt ${state.attempt} failed`;
    const wait = countOf(state.waitSeconds, 'second');
    return `${failed}. The next try is in ${wait}`;
  }
  if (state.phase === 'retrying') {
    return `Trying again, attempt ${state.attempt} of ${MAX_ATTEMPTS}`;
  }
  if (state.phase === 'recovered') {
    return `It worked on attempt ${state.attempt}`;
  }
  return 'Stopped retrying';
}

function isSettledPhase(phase: RetryPhase) {
  const isRecovered = phase === 'recovered';
  const isStopped = phase === 'stopped';
  return isRecovered || isStopped;
}

export default function Run11() {
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const isClockOn = useIsOwnClockOn({
    isInView,
    isAutoplaying,
    isHandled: state.isHandled,
  });
  const isWaiting = state.phase === 'waiting';
  const isRetrying = state.phase === 'retrying';
  const canReplay = isSettledPhase(state.phase) && !isAutoplaying;
  const announcement = announcementOf(state);

  function tick() {
    act({ type: 'tick' });
  }

  function settle() {
    act({ type: 'settle' });
  }

  function retryNow() {
    act({ type: 'retry-now' });
  }

  function stop() {
    act({ type: 'stop' });
  }

  function changeDetails(isOpen: boolean) {
    act({ type: 'details', isOpen });
  }

  useInterval(tick, TICK_MS, isClockOn && isWaiting);
  useTimeout(settle, RETRY_MS, isClockOn && isRetrying);
  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[21rem] w-full max-w-[28rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <RetryCard
          phase={state.phase}
          attempt={state.attempt}
          maxAttempts={MAX_ATTEMPTS}
          secondsLeft={state.secondsLeft}
          waitSeconds={state.waitSeconds}
          title={TITLE}
          cause={CAUSE}
          details={DETAILS}
          recoveredTitle={RECOVERED_TITLE}
          onRetryNow={retryNow}
          onStop={stop}
          isDetailsOpen={state.isDetailsOpen}
          onDetailsOpenChange={changeDetails}
          isRetryPressed={pressed === 'retry'}
          isDetailsPressed={pressed === 'details'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
