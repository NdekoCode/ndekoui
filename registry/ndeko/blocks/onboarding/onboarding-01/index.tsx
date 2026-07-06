'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { InboxIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  risePresenceOf,
  SPRING,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ChecklistCard } from './checklist-card';
import { STEPS, WORKSPACE, type StepId } from './data';
import { ProgressRing } from './progress-ring';
import {
  COMPLETE_FOR_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOTAL,
  type ChecklistState,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** How the card leaves: folded into its pill, closed by a person, or faded once everything is done. */
type Leaving = 'fold' | 'close' | 'fade';

const FOLD_AWAY = {
  opacity: 0,
  scale: 0.6,
  transition: { duration: 0.18, ease: EASE_OUT_STRONG },
};

const CLOSE = {
  opacity: 0,
  scale: 0.96,
  transition: { duration: 0.14, ease: EASE_OUT_STRONG },
};

const FADE_AWAY = { opacity: 0, transition: { duration: 0.5 } };

function exitOf(leaving: Leaving) {
  if (leaving === 'fold') {
    return FOLD_AWAY;
  }
  if (leaving === 'fade') {
    return FADE_AWAY;
  }
  return CLOSE;
}

const CARD: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  shown: { opacity: 1, scale: 1, transition: SPRING },
  gone: exitOf,
};

const PILL: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  shown: { opacity: 1, scale: 1, transition: SPRING },
  gone: CLOSE,
};

/** Reduced motion keeps the fades and drops the folding. */
const STILL: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  gone: { opacity: 0 },
};

function variantsOf(shouldReduceMotion: boolean, variants: Variants) {
  if (shouldReduceMotion) {
    return STILL;
  }
  return variants;
}

function leavingOf(state: ChecklistState): Leaving {
  if (state.view === 'pill') {
    return 'fold';
  }
  const isAllDone = state.done.length === TOTAL;
  if (isAllDone) {
    return 'fade';
  }
  return 'close';
}

/** The step after this one, which opens when this one is done. */
function stepAfter(id: StepId) {
  const index = STEPS.findIndex((step) => step.id === id);
  const next = STEPS[index + 1];
  return next?.id ?? null;
}

export default function Onboarding01() {
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
  const { schedule, clearAll } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const guidePresence = risePresenceOf(shouldReduceMotion);
  const doneCount = state.done.length;
  const isComplete = state.view === 'complete';
  const showsCard = state.view === 'card' || isComplete;
  const showsPill = state.view === 'pill';
  const isPutAway = state.view === 'gone';
  const leaving = leavingOf(state);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /** The button of the current step when there is one, the first step otherwise. */
  function focusGuide() {
    requestAnimationFrame(() => {
      const root = ref.current;
      const action = root?.querySelector<HTMLElement>('[data-step-cta]');
      const firstRow = root?.querySelector<HTMLElement>('[data-step-row]');
      const target = action ?? firstRow;
      target?.focus();
    });
  }

  /** The message leaves on its own: a focus that sat on it goes to the button that brings the guide back. */
  function fadeCompletion() {
    const completion = ref.current?.querySelector('[data-complete]');
    const hadFocus = completion === document.activeElement;
    act({ type: 'completionFaded', source: 'person' });
    if (completion && hadFocus) {
      focusLater('[data-setup-guide]');
    }
  }

  /** The button that was pressed folds away with its step, so the focus goes to the button of the next one. */
  function complete(id: StepId) {
    const nextId = stepAfter(id);
    act({ type: 'stepCompleted', id, source: 'person' });
    if (nextId === null) {
      focusLater('[data-complete]');
      schedule(fadeCompletion, COMPLETE_FOR_MS);
      return;
    }
    focusLater(`[data-step-cta="${nextId}"]`);
  }

  function snooze() {
    act({ type: 'snoozed' });
    focusLater('[data-pill]');
  }

  function resume() {
    act({ type: 'resumed' });
    focusGuide();
  }

  function dismiss() {
    act({ type: 'dismissed' });
    focusLater('[data-setup-guide]');
  }

  /** A message that waits to fade belongs to the round it came up in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative flex min-h-dvh w-full flex-col'
      >
        <header className='flex h-14 shrink-0 items-center gap-2.5 px-4'>
          <CompanyMark seed={WORKSPACE.name} size='lg' />
          <p className='min-w-0 flex-1 truncate text-sm font-medium'>
            {WORKSPACE.name}
          </p>
          <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
          <AnimatePresence initial={false}>
            {isPutAway && (
              <motion.span
                key='setup-guide'
                className='inline-flex'
                {...guidePresence}
              >
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  data-setup-guide
                  onClick={resume}
                >
                  Setup guide
                  <span className='text-muted-foreground tabular-nums'>
                    {doneCount} of {TOTAL}
                  </span>
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </header>

        <main className='flex flex-1 flex-col gap-4 p-4 pt-2 @md:px-6'>
          <h1 className='text-lg font-semibold'>Home</h1>
          <div className='hairline-border border-foreground/20 flex flex-col items-start gap-2 rounded-xl border-dashed p-5'>
            <span
              aria-hidden='true'
              className='keycap-3d text-muted-foreground mb-1 inline-flex size-10 items-center justify-center rounded-lg'
            >
              <InboxIcon className='size-5' />
            </span>
            <p className='text-sm font-medium'>No agent has run yet</p>
            <p className='text-muted-foreground max-w-sm text-[13px] leading-relaxed text-pretty'>
              Runs, requests and results show up on this page once your first
              agent has done its first job
            </p>
          </div>
        </main>

        <div className='pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-end @md:inset-x-auto @md:end-4 @md:bottom-4'>
          <AnimatePresence initial={false} mode='popLayout' custom={leaving}>
            {showsCard && (
              <motion.section
                key='card'
                aria-label='Setup guide'
                variants={variantsOf(shouldReduceMotion, CARD)}
                custom={leaving}
                initial='hidden'
                animate='shown'
                exit='gone'
                className='surface-raised pointer-events-auto w-full origin-bottom-right rounded-xl @md:w-[22rem]'
              >
                <ChecklistCard
                  done={state.done}
                  openId={state.openId}
                  howToId={state.howToId}
                  isComplete={isComplete}
                  pressed={pressed}
                  onToggle={(id) => act({ type: 'stepToggled', id })}
                  onToggleHowTo={(id) => act({ type: 'howToToggled', id })}
                  onComplete={complete}
                  onSnooze={snooze}
                  onDismiss={dismiss}
                />
              </motion.section>
            )}
            {showsPill && (
              <motion.button
                key='pill'
                type='button'
                data-pill
                aria-label={`Open the setup guide: ${doneCount} of ${TOTAL} steps done`}
                variants={variantsOf(shouldReduceMotion, PILL)}
                initial='hidden'
                animate='shown'
                exit='gone'
                onClick={resume}
                className={cn(
                  'surface-raised focus-visible:ring-ring pointer-events-auto flex h-9 origin-bottom-right cursor-pointer items-center gap-2 rounded-full ps-2 pe-3.5 text-xs font-medium transition-[background-color,scale] duration-150 outline-none focus-visible:ring-2',
                  pressedQuietOf(pressed === 'pill')
                )}
              >
                <ProgressRing done={doneCount} total={TOTAL} size='sm' />
                Setup
                <span className='text-muted-foreground tabular-nums'>
                  {doneCount} of {TOTAL}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
