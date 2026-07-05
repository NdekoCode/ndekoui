'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { PauseIcon, PlayIcon, StopIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { BrowserFrame } from './browser';
import { formatPrice, OPERATOR, PERSON, TASK, totalOf } from './data';
import {
  INITIAL,
  isAgentHeld,
  liveFrameOf,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  shownFrameOf,
  type Actor,
  type ComputerState,
  type Frame,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
  holdWhile: isAgentHeld,
};

type StatusWord =
  | 'Working'
  | 'Waiting on you'
  | 'You have control'
  | 'Paused'
  | 'Done'
  | 'Stopped';

function statusWordOf(state: ComputerState): StatusWord {
  if (state.status === 'stopped') {
    return 'Stopped';
  }
  if (state.status === 'done') {
    return 'Done';
  }
  if (state.approval === 'pending') {
    return 'Waiting on you';
  }
  if (state.control === 'person') {
    return 'You have control';
  }
  if (state.isPaused) {
    return 'Paused';
  }
  return 'Working';
}

const STATUS_VARIANT = {
  Working: 'default',
  'Waiting on you': 'warning',
  'You have control': 'info',
  Paused: 'secondary',
  Done: 'success',
  Stopped: 'destructive',
} as const;

function pauseLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Resume';
  }
  return 'Pause';
}

function controlLabelOf(control: Actor) {
  if (control === 'person') {
    return 'Hand back';
  }
  return 'Take over';
}

function controlVariantOf(control: Actor) {
  if (control === 'person') {
    return 'default';
  }
  return 'outline';
}

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94]';
  }
  return undefined;
}

function rowToneOf(isShown: boolean) {
  if (isShown) {
    return 'bg-primary/10';
  }
  return 'hover:bg-foreground/[0.04]';
}

function OperatorTile() {
  const gemStyle = {
    '--gem': seriesColorOf(OPERATOR.series),
  } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={gemStyle}
      className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold select-none'
    >
      {OPERATOR.initial}
    </span>
  );
}

function ActorMark({ actor }: { actor: Actor }) {
  if (actor === 'agent') {
    return <OperatorTile />;
  }
  return (
    <Avatar className='size-6'>
      <AvatarImage src={PERSON.avatar} alt='' />
      <AvatarFallback className='text-[9px]'>{PERSON.initials}</AvatarFallback>
    </Avatar>
  );
}

type ActionLogProps = {
  frames: Frame[];
  shownId: number;
  onView: (index: number) => void;
};

function ActionLog({ frames, shownId, onView }: ActionLogProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <ol aria-label='Actions' className='flex flex-col'>
      <AnimatePresence initial={false}>
        {frames.map((frame) => (
          <motion.li
            key={frame.id}
            className='overflow-hidden'
            {...rowPresence}
          >
            <button
              type='button'
              aria-current={frame.id === shownId}
              onClick={() => onView(frame.id)}
              className={cn(
                'focus-visible:ring-ring/25 flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-start text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                rowToneOf(frame.id === shownId)
              )}
            >
              <ActorMark actor={frame.actor} />
              <span className='min-w-0 flex-1 leading-snug'>{frame.text}</span>
              <span className='text-muted-foreground w-4 shrink-0 text-end text-xs tabular-nums'>
                {frame.id + 1}
              </span>
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

export default function AgentReview04() {
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
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const live = liveFrameOf(state);
  const shown = shownFrameOf(state);
  const lastIndex = state.frames.length - 1;
  const isFollowing = state.viewed === null;
  const isRunning = state.status === 'running';
  const isPending = state.approval === 'pending';
  const hasControl = state.control === 'person';
  const isLiveView = isFollowing && isRunning;
  const canAct = hasControl && isLiveView;
  const isAgentWaiting = hasControl || state.isPaused;
  const canPause = isRunning && !hasControl;
  const statusWord = statusWordOf(state);
  const amount = formatPrice(totalOf(live.period, live.hasAddon));
  const isOver = isFinished || !isRunning;
  const canReplay = isOver && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, `${statusWord}. ${live.text}`);
  const clock = {
    startedAt: state.startedAt ?? undefined,
    endedAt: state.endedAt ?? undefined,
  };

  function toggleControl() {
    if (hasControl) {
      act({ type: 'handedBack' });
      return;
    }
    act({ type: 'tookOver' });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-6'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <OperatorTile />
            <div className='flex min-w-40 flex-1 flex-col leading-tight'>
              <h1 className='text-sm font-medium'>{TASK}</h1>
              <span className='text-muted-foreground text-xs'>
                {OPERATOR.name}, in a browser it controls
              </span>
            </div>
            <Badge variant={STATUS_VARIANT[statusWord]}>
              <Swap swapKey={statusWord}>{statusWord}</Swap>
            </Badge>
            <LiveDuration
              item={clock}
              isRunning={isRunning}
              className='text-muted-foreground w-12 text-end text-[13px]'
            />
            {isRunning && (
              <Button
                type='button'
                variant='destructive'
                size='sm'
                onClick={() => act({ type: 'stopped' })}
              >
                <StopIcon />
                Stop
              </Button>
            )}
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay the session'
            />
          </header>

          <div className='flex flex-col gap-4 @3xl:flex-row @3xl:items-start'>
            <section
              aria-label='Browser'
              className='flex min-w-0 flex-1 flex-col gap-3'
            >
              <BrowserFrame
                frame={shown}
                isAgentWaiting={isAgentWaiting}
                canAct={canAct}
                isAddonPressed={pressed === 'addon'}
                onToggleAddon={() => act({ type: 'addon' })}
                onPeriodChange={(period) => act({ type: 'period', period })}
              />
              <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                <label className='flex min-w-48 flex-1 items-center gap-3 text-xs'>
                  <span className='text-muted-foreground w-24 shrink-0 tabular-nums'>
                    Frame {shown.id + 1} of {state.frames.length}
                  </span>
                  <input
                    type='range'
                    min={0}
                    max={lastIndex}
                    step={1}
                    value={shown.id}
                    aria-label='Frame'
                    onChange={(event) =>
                      act({ type: 'viewed', index: Number(event.target.value) })
                    }
                    className='accent-primary h-4 min-w-0 flex-1 cursor-pointer'
                  />
                </label>
                {!isFollowing && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => act({ type: 'viewed', index: null })}
                    className='text-primary-ink'
                  >
                    Back to live
                  </Button>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={!canPause}
                  onClick={() => act({ type: 'paused' })}
                >
                  <Swap swapKey={String(state.isPaused)}>
                    {state.isPaused && <PlayIcon />}
                    {!state.isPaused && <PauseIcon />}
                  </Swap>
                  {pauseLabelOf(state.isPaused)}
                </Button>
                <Button
                  type='button'
                  variant={controlVariantOf(state.control)}
                  size='sm'
                  disabled={!isRunning}
                  onClick={toggleControl}
                  className={pressedOf(pressed === 'takeover')}
                >
                  <Swap swapKey={state.control}>
                    {controlLabelOf(state.control)}
                  </Swap>
                </Button>
              </div>
              {hasControl && (
                <p className='bg-info/10 text-info-foreground rounded-lg px-3 py-2 text-[13px] transition-opacity duration-300 starting:opacity-0'>
                  You have the controls: change the form in the browser above.{' '}
                  {OPERATOR.name} waits until you hand back.
                </p>
              )}
            </section>

            <section
              aria-label='Session log'
              className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col gap-2 rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @3xl:w-80 @3xl:shrink-0'
            >
              <AnimatePresence initial={false}>
                {isPending && (
                  <motion.div
                    key='approval'
                    className='overflow-hidden'
                    {...rowPresence}
                  >
                    <div className='bg-warning/10 flex flex-col gap-3 rounded-lg p-3'>
                      <div className='flex items-center gap-2.5'>
                        <BrandTile brand='visa' size='lg' title='Visa' />
                        <div className='flex min-w-0 flex-col leading-tight'>
                          <h2 className='text-sm font-medium'>Pay {amount}</h2>
                          <span className='text-warning-foreground text-xs'>
                            Card ending 4242, cannot be undone
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            act({ type: 'decided', decision: 'denied' })
                          }
                        >
                          Deny
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          onClick={() =>
                            act({ type: 'decided', decision: 'approved' })
                          }
                          className={cn(
                            pressedOf(pressed === 'allow'),
                            pressed === 'allow' && 'bg-primary/85'
                          )}
                        >
                          Allow the payment
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <h2 className='text-muted-foreground px-2 pt-1 text-xs'>
                Actions, synced to the frames
              </h2>
              <ActionLog
                frames={state.frames}
                shownId={shown.id}
                onView={(index) => act({ type: 'viewed', index })}
              />
            </section>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
