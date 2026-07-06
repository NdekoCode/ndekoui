'use client';

import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
} from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ERROR_ID, INCIDENT, SITE } from './data';
import { ServerStack } from './server-stack';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  RETRY_MS,
  SCRIPT,
  type LoadStatus,
  type ServerState,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const COPIED_FOR_MS = 1600;

const RETRY_STATE: Record<LoadStatus, MorphState> = {
  error: 'idle',
  retrying: 'busy',
  recovered: 'done',
};

const RETRY_LABELS: Record<MorphState, string> = {
  idle: 'Try again',
  busy: 'Retrying',
  done: 'Loaded',
};

const NUDGE = { x: [0, -4, 4, -2, 0] };

const NUDGE_TIMING = { duration: 0.32 };

function titleOf(state: ServerState) {
  if (state.status === 'recovered') {
    return 'Back on track';
  }
  if (state.failures > 0) {
    return 'Still not working';
  }
  return 'Something went wrong';
}

function leadOf(state: ServerState) {
  if (state.status === 'recovered') {
    return 'The page loaded this time. Nothing you entered was lost.';
  }
  if (state.failures > 0) {
    return 'We tried again and got the same error. Our team has the details, and the ID below helps support find them.';
  }
  return 'Your invoices are safe. We could not load this page, and our team has been told.';
}

function codeLineOf(state: ServerState) {
  if (state.status === 'recovered') {
    return 'Loaded';
  }
  const tries = state.attempts + 1;
  if (tries === 1) {
    return 'Error 500';
  }
  return `Error 500 · tried ${tries} times`;
}

/** `@starting-style` also plays when the page loads, so the lead fades in only once it replaced another. */
function leadEntranceOf(hasChanged: boolean) {
  if (hasChanged) {
    return 'transition-opacity duration-200 starting:opacity-0';
  }
  return undefined;
}

function useHasChanged(value: string) {
  const [firstValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  const isFirstChange = !hasChanged && value !== firstValue;
  if (isFirstChange) {
    setHasChanged(true);
  }
  return hasChanged;
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy the error ID';
}

type CopyIdButtonProps = {
  isCopied: boolean;
  isPressed: boolean;
  onCopy: () => void;
};

function CopyIdButton({ isCopied, isPressed, onCopy }: CopyIdButtonProps) {
  const glyphKey = String(isCopied);

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={copyLabelOf(isCopied)}
      onClick={onCopy}
      className={cn('text-muted-foreground', pressedQuietOf(isPressed))}
    >
      <Swap swapKey={glyphKey}>
        {isCopied && <CheckIcon className='size-3.5' />}
        {!isCopied && <CopyIcon className='size-3.5' />}
      </Swap>
    </Button>
  );
}

/** The row of the button a person pressed shakes its head once when a retry fails. */
function useNudgeOnFailure(failures: number) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const shouldReduceMotion = usePrefersReducedMotion();
  const seenFailures = useRef(failures);

  useEffect(() => {
    const isNewFailure = failures > seenFailures.current;
    seenFailures.current = failures;
    if (!isNewFailure || shouldReduceMotion) {
      return;
    }
    animate(scope.current, NUDGE, NUDGE_TIMING);
  }, [failures, shouldReduceMotion, animate, scope]);

  return scope;
}

export default function ErrorPages02() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const actionsRef = useNudgeOnFailure(state.failures);
  const title = titleOf(state);
  const hasTitleChanged = useHasChanged(title);
  const isRecovered = state.status === 'recovered';
  const isRetrying = state.status === 'retrying';
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  const presence = risePresenceOf(shouldReduceMotion);
  useKeptHeight(ref);

  /**
   * The server answers a retry on its own, whoever pressed. When the page comes back, the button
   * that held the focus leaves, so the focus goes to Continue.
   */
  useEffect(() => {
    if (!isRetrying) {
      return;
    }
    const attempt = state.attempts;
    const timer = setTimeout(() => {
      const retryButton = ref.current?.querySelector('[data-retry]');
      const hadFocus = retryButton === document.activeElement;
      act({ type: 'answered', attempt });
      if (!hadFocus) {
        return;
      }
      requestAnimationFrame(() => {
        const next = ref.current?.querySelector<HTMLElement>('[data-continue]');
        next?.focus();
      });
    }, RETRY_MS);
    return () => clearTimeout(timer);
  }, [isRetrying, state.attempts, act, ref]);

  useEffect(() => {
    if (!state.isCopied) {
      return;
    }
    const timer = setTimeout(() => {
      act({ type: 'copyReset' });
    }, COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [state.isCopied, act]);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(ERROR_ID);
    } catch {
      return;
    }
    act({ type: 'copied' });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex min-h-dvh w-full flex-col'
      >
        <header className='flex min-h-16 items-center gap-3 px-4 @2xl:px-8'>
          <a
            href={SITE.homeHref}
            className={cn(
              'flex items-center gap-2 rounded-md text-sm font-semibold',
              FOCUS_RING
            )}
          >
            <CompanyMark seed={SITE.name} size='lg' />
            {SITE.name}
          </a>
          <span className='flex-1' />
          <ReplayButton isShown={canReplay} onReplay={restart} label='Replay' />
        </header>

        <main className='flex flex-1 flex-col items-center px-4 pt-6 pb-16 @2xl:pt-12'>
          <div className='flex w-full max-w-md flex-col items-center gap-7'>
            <ServerStack status={state.status} />

            <div className='flex flex-col items-center gap-3 text-center'>
              <p className='text-muted-foreground text-xs tabular-nums'>
                {codeLineOf(state)}
              </p>
              <h1 className='text-2xl font-semibold @sm:text-3xl'>
                <WordRoll text={title} />
              </h1>
              <p
                key={title}
                className={cn(
                  'text-muted-foreground text-sm text-pretty',
                  leadEntranceOf(hasTitleChanged)
                )}
              >
                {leadOf(state)}
              </p>
            </div>

            <div
              ref={actionsRef}
              className='flex flex-wrap items-center justify-center gap-2'
            >
              <AnimatePresence mode='popLayout' initial={false}>
                {!isRecovered && (
                  <motion.span
                    key='retry'
                    className='inline-flex'
                    {...presence}
                  >
                    <MorphButton
                      type='button'
                      size='lg'
                      data-retry
                      state={RETRY_STATE[state.status]}
                      labels={RETRY_LABELS}
                      onClick={() => act({ type: 'retried' })}
                      className={pressedSolidOf(pressed === 'retry')}
                    />
                  </motion.span>
                )}
                {!isRecovered && (
                  <motion.span
                    key='dashboard'
                    className='inline-flex'
                    {...presence}
                  >
                    <Button
                      size='lg'
                      variant='outline'
                      nativeButton={false}
                      render={<a href={SITE.homeHref} />}
                    >
                      Go to dashboard
                    </Button>
                  </motion.span>
                )}
                {isRecovered && (
                  <motion.span
                    key='continue'
                    className='inline-flex'
                    {...presence}
                  >
                    <Button
                      size='lg'
                      nativeButton={false}
                      data-continue
                      render={<a href={SITE.continueHref} />}
                    >
                      Continue to invoices
                      <ArrowRightIcon />
                    </Button>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <Fold open={!isRecovered} className='w-full'>
              <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-1 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                <div className='flex items-center gap-3 rounded-lg px-2.5 py-2'>
                  <span
                    aria-hidden='true'
                    className='bg-warning size-2 shrink-0 rounded-full'
                  />
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <p className='text-[13px] font-medium'>
                      {INCIDENT.service}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {INCIDENT.note}
                    </p>
                  </div>
                  <a
                    href={SITE.statusHref}
                    target='_blank'
                    rel='noreferrer'
                    className={cn(
                      'text-primary-ink inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-medium underline-offset-4 hover:underline',
                      FOCUS_RING
                    )}
                  >
                    Status page
                    <ArrowUpRightIcon className='size-3.5' />
                  </a>
                </div>
                <div className='bg-foreground/[0.03] flex items-center gap-3 rounded-lg px-2.5 py-2'>
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <p className='text-muted-foreground text-xs'>Error ID</p>
                    <p className='truncate font-mono text-[13px]'>{ERROR_ID}</p>
                  </div>
                  <CopyIdButton
                    isCopied={state.isCopied}
                    isPressed={pressed === 'copy'}
                    onCopy={copyId}
                  />
                </div>
                <p className='text-muted-foreground px-2.5 pt-1.5 pb-1 text-xs text-pretty'>
                  If it keeps happening, send this ID to{' '}
                  <a
                    href={SITE.supportHref}
                    className={cn(
                      'text-primary-ink rounded-sm font-medium underline-offset-4 hover:underline',
                      FOCUS_RING
                    )}
                  >
                    {SITE.supportAddress}
                  </a>
                  .
                </p>
              </div>
            </Fold>
          </div>
        </main>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
