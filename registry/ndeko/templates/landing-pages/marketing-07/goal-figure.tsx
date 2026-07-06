'use client';

import { motion, useInView, type Transition } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { confetti } from '@/components/core/confetti';
import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import { GOAL } from './data';
import { PopShape } from './pop-shape';
import { Reveal } from './reveal';

const SEEN_ONCE = { once: true, amount: 0.6 } as const;

const CONFETTI_COLORS = [
  'var(--primary)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
];

const DROP: Transition = { duration: 0.55, ease: EASE_OUT_STRONG };

const FADE: Transition = { duration: 0.2 };

const HIDDEN = { y: -56, opacity: 0, scale: 1.04 };

const LANDED = { y: 0, opacity: 1, scale: 1 };

const HIDDEN_STILL = { opacity: 0 };

const LANDED_STILL = { opacity: 1 };

function startOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return HIDDEN_STILL;
  }
  return HIDDEN;
}

function endOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return LANDED_STILL;
  }
  return LANDED;
}

function figureStateOf(isInView: boolean, shouldReduceMotion: boolean | null) {
  if (isInView) {
    return endOf(shouldReduceMotion);
  }
  return startOf(shouldReduceMotion);
}

function dropOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return DROP;
}

export function GoalFigure() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(sectionRef, SEEN_ONCE);
  const [value, setValue] = useState(0);
  const [round, setRound] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasLanded = value > 0;

  useEffect(() => {
    if (!isInView) {
      return;
    }
    const landing = setTimeout(() => setValue(GOAL.figure), 150);
    const burst = setTimeout(() => {
      const figure = figureRef.current;
      if (!figure) {
        return;
      }
      void confetti({
        origin: figure,
        particleCount: 80,
        spread: 100,
        velocity: 34,
        colors: CONFETTI_COLORS,
      });
    }, 700);
    return () => {
      clearTimeout(landing);
      clearTimeout(burst);
    };
  }, [isInView, round]);

  function replay() {
    setValue(0);
    setRound((count) => count + 1);
  }

  return (
    <section className='relative overflow-x-clip px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'>
      <PopShape
        kind='pill'
        series={5}
        className='top-12 left-4 h-6 w-16 -rotate-12 @3xl:top-20 @3xl:left-24 @3xl:h-8 @3xl:w-24'
      />
      <PopShape
        kind='circle'
        series={1}
        delay={0.1}
        className='right-6 bottom-16 size-10 @3xl:right-28 @3xl:bottom-24 @3xl:size-14'
      />
      <Reveal
        className='mx-auto max-w-3xl'
        groupClassName='flex flex-col items-center gap-6 text-center'
      >
        <SettleItem className='flex flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {GOAL.title}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-xl text-base text-pretty'>
            {GOAL.description}
          </p>
        </SettleItem>
        <SettleItem>
          <div ref={sectionRef} className='flex flex-col items-center gap-3'>
            <motion.p
              key={round}
              ref={figureRef}
              initial={startOf(shouldReduceMotion)}
              animate={figureStateOf(isInView, shouldReduceMotion)}
              transition={dropOf(shouldReduceMotion)}
              className='text-6xl font-semibold tabular-nums @2xl:text-8xl'
            >
              <MotionNumber value={value} prefix='$' />
            </motion.p>
            <p className='text-muted-foreground text-sm'>{GOAL.caption}</p>
            <p className='text-muted-foreground text-xs'>{GOAL.note}</p>
            <ReplayButton
              isShown={hasLanded}
              onReplay={replay}
              label={GOAL.replay}
            />
          </div>
        </SettleItem>
      </Reveal>
    </section>
  );
}
