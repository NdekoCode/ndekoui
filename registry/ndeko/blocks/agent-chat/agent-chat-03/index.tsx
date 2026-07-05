'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  ArrowUpIcon,
  FeatherIcon,
  LoaderIcon,
  PlayIcon,
} from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CanvasCard, type CardStatus } from './cards';
import {
  CARD_ORDER,
  CHECK_LABELS,
  LIVE_LINE,
  PROMPT,
  READY_LINE,
  type FieldId,
} from './data';
import {
  GO_LIVE_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type CheckStatus,
  type LiveStatus,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const RUN_LABELS: Record<MorphState, string> = {
  idle: 'Run it',
  busy: 'Going live',
  done: 'Live',
};

const CHECK_PATH = 'M2.6 6.4 4.9 8.7 9.5 3.6';

const DRAW = { duration: 0.28, ease: EASE_OUT_STRONG, delay: 0.08 };

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function DrawnCheck() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <span className='chip-3d inline-flex size-[18px] items-center justify-center rounded-full [--chip:var(--primary)]'>
      <svg aria-hidden='true' viewBox='0 0 12 12' className='size-3'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </span>
  );
}

function CheckGlyph({ status }: { status: CheckStatus }) {
  if (status === 'done') {
    return <DrawnCheck />;
  }
  return <LoaderIcon className='text-primary-ink size-4 animate-spin' />;
}

const CHECK_WORD: Record<CheckStatus, string> = {
  upcoming: 'Upcoming',
  running: 'In progress',
  done: 'Done',
};

function morphStateOf(live: LiveStatus): MorphState {
  if (live === 'busy') {
    return 'busy';
  }
  if (live === 'done') {
    return 'done';
  }
  return 'idle';
}

function cardStatusOf(
  index: number,
  cardsReady: number,
  live: LiveStatus
): CardStatus {
  const isReady = index < cardsReady;
  if (!isReady) {
    return 'writing';
  }
  if (live === 'done') {
    return 'live';
  }
  return 'draft';
}

function closingLineOf(cardsReady: number, live: LiveStatus) {
  if (live === 'done') {
    return LIVE_LINE;
  }
  if (cardsReady === 3) {
    return READY_LINE;
  }
  return null;
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-primary/85';
  }
  return undefined;
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isPlainEnter = event.key === 'Enter' && !event.shiftKey;
  return isPlainEnter && !event.nativeEvent.isComposing;
}

function AssistantTile() {
  return (
    <span
      aria-hidden='true'
      className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-lg [--gem:var(--primary)]'
    >
      <FeatherIcon className='size-4' />
    </span>
  );
}

export default function AgentChat03() {
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
  const { schedule } = useTimeouts();
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasAsked = state.ask !== null;
  const visibleChecks = CHECK_LABELS.filter(
    (_, index) => state.checks[index] !== 'upcoming'
  );
  const cards = CARD_ORDER.slice(0, state.cardsShown);
  const hasCards = cards.length > 0;
  const isDrafted = state.cardsReady === 3;
  const isLocked = state.live !== 'idle';
  const closingLine = closingLineOf(state.cardsReady, state.live);
  const message = spokenUnless(isAutoplaying, closingLine ?? '');
  const canReplay = isFinished && !isAutoplaying;

  function send() {
    act({ type: 'sent' });
  }

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    send();
  }

  function runRule() {
    act({ type: 'run' });
    schedule(() => act({ type: 'live' }), GO_LIVE_MS);
  }

  function edit(id: FieldId, text: string) {
    act({ type: 'edited', id, text });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-6'
      >
        <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.02] mx-auto flex max-w-5xl flex-col rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <header className='flex h-12 items-center gap-2.5 px-3'>
            <AssistantTile />
            <h2 className='text-sm font-medium'>Assistant</h2>
            <Badge variant='secondary'>Support automations</Badge>
            <span className='ms-auto'>
              <ReplayButton isShown={canReplay} onReplay={restart} />
            </span>
          </header>

          <div className='flex flex-col gap-3 p-3 pt-0 @3xl:min-h-[34rem] @3xl:flex-row'>
            <section
              aria-label='Conversation'
              className='flex min-w-0 flex-col gap-3 @3xl:w-80 @3xl:shrink-0'
            >
              <div className='flex min-h-40 flex-1 flex-col gap-3 px-1 py-2'>
                {!hasAsked && (
                  <div className='m-auto flex max-w-xs flex-col items-center gap-3 text-center'>
                    <p className='text-muted-foreground text-[13px]'>
                      Say what should happen. The rule, the issue and the post
                      are drafted on the canvas.
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => act({ type: 'typed', text: PROMPT })}
                      className='h-auto max-w-full rounded-xl px-3 py-2 text-start whitespace-normal'
                    >
                      {PROMPT}
                    </Button>
                  </div>
                )}
                {hasAsked && (
                  <p className='bg-foreground/[0.06] max-w-[90%] self-end rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
                    {state.ask}
                  </p>
                )}
                <ul
                  aria-label='What the assistant did'
                  className='flex flex-col'
                >
                  <AnimatePresence initial={false}>
                    {visibleChecks.map((label) => {
                      const index = CHECK_LABELS.indexOf(label);
                      const status = state.checks[index];
                      return (
                        <motion.li
                          key={label}
                          className='overflow-hidden'
                          {...rowPresence}
                        >
                          <div className='flex h-8 items-center gap-2.5 text-[13px]'>
                            <span className='flex size-[18px] shrink-0 items-center justify-center'>
                              <Swap swapKey={status}>
                                <CheckGlyph status={status} />
                              </Swap>
                              <span className='sr-only'>
                                {CHECK_WORD[status]}
                              </span>
                            </span>
                            {label}
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <AnimatePresence initial={false} mode='popLayout'>
                  {closingLine && (
                    <motion.p
                      key={closingLine}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className='text-sm leading-relaxed'
                    >
                      {closingLine}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className='bg-background hairline-ring ring-foreground/12 has-[textarea:focus-visible]:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 flex items-end gap-2 rounded-2xl p-2 transition-[box-shadow] duration-150 has-[textarea:focus-visible]:ring-[3px]'>
                <textarea
                  value={state.draft}
                  rows={2}
                  aria-label='Message to the assistant'
                  placeholder='Say what should happen'
                  onChange={(event) =>
                    act({ type: 'typed', text: event.target.value })
                  }
                  onKeyDown={handleKeys}
                  className='placeholder:text-muted-foreground/75 min-h-12 flex-1 resize-none bg-transparent px-1.5 py-1 text-base leading-normal outline-none md:text-[13px]'
                />
                <Button
                  type='button'
                  size='icon'
                  aria-label='Send the message'
                  disabled={hasAsked}
                  onClick={send}
                  className={pressedSolidOf(pressed === 'send')}
                >
                  <ArrowUpIcon />
                </Button>
              </div>
            </section>

            <section
              aria-label='Canvas'
              className='bg-foreground/[0.03] flex min-w-0 flex-1 flex-col gap-3 rounded-[calc(var(--radius-2xl)-0.75rem)] p-3'
            >
              {!hasCards && (
                <p className='text-muted-foreground m-auto max-w-xs py-10 text-center text-[13px]'>
                  The canvas is empty. What the assistant drafts is written
                  here, card by card.
                </p>
              )}
              <ul className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {cards.map((card, index) => (
                    <motion.li
                      key={card}
                      className='-mx-1 overflow-hidden px-1'
                      {...rowPresence}
                    >
                      <div className='py-1.5'>
                        <CanvasCard
                          card={card}
                          status={cardStatusOf(
                            index,
                            state.cardsReady,
                            state.live
                          )}
                          isActive={isInView}
                          fields={state.fields}
                          isLocked={isLocked}
                          onEdit={edit}
                        />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {isDrafted && (
                <div className='mt-auto flex items-center justify-between gap-3 transition-opacity duration-300 starting:opacity-0'>
                  <span className='text-muted-foreground text-xs'>
                    Editable until the rule is live
                  </span>
                  <MorphButton
                    type='button'
                    state={morphStateOf(state.live)}
                    labels={RUN_LABELS}
                    idleIcon={<PlayIcon />}
                    onClick={runRule}
                    className={cn(pressedSolidOf(pressed === 'run'))}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
