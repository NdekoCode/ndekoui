'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { cn } from '@/registry/ndeko/lib/utils';

import { useHover } from './_parts/use-hover';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';

const DEFAULT_STRIPS = 8;

/** Neighbouring strips overlap by this much, so no seam of the page shows between them. */
const SEAM_PX = 0.4;

/** A strip may slide this far past the sides of the word before its edge cuts a letter. */
const SIDE_ROOM = '-12%';

/** How far a strip next to the cut slides, in em: it scales with the size of the type. */
const CUT_EM = 0.12;

/** Letters rise above and drop below the line box of tight type: the first and the last strip reach this far past it, so no top or tail is cut off. */
const OUTER_ROOM = '-0.35em';

/** Strips feel the cut this far from it, as a share of the height of the word. */
const CUT_REACH = 0.42;

const ASSEMBLE_MS = 1050;

const ASSEMBLE_STAGGER_MS = 45;

/** Where each strip leaves to and comes back from, as a share of the width of the word. */
const LEAVE_SHARE = 40;

const ENTER_SHARE = 64;

/** The strip leaves over the first quarter and comes back over the rest. */
const TURN_OFFSET = 0.26;

const LEAVE_EASING = 'cubic-bezier(0.77, 0, 0.175, 1)';

const ENTER_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

function percentOf(share: number) {
  const hundredths = Math.round(share * 10000);
  return hundredths / 100;
}

/** Where a band stops, from its own edge of the word: the outer bands reach past the line box, the inner ones overlap their neighbour by a hair. */
function bandEdgeOf(bandsBefore: number, count: number) {
  if (bandsBefore === 0) {
    return OUTER_ROOM;
  }
  const share = percentOf(bandsBefore / count);
  return `calc(${share}% - ${SEAM_PX}px)`;
}

function bandOf(index: number, count: number) {
  const top = bandEdgeOf(index, count);
  const bandsBelow = count - 1 - index;
  const bottom = bandEdgeOf(bandsBelow, count);
  return `inset(${top} ${SIDE_ROOM} ${bottom} ${SIDE_ROOM})`;
}

/** Even strips come in from the left, odd ones from the right. */
function travelOf(index: number) {
  if (index % 2 === 0) {
    return 1;
  }
  return -1;
}

/** A strip slides on the way it travels and out, jumps unseen to the side it comes in from, and settles in place. */
function assembleKeyframesOf(index: number): Keyframe[] {
  const travel = travelOf(index);
  const leaveTo = travel * LEAVE_SHARE;
  const enterFrom = -travel * ENTER_SHARE;
  return [
    {
      offset: 0,
      transform: 'translateX(0%)',
      opacity: 1,
      easing: LEAVE_EASING,
    },
    { offset: TURN_OFFSET, transform: `translateX(${leaveTo}%)`, opacity: 0 },
    {
      offset: TURN_OFFSET,
      transform: `translateX(${enterFrom}%)`,
      opacity: 0,
      easing: ENTER_EASING,
    },
    { offset: 1, transform: 'translateX(0%)', opacity: 1 },
  ];
}

/** Strips above the cut slide to one side and strips under it to the other, less the further they are from it. */
function shiftOf(index: number, count: number, cut: number | null) {
  if (cut === null) {
    return 'translateX(0em)';
  }
  const centre = (index + 0.5) / count;
  const fromCut = centre - cut;
  const nearness = Math.max(0, 1 - Math.abs(fromCut) / CUT_REACH);
  const pull = nearness * nearness;
  const side = Math.sign(fromCut);
  const shift = side * CUT_EM * pull;
  const rounded = Math.round(shift * 1000) / 1000;
  return `translateX(${rounded}em)`;
}

function stripsIn(root: HTMLElement, part: string) {
  const elements = root.querySelectorAll<HTMLElement>(`[data-${part}]`);
  return Array.from(elements);
}

function cancelAll(animations: Animation[]) {
  for (const animation of animations) {
    animation.cancel();
  }
}

export type SliceTextHandle = {
  /** Sends the strips out to both sides and back into the word. */
  assemble: () => void;
  /** Cuts the word apart at a height given as a share of it, as a pointer there would, for a demonstration. */
  cutAt: (share: number) => void;
  /** Lets the strips ease back into the word. */
  mend: () => void;
};

export type SliceTextProps = {
  text: string;
  /** How many horizontal strips the word is cut into. */
  strips?: number;
  /** Plays the strips from outside, for a demonstration or a hero that assembles once it loads. */
  handleRef?: React.Ref<SliceTextHandle>;
  className?: string;
};

/**
 * A word drawn as horizontal strips of itself. They fly in from both sides and settle into the
 * letters, and the pointer cuts the word apart around it. The word itself stays in the page as
 * plain text that can be selected and read; the strips are drawn over it. They travel inside a box
 * a little wider than the word, clipped on its sides, so a strip on its way in never widens the page.
 */
export function SliceText({
  text,
  strips = DEFAULT_STRIPS,
  handleRef,
  className,
}: SliceTextProps) {
  const { ref, isPlaying, isStill } = usePlayWhileSeen<HTMLSpanElement>();
  const assembling = useRef<Animation[]>([]);
  const pendingCut = useRef<number | null>(null);
  const frame = useRef(0);
  const count = Math.max(1, Math.round(strips));
  const indexes = Array.from({ length: count }, (_, index) => index);

  useEffect(() => {
    if (isPlaying) {
      return;
    }
    cancelAll(assembling.current);
    assembling.current = [];
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current);
      cancelAll(assembling.current);
    };
  }, []);

  function applyCut() {
    frame.current = 0;
    const root = ref.current;
    if (!root) {
      return;
    }
    const cut = pendingCut.current;
    const shifts = stripsIn(root, 'strip-shift');
    shifts.forEach((element, index) => {
      element.style.transform = shiftOf(index, shifts.length, cut);
    });
  }

  /** Many pointer moves can come in one frame: the strips are moved once per frame, to the last one. */
  function cutAt(share: number | null) {
    if (isStill) {
      return;
    }
    pendingCut.current = share;
    if (frame.current !== 0) {
      return;
    }
    frame.current = requestAnimationFrame(applyCut);
  }

  function assemble() {
    const root = ref.current;
    if (!root || isStill) {
      return;
    }
    cancelAll(assembling.current);
    const bands = stripsIn(root, 'strip');
    assembling.current = bands.map((band, index) =>
      band.animate(assembleKeyframesOf(index), {
        duration: ASSEMBLE_MS,
        delay: index * ASSEMBLE_STAGGER_MS,
      })
    );
  }

  function cutFromPointer(event: React.PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === 'touch') {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    if (box.height === 0) {
      return;
    }
    const share = (event.clientY - box.top) / box.height;
    cutAt(share);
  }

  function mend() {
    cutAt(null);
  }

  useImperativeHandle(handleRef, () => ({ assemble, cutAt, mend }));

  return (
    <span
      ref={ref}
      onPointerMove={cutFromPointer}
      onPointerLeave={mend}
      className={cn(
        'relative -mx-[0.15em] inline-block overflow-x-clip px-[0.15em]',
        className
      )}
    >
      <span className='selection:bg-primary/20 text-transparent selection:text-transparent forced-colors:text-[color:CanvasText]'>
        {text}
      </span>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-[0.15em] inset-y-0 select-none forced-colors:hidden'
      >
        {indexes.map((index) => (
          <span
            key={index}
            data-strip=''
            style={{ clipPath: bandOf(index, count) }}
            className='absolute inset-0'
          >
            <span
              data-strip-shift=''
              className='block transition-transform duration-[450ms] ease-(--ease-out-strong)'
            >
              {text}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

/** A pointer passing down the word: the heights the cut goes through, as shares of it. */
const SWEEP = [0.18, 0.3, 0.42, 0.54, 0.66, 0.78];

const SWEEP_STEP_MS = 130;

export default function TextEffect02() {
  const slice = useRef<SliceTextHandle>(null);
  const { isHovered, hoverHandlers } = useHover();
  const sweepSteps: AutoplayStep[] = SWEEP.map((share) => ({
    after: SWEEP_STEP_MS,
    run: () => slice.current?.cutAt(share),
  }));
  const steps: AutoplayStep[] = [
    { after: 1400, run: () => slice.current?.assemble() },
    { after: 2200, run: () => slice.current?.cutAt(0.06) },
    ...sweepSteps,
    { after: 520, run: () => slice.current?.mend() },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1800,
    onReset: () => slice.current?.mend(),
    isEnabled: !isHovered,
  });
  const isDemoStopped = !isAutoplaying && !isHovered;

  /** A cut the demonstration leaves when a person takes over closes: a keyboard has no pointer to mend it. */
  useEffect(() => {
    if (isDemoStopped) {
      slice.current?.mend();
    }
  }, [isDemoStopped]);

  return (
    <div
      ref={ref}
      className='@container flex w-full max-w-[34rem] justify-center'
      {...hoverHandlers}
    >
      <p className='text-[length:clamp(3.5rem,20cqw,7rem)] leading-none font-semibold'>
        <SliceText handleRef={slice} text='Sharp' />
      </p>
    </div>
  );
}
