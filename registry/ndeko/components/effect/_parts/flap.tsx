'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

type HalfSide = 'top' | 'bottom';

type Fold = {
  from: string;
  to: string;
};

/** What a flap shows until its clock has a reading, so the server and the browser print the same text. */
export const FLAP_PLACEHOLDER = '--';

const FALL_MS = 170;

const LAND_MS = 170;

const PERSPECTIVE = 'perspective(14em)';

const LIT = 'brightness(1)';

const SHADED = 'brightness(0.82)';

/** The upper leaf speeds up as it falls and the lower one slows down as it lands, so the card keeps one speed through the vertical. */
const FALL_EASING = 'cubic-bezier(0.4, 0, 1, 1)';

const LAND_EASING = 'cubic-bezier(0.23, 1, 0.32, 1)';

const FALL_KEYFRAMES: Keyframe[] = [
  { transform: `${PERSPECTIVE} rotateX(0deg)`, filter: LIT },
  { transform: `${PERSPECTIVE} rotateX(-90deg)`, filter: SHADED },
];

const LAND_KEYFRAMES: Keyframe[] = [
  { transform: `${PERSPECTIVE} rotateX(90deg)`, filter: SHADED },
  { transform: `${PERSPECTIVE} rotateX(0deg)`, filter: LIT },
];

/** The lower leaf waits edge-on until it is its turn to land. */
const WAITING_LEAF: React.CSSProperties = {
  transform: `${PERSPECTIVE} rotateX(90deg)`,
};

const PLATE_SIDES: Record<HalfSide, string> = {
  top: 'top-0 origin-bottom rounded-t-xl bg-card',
  bottom: 'bottom-0 origin-top rounded-b-xl bg-muted dark:bg-background',
};

const GLYPH_SIDES: Record<HalfSide, string> = {
  top: 'top-0',
  bottom: 'bottom-0',
};

type HalfProps = {
  digits: string;
  side: HalfSide;
  ref?: React.Ref<HTMLSpanElement>;
  style?: React.CSSProperties;
  className?: string;
};

/** One half of a card: the figure is laid out over the whole card and this window shows its upper or its lower part. */
function Half({ digits, side, ref, style, className }: HalfProps) {
  return (
    <span
      ref={ref}
      aria-hidden='true'
      style={style}
      className={cn(
        'absolute inset-x-0 h-1/2 overflow-hidden',
        PLATE_SIDES[side],
        className
      )}
    >
      <span
        className={cn(
          'absolute inset-x-0 flex h-[200%] items-center justify-center',
          GLYPH_SIDES[side]
        )}
      >
        {digits}
      </span>
    </span>
  );
}

type LeavesProps = {
  fold: Fold;
  onDone: () => void;
};

/** The two leaves of one fold: the old upper half falls forward, then the new lower half lands. They exist only while the fold plays. */
function Leaves({ fold, onDone }: LeavesProps) {
  const fallingRef = useRef<HTMLSpanElement>(null);
  const landingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const falling = fallingRef.current;
    const landing = landingRef.current;
    if (!falling || !landing) {
      return;
    }
    const fall = falling.animate(FALL_KEYFRAMES, {
      duration: FALL_MS,
      easing: FALL_EASING,
      fill: 'forwards',
    });
    const land = landing.animate(LAND_KEYFRAMES, {
      duration: LAND_MS,
      delay: FALL_MS,
      easing: LAND_EASING,
      fill: 'both',
    });
    land.onfinish = onDone;
    return () => {
      fall.cancel();
      land.cancel();
    };
  }, [onDone]);

  return (
    <>
      <Half ref={fallingRef} digits={fold.from} side='top' className='z-10' />
      <Half
        ref={landingRef}
        digits={fold.to}
        side='bottom'
        style={WAITING_LEAF}
        className='z-20'
      />
    </>
  );
}

export type FlapProps = {
  /** The figure on the card, two characters wide. */
  value: string;
  className?: string;
};

/**
 * A split flap card. When its figure changes the old upper half falls forward over the hinge and
 * the new lower half lands behind it, in perspective. The first reading after the placeholder and
 * any change under reduced motion simply appear. Its size follows the font size of its parent.
 */
export function Flap({ value, className }: FlapProps) {
  const isStill = usePrefersReducedMotion();
  const [settled, setSettled] = useState(value);
  const [fold, setFold] = useState<Fold | null>(null);
  const finishFold = useCallback(() => setFold(null), []);
  const hasChanged = value !== settled;

  if (hasChanged) {
    const hadReading = settled !== FLAP_PLACEHOLDER;
    const canFold = hadReading && !isStill;
    setSettled(value);
    if (canFold) {
      setFold({ from: settled, to: value });
    } else {
      setFold(null);
    }
  }

  const lowerDigits = fold?.from ?? settled;

  return (
    <span
      className={cn(
        'hairline-ring ring-border text-foreground relative block h-[1.8em] w-[1.5em] rounded-xl leading-none font-semibold tabular-nums shadow-[0_1px_2px_rgb(0_0_0/0.05)]',
        className
      )}
    >
      <Half digits={settled} side='top' />
      <Half digits={lowerDigits} side='bottom' />
      {fold && (
        <Leaves
          key={`${fold.from}:${fold.to}`}
          fold={fold}
          onDone={finishFold}
        />
      )}
      <span
        aria-hidden='true'
        className='bg-foreground/10 absolute inset-x-0 top-1/2 z-30 h-(--hairline) -translate-y-1/2'
      />
    </span>
  );
}
