'use client';

import { useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  restStyleOf,
  RING_SPEC,
  stillStyleOf,
  type RingSpec,
  type SoundRingSize,
} from './_parts/ring-geometry';
import { usePlayWhileSeen } from './_parts/use-play-while-seen';
import { useRingMotion } from './_parts/use-ring-motion';

export type { SoundRingSize } from './_parts/ring-geometry';

function accessibilityOf(label: string | undefined) {
  if (label === undefined) {
    return { 'aria-hidden': true } as const;
  }
  return { role: 'img', 'aria-label': label } as const;
}

function barStyleOf(index: number, spec: RingSpec, showsStill: boolean) {
  if (showsStill) {
    return stillStyleOf(index, spec);
  }
  return restStyleOf(index, spec);
}

export type SoundRingProps = {
  /** While false the ring is quiet: its bars rest and nothing runs. */
  isActive: boolean;
  /** The live level of the sound, between 0 and 1, read about eight times a second: the louder it is, the faster the peak turns. Left out, a simulated voice drives the ring. */
  level?: () => number;
  /** `sm` is 20px and sits beside a label, `md` is 40px and fits a button, `lg` is 96px and stands alone. */
  size?: SoundRingSize;
  /** Names the ring for screen readers when it stands alone. Left out, it is decorative. */
  label?: string;
  className?: string;
};

export function SoundRing({
  isActive,
  level,
  size = 'md',
  label,
  className,
}: SoundRingProps) {
  const spec = RING_SPEC[size];
  const { ref, isOnScreen, isStill } = usePlayWhileSeen<HTMLSpanElement>();
  const showsStill = isActive && isStill;
  const accessibility = accessibilityOf(label);
  const indexes = Array.from({ length: spec.bars }, (_, index) => index);

  useRingMotion(ref, { spec, isActive, isStill, isOnScreen, level });

  return (
    <span
      ref={ref}
      {...accessibility}
      style={{ width: spec.px, height: spec.px }}
      className={cn('text-primary relative inline-block shrink-0', className)}
    >
      {indexes.map((index) => (
        <span
          key={index}
          data-bar=''
          style={barStyleOf(index, spec, showsStill)}
          className='absolute bottom-1/2 left-1/2 origin-bottom rounded-full bg-current transition-[transform,opacity] duration-300 ease-(--ease-out-strong)'
        />
      ))}
    </span>
  );
}

const STATE_WORDS = ['Idle', 'Listening'];

function stateWordOf(isActive: boolean) {
  if (isActive) {
    return 'Listening';
  }
  return 'Idle';
}

export default function Voice05() {
  const [isActive, setIsActive] = useState(true);
  const { pressed, press } = usePress<'listen'>();
  const stateWord = stateWordOf(isActive);

  function toggle() {
    setIsActive((current) => !current);
  }

  function goQuiet() {
    setIsActive(false);
  }

  function goActive() {
    setIsActive(true);
  }

  const steps: AutoplayStep[] = [
    { after: 5200, run: () => press('listen') },
    { after: PRESS_LEAD_MS, run: goQuiet },
    { after: 2200, run: () => press('listen') },
    { after: PRESS_LEAD_MS, run: goActive },
    { after: 2600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 600,
    onReset: goActive,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex w-full max-w-[22rem] flex-col items-center gap-4'
    >
      <div className='bg-card hairline-ring ring-border flex w-full flex-col items-center gap-6 rounded-xl px-4 py-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <SoundRing size='lg' isActive={isActive} label={stateWord} />
        <div className='flex w-full items-center justify-between gap-3'>
          <p className='flex min-w-0 items-center gap-2 text-[13px] font-medium'>
            <SoundRing size='sm' isActive={isActive} />
            <WordRoll text={stateWord} labels={STATE_WORDS} />
          </p>
          <Button
            type='button'
            variant='outline'
            aria-label='Listen'
            aria-pressed={isActive}
            onClick={toggle}
            className={cn('size-14 p-0', pressedQuietOf(pressed === 'listen'))}
          >
            <SoundRing size='md' isActive={isActive} />
          </Button>
        </div>
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, stateWord)} />
    </div>
  );
}
