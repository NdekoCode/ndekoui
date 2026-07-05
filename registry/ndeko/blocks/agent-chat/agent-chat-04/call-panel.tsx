'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

import {
  AudioLinesIcon,
  MicIcon,
  MicOffIcon,
  PhoneOffIcon,
} from '@/registry/ndeko/lib/icons';
import { formatClock, spokenClockOf } from '@/registry/ndeko/lib/media-clock';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { speechLevelAt } from '@/registry/ndeko/lib/speech-envelope';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { useLiveNow } from '@/registry/ndeko/ui/live-duration';

import type { Speaker, TranscriptLine } from './data';
import type { CallStatus } from './session';

export type DiscMode =
  'connecting' | 'listening' | 'speaking' | 'muted' | 'ended';

const MODE_WORD: Record<DiscMode, string> = {
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
  muted: 'Muted',
  ended: 'Call ended',
};

const MODE_INTENSITY: Record<DiscMode, number> = {
  connecting: 0,
  listening: 0.65,
  speaking: 1,
  muted: 0.04,
  ended: 0,
};

/** How much of the gap to the new level is closed on each frame, so the disc breathes instead of jumping. */
const LEVEL_EASING = 0.16;

const HALO_REACH = 0.22;

const OUTER_REACH = 0.42;

export function discModeOf(
  status: CallStatus,
  isMuted: boolean,
  speaker: Speaker | null
): DiscMode {
  if (status === 'ended') {
    return 'ended';
  }
  if (status === 'ringing') {
    return 'connecting';
  }
  if (isMuted) {
    return 'muted';
  }
  if (speaker === 'assistant') {
    return 'speaking';
  }
  return 'listening';
}

function ModeGlyph({ mode }: { mode: DiscMode }) {
  if (mode === 'speaking') {
    return <AudioLinesIcon className='size-7' />;
  }
  if (mode === 'muted') {
    return <MicOffIcon className='size-7' />;
  }
  if (mode === 'ended') {
    return <PhoneOffIcon className='size-7' />;
  }
  return <MicIcon className='size-7' />;
}

function coreToneOf(mode: DiscMode) {
  const isQuiet = mode === 'ended' || mode === 'muted';
  if (isQuiet) {
    return '[--gem:var(--muted-foreground)]';
  }
  return '[--gem:var(--primary)]';
}

type VoiceDiscProps = {
  mode: DiscMode;
  /** False while the block is off screen or the call is over: the disc stops drawing. */
  isActive: boolean;
};

/** The level is written to the two halos on each frame, so React never re-renders for it. */
export function VoiceDisc({ mode, isActive }: VoiceDiscProps) {
  const haloRef = useRef<HTMLSpanElement>(null);
  const outerRef = useRef<HTMLSpanElement>(null);
  const intensityRef = useRef(MODE_INTENSITY[mode]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    intensityRef.current = MODE_INTENSITY[mode];
  }, [mode]);

  useEffect(() => {
    const halo = haloRef.current;
    const outer = outerRef.current;
    const shouldDraw = isActive && !shouldReduceMotion;
    if (!shouldDraw) {
      return;
    }
    if (!halo || !outer) {
      return;
    }
    const startedAt = performance.now();
    let level = 0;
    let frame = 0;

    function draw(now: number) {
      if (!halo || !outer) {
        return;
      }
      const voice = speechLevelAt(now - startedAt, 2.4);
      const target = voice * intensityRef.current;
      level += (target - level) * LEVEL_EASING;
      const haloScale = 1 + level * HALO_REACH;
      const outerScale = 1 + level * OUTER_REACH;
      halo.style.transform = `scale(${haloScale})`;
      outer.style.transform = `scale(${outerScale})`;
      frame = requestAnimationFrame(draw);
    }

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      halo.style.transform = '';
      outer.style.transform = '';
    };
  }, [isActive, shouldReduceMotion]);

  return (
    <div className='relative flex size-32 shrink-0 items-center justify-center @3xl:size-40'>
      <span
        ref={outerRef}
        aria-hidden='true'
        className='bg-primary/[0.07] absolute inset-4 rounded-full'
      />
      <span
        ref={haloRef}
        aria-hidden='true'
        className='bg-primary/[0.12] absolute inset-7 rounded-full'
      />
      <span
        className={cn(
          'gem-plate relative flex size-16 items-center justify-center rounded-full transition-[background-image] duration-300 @3xl:size-20',
          coreToneOf(mode)
        )}
      >
        <Swap swapKey={mode}>
          <ModeGlyph mode={mode} />
        </Swap>
      </span>
    </div>
  );
}

function elapsedOfCall(
  startedAt: number | null,
  endedAt: number | null,
  now: number
) {
  if (startedAt === null) {
    return 0;
  }
  const end = endedAt ?? now;
  return Math.max(0, end - startedAt);
}

type CallClockProps = {
  startedAt: number | null;
  endedAt: number | null;
};

/** Only this text re-renders each second. */
function CallClock({ startedAt, endedAt }: CallClockProps) {
  const isRunning = startedAt !== null && endedAt === null;
  const now = useLiveNow(1000, isRunning);
  const elapsed = elapsedOfCall(startedAt, endedAt, now);

  return (
    <span className='text-muted-foreground inline-block w-10 text-center text-[13px] tabular-nums'>
      <span aria-hidden='true'>{formatClock(elapsed)}</span>
      <span className='sr-only'>{spokenClockOf(elapsed)}</span>
    </span>
  );
}

const SPEAKER_WORD: Record<Speaker, string> = {
  person: 'You',
  assistant: 'Assistant',
};

function lineToneOf(isLatest: boolean) {
  if (isLatest) {
    return 'opacity-100';
  }
  return 'opacity-45';
}

function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const recent = lines.slice(-3);
  const latest = recent.at(-1);

  return (
    <div className='flex h-36 w-full flex-col justify-end overflow-hidden'>
      {recent.length === 0 && (
        <p className='text-muted-foreground m-auto text-center text-[13px]'>
          What is said shows up here
        </p>
      )}
      <ol aria-label='Transcript' className='flex flex-col'>
        <AnimatePresence initial={false}>
          {recent.map((line) => (
            <motion.li
              key={line.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <p
                className={cn(
                  'pb-2 text-[13px] leading-snug transition-opacity duration-300',
                  lineToneOf(line === latest)
                )}
              >
                <span className='text-muted-foreground'>
                  {SPEAKER_WORD[line.speaker]}
                </span>{' '}
                {line.text}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

function muteLabelOf(isMuted: boolean) {
  if (isMuted) {
    return 'Unmute';
  }
  return 'Mute';
}

function pressedDestructiveOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.94] bg-destructive/85';
  }
  return undefined;
}

type CallPanelProps = {
  title: string;
  status: CallStatus;
  mode: DiscMode;
  isMuted: boolean;
  lines: TranscriptLine[];
  startedAt: number | null;
  endedAt: number | null;
  isActive: boolean;
  pressed: string | null;
  onToggleMute: () => void;
  onEnd: () => void;
  footer?: React.ReactNode;
};

export function CallPanel({
  title,
  status,
  mode,
  isMuted,
  lines,
  startedAt,
  endedAt,
  isActive,
  pressed,
  onToggleMute,
  onEnd,
  footer,
}: CallPanelProps) {
  const isLive = status === 'live';
  const isEnded = status === 'ended';
  const muteLabel = muteLabelOf(isMuted);

  return (
    <section
      aria-label='Call'
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col items-center gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex w-full items-center justify-between gap-3'>
        <h2 className='min-w-0 truncate text-sm font-medium'>{title}</h2>
        <CallClock startedAt={startedAt} endedAt={endedAt} />
      </div>
      <VoiceDisc mode={mode} isActive={isActive && isLive} />
      <Swap swapKey={mode} className='text-[13px] font-medium'>
        {MODE_WORD[mode]}
      </Swap>
      <Transcript lines={lines} />
      <div className='flex h-9 items-center gap-2'>
        {!isEnded && (
          <Button
            type='button'
            variant='outline'
            size='lg'
            aria-pressed={isMuted}
            disabled={!isLive}
            onClick={onToggleMute}
          >
            <Swap swapKey={muteLabel}>
              {isMuted && <MicOffIcon />}
              {!isMuted && <MicIcon />}
            </Swap>
            {muteLabel}
          </Button>
        )}
        {!isEnded && (
          <Button
            type='button'
            variant='destructive'
            size='lg'
            disabled={!isLive}
            onClick={onEnd}
            className={pressedDestructiveOf(pressed === 'end')}
          >
            <PhoneOffIcon />
            End call
          </Button>
        )}
        {isEnded && footer}
      </div>
    </section>
  );
}
