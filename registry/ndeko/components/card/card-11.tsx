'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from 'motion/react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { PRESS_LEAD_MS, usePress } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { hashOf } from '@/registry/ndeko/lib/seeded';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { PEOPLE } from './_parts/people';
import { pressedShapeOf } from './_parts/pressed-shape';
import { SampleNote } from './_parts/sample-note';
import { TearLine, TICKET_OUTLINE, ticketMaskOf } from './_parts/ticket';
import { useCardDemo } from './_parts/use-card-demo';
import { useHover } from './_parts/use-peek';

export type PassDetails = {
  event: string;
  venue: string;
  /** The day, the hour and the seat as they read: "Thu 3 Dec", "09:30", "C 14". */
  date: string;
  doors: string;
  seat: string;
  holder: string;
  /** The number printed on the stub. The pattern above it is drawn from it and is never a working code. */
  reference: string;
};

export type PassCardHandle = {
  /** Leans the pass towards a point of its face: -0.5 is the left or top edge, 0.5 the right or bottom one. */
  tiltTo: (across: number, down: number) => void;
  rest: () => void;
  /** Sends the band of light across the pass once. */
  shine: () => void;
};

const MAX_TILT_DEG = 7;

const TILT_SPRING = { stiffness: 220, damping: 28, mass: 0.6 };

const PATTERN_SIDE = 9;

const PATTERN_CELL_COUNT = PATTERN_SIDE * PATTERN_SIDE;

const PATTERN_CELLS = Array.from(
  { length: PATTERN_CELL_COUNT },
  (_, cell) => cell
);

/** Two cells in five are inked, with no corner squares: it reads as a code and scans as nothing. */
const INKED_OUT_OF_FIVE = 2;

/**
 * Under 21rem the pass stands upright with its stub underneath: the notch that sat at the top of
 * the tear moves to its other end, through the custom properties the two pieces set.
 */
const MAIN_MASK = ticketMaskOf(['var(--main-notch)', 'right bottom']);

const STUB_MASK = ticketMaskOf(['left top', 'var(--stub-notch)']);

const UPRIGHT = '@max-[21rem]:basis-full';

const MAIN = [
  'relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden rounded-s-xl p-4 [--main-notch:right_top]',
  '@max-[21rem]:rounded-es-none @max-[21rem]:rounded-se-xl @max-[21rem]:[--main-notch:left_bottom]',
  UPRIGHT,
].join(' ');

const FIELDS =
  'grid grid-cols-3 gap-2 @max-[21rem]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]';

const PAPER = 'bg-[color-mix(in_oklab,var(--primary)_9%,var(--card))]';

/** The paper is tinted, and the muted text colour was measured on a plain card: quiet text here is the foreground, lightened. */
const QUIET_INK = 'text-foreground/70';

const PASS = [
  'group/pass @container relative flex w-full cursor-pointer flex-wrap text-start outline-none',
  'transition-[scale] duration-150 ease-(--ease-out-strong) active:scale-[0.98]',
  'focus-visible:ring-ring focus-visible:ring-offset-background rounded-xl focus-visible:ring-2 focus-visible:ring-offset-4',
].join(' ');

const STUB = [
  'relative flex w-24 shrink-0 origin-top-left flex-col items-center justify-center gap-2 rounded-e-xl px-3 py-4 [--stub-notch:left_bottom]',
  '@max-[21rem]:w-full @max-[21rem]:flex-row @max-[21rem]:gap-3 @max-[21rem]:py-3',
  '@max-[21rem]:rounded-se-none @max-[21rem]:rounded-es-xl @max-[21rem]:[--stub-notch:right_top]',
  'transition-[translate,rotate,opacity] duration-300 ease-(--ease-out-strong)',
].join(' ');

const TORN = [
  'translate-x-2 translate-y-1.5 rotate-[5deg] opacity-80',
  '@max-[21rem]:translate-x-0 @max-[21rem]:translate-y-2 @max-[21rem]:rotate-[3deg]',
].join(' ');

const SHEEN = [
  'pointer-events-none absolute inset-y-0 start-0 w-1/3 -skew-x-12',
  '[--sheen:rgb(255_255_255/0.75)] dark:[--sheen:rgb(255_255_255/0.12)]',
  'translate-x-[330%] transition-transform duration-700 ease-(--ease-in-out-strong) starting:translate-x-[-120%]',
].join(' ');

const SHEEN_LIGHT = {
  backgroundImage:
    'linear-gradient(90deg, transparent, var(--sheen), transparent)',
};

function clampToFace(position: number) {
  const atLeast = Math.max(position, -0.5);
  return Math.min(atLeast, 0.5);
}

function isInked(reference: string, cell: number) {
  const seed = hashOf(`${reference}-${cell}`);
  const draw = seed % 5;
  return draw < INKED_OUT_OF_FIVE;
}

function inkOf(isOn: boolean) {
  if (isOn) {
    return 'bg-foreground/85';
  }
  return undefined;
}

function tornOf(isUsed: boolean) {
  if (isUsed) {
    return TORN;
  }
  return undefined;
}

function CodePattern({ reference }: { reference: string }) {
  return (
    <span aria-hidden='true' className='grid size-[3.25rem] grid-cols-9 gap-px'>
      {PATTERN_CELLS.map((cell) => {
        const isOn = isInked(reference, cell);
        return <span key={cell} className={cn('rounded-[1px]', inkOf(isOn))} />;
      })}
    </span>
  );
}

function PassField({ label, value }: { label: string; value: string }) {
  return (
    <span className='flex min-w-0 flex-col'>
      <span className={cn('text-xs', QUIET_INK)}>{label}</span>
      <span className='truncate text-[13px] font-medium tabular-nums'>
        {value}
      </span>
    </span>
  );
}

function StatusChip({ isUsed }: { isUsed: boolean }) {
  return (
    <Swap swapKey={String(isUsed)}>
      {isUsed && (
        <Badge variant='success'>
          <CheckIcon />
          Checked in
        </Badge>
      )}
      {!isUsed && <Badge variant='outline'>Valid</Badge>}
    </Swap>
  );
}

export type PassCardProps = {
  pass: PassDetails;
  /** Whether the holder is checked in: the stub tears away from the pass. */
  isUsed: boolean;
  onUsedChange: (isUsed: boolean) => void;
  /** Says the pass is made up. Leave it out for a real one. */
  note?: string;
  /** Leans the pass or sends the light across from outside, for a demonstration. */
  handleRef?: React.Ref<PassCardHandle>;
  /** Shows the pass held down, for a demonstration that presses it. */
  isPressed?: boolean;
  className?: string;
};

export function PassCard({
  pass,
  isUsed,
  onUsedChange,
  note,
  handleRef,
  isPressed = false,
  className,
}: PassCardProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [shineCount, setShineCount] = useState(0);
  const across = useMotionValue(0);
  const down = useMotionValue(0);
  const easedAcross = useSpring(across, TILT_SPRING);
  const easedDown = useSpring(down, TILT_SPRING);
  const rotateY = useTransform(
    easedAcross,
    [-0.5, 0.5],
    [-MAX_TILT_DEG, MAX_TILT_DEG]
  );
  const rotateX = useTransform(
    easedDown,
    [-0.5, 0.5],
    [MAX_TILT_DEG, -MAX_TILT_DEG]
  );
  const passStyle: MotionStyle = {
    ...TICKET_OUTLINE,
    rotateX,
    rotateY,
    transformPerspective: 900,
  };
  const label = `Pass for ${pass.event}, ${pass.holder}. Mark as checked in`;
  const hasShone = shineCount > 0;

  function tiltTo(nextAcross: number, nextDown: number) {
    if (shouldReduceMotion) {
      return;
    }
    const boundedAcross = clampToFace(nextAcross);
    const boundedDown = clampToFace(nextDown);
    across.set(boundedAcross);
    down.set(boundedDown);
  }

  function rest() {
    across.set(0);
    down.set(0);
  }

  function shine() {
    setShineCount((current) => current + 1);
  }

  function shineUnderPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'touch') {
      shine();
    }
  }

  function shineOnKeyboardFocus(event: React.FocusEvent<HTMLButtonElement>) {
    if (event.target.matches(':focus-visible')) {
      shine();
    }
  }

  function followPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch') {
      return;
    }
    const face = event.currentTarget.getBoundingClientRect();
    const hasNoWidth = face.width === 0;
    const hasNoHeight = face.height === 0;
    if (hasNoWidth || hasNoHeight) {
      return;
    }
    const fromLeft = event.clientX - face.left;
    const fromTop = event.clientY - face.top;
    const shareAcross = fromLeft / face.width;
    const shareDown = fromTop / face.height;
    const acrossFromCentre = shareAcross - 0.5;
    const downFromCentre = shareDown - 0.5;
    tiltTo(acrossFromCentre, downFromCentre);
  }

  function toggleUsed() {
    onUsedChange(!isUsed);
  }

  useImperativeHandle(handleRef, () => ({ tiltTo, rest, shine }));

  return (
    <motion.button
      type='button'
      aria-pressed={isUsed}
      aria-label={label}
      style={passStyle}
      onClick={toggleUsed}
      onPointerEnter={shineUnderPointer}
      onPointerMove={followPointer}
      onPointerLeave={rest}
      onFocus={shineOnKeyboardFocus}
      className={cn(PASS, pressedShapeOf(isPressed), className)}
    >
      <span style={MAIN_MASK} className={cn(MAIN, PAPER)}>
        <span className='flex items-center justify-between gap-2'>
          <span className={cn('min-w-0 text-xs', QUIET_INK)}>{pass.venue}</span>
          <StatusChip isUsed={isUsed} />
        </span>
        <span className='text-lg leading-6 font-semibold text-balance'>
          {pass.event}
        </span>
        <span className={FIELDS}>
          <PassField label='Date' value={pass.date} />
          <PassField label='Doors' value={pass.doors} />
          <PassField label='Seat' value={pass.seat} />
        </span>
        <span className='flex items-center gap-2'>
          <Avatar seed={pass.holder} className='size-6' />
          <span className='min-w-0 truncate text-[13px]'>{pass.holder}</span>
          {note && (
            <SampleNote className={cn('ms-auto shrink-0', QUIET_INK)}>
              {note}
            </SampleNote>
          )}
        </span>
        {hasShone && (
          <span
            key={shineCount}
            aria-hidden='true'
            style={SHEEN_LIGHT}
            className={SHEEN}
          />
        )}
      </span>
      <span aria-hidden='true' className={cn('relative', UPRIGHT)}>
        <TearLine
          direction='column'
          className='absolute inset-y-3 start-0 @max-[21rem]:hidden'
        />
        <TearLine
          direction='row'
          className='absolute inset-x-3 top-0 hidden @max-[21rem]:block'
        />
      </span>
      <span style={STUB_MASK} className={cn(STUB, PAPER, tornOf(isUsed))}>
        <CodePattern reference={pass.reference} />
        <span className='font-mono text-xs tabular-nums'>{pass.reference}</span>
      </span>
    </motion.button>
  );
}

const PASS_DETAILS: PassDetails = {
  event: 'Design Systems Day',
  venue: 'Pavilion Hall, Lisbon',
  date: 'Thu 3 Dec',
  doors: '09:30',
  seat: 'C 14',
  holder: PEOPLE.mei.name,
  reference: 'A7K2 0091',
};

function announcementOf(isUsed: boolean) {
  if (isUsed) {
    return `${PASS_DETAILS.holder} is checked in, the stub is torn`;
  }
  return 'The pass is valid again';
}

export default function Card11() {
  const [isUsed, setIsUsed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const pass = useRef<PassCardHandle>(null);
  const { pressed, press } = usePress<'pass'>();
  const { isHovered, hoverHandlers } = useHover();

  function startOver() {
    setIsUsed(false);
    pass.current?.rest();
  }

  /** Only a person's press is said: a pointer resting on the pass pauses the demonstration, and that pause must stay silent. */
  function checkInFromPass(nextIsUsed: boolean) {
    setIsUsed(nextIsUsed);
    setAnnouncement(announcementOf(nextIsUsed));
  }

  function leanIn() {
    pass.current?.shine();
    pass.current?.tiltTo(-0.36, -0.3);
  }

  const steps: AutoplayStep[] = [
    { after: 1300, run: leanIn },
    { after: 1000, run: () => pass.current?.tiltTo(0.38, 0.26) },
    { after: 1000, run: () => pass.current?.rest() },
    { after: 900, run: () => press('pass') },
    { after: PRESS_LEAD_MS, run: () => setIsUsed(true) },
    { after: 2200, run: () => press('pass') },
    { after: PRESS_LEAD_MS, run: () => setIsUsed(false) },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 1400,
    onReset: startOver,
    isEnabled: !isHovered,
  });
  const isDemoStopped = !isAutoplaying && !isHovered;

  /** A tilt the demonstration leaves when a person takes over settles back: a keyboard has no pointer to undo it. */
  useEffect(() => {
    if (isDemoStopped) {
      pass.current?.rest();
    }
  }, [isDemoStopped]);

  return (
    <div
      ref={ref}
      className='min-h-[10.75rem] w-full max-w-[26rem]'
      {...hoverHandlers}
    >
      <PassCard
        pass={PASS_DETAILS}
        isUsed={isUsed}
        onUsedChange={checkInFromPass}
        note='Sample pass'
        handleRef={pass}
        isPressed={pressed === 'pass'}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
