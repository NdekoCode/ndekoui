'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

const DEFAULT_HOLD_MS = 2600;

type StateTileProps<Value extends string> = {
  title: string;
  name: string;
  href: string;
  states: readonly Segment<Value>[];
  holdMs?: number;
  className?: string;
  /** The component in the given state; `enteredAt` is when that state began, for live clocks. */
  children: (state: Value, enteredAt: number) => ReactNode;
};

function nextIndexOf(index: number, total: number) {
  const next = index + 1;
  return next % total;
}

function playLabelOf(isPlaying: boolean) {
  if (isPlaying) {
    return 'Hold this state';
  }
  return 'Play the states';
}

export function StateTile<Value extends string>({
  title,
  name,
  href,
  states,
  holdMs = DEFAULT_HOLD_MS,
  className,
  children,
}: StateTileProps<Value>) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [enteredAt, setEnteredAt] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const canAutoplay = !shouldReduceMotion;
  const isPlaying = isInView && !isPinned && canAutoplay;
  const state = states[index];
  const holdSeconds = holdMs / 1000;

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setTimeout(() => {
      setIndex((current) => nextIndexOf(current, states.length));
      setEnteredAt(Date.now());
    }, holdMs);
    return () => clearTimeout(timer);
  }, [isPlaying, index, holdMs, states.length]);

  function pick(value: Value) {
    const picked = states.findIndex((option) => option.value === value);
    setIsPinned(true);
    setIndex(picked);
    setEnteredAt(Date.now());
  }

  function togglePlay() {
    setIsPinned((current) => !current);
  }

  return (
    <article
      ref={ref}
      className={cn(
        'bg-foreground/[0.025] flex min-w-0 flex-col gap-3 rounded-2xl p-3',
        className
      )}
    >
      <header className='flex items-baseline justify-between gap-3 px-1'>
        <Link
          href={href}
          className='hover:text-primary-ink focus-visible:ring-ring/25 rounded-sm text-[13px] font-medium outline-none focus-visible:ring-[3px]'
        >
          {title}
        </Link>
        <span className='text-muted-foreground font-mono text-[11px]'>
          {name}
        </span>
      </header>
      <div className='flex min-h-72 items-center justify-center px-1 py-2'>
        <div className='w-full max-w-sm'>
          {children(state.value, enteredAt)}
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Segments
          value={state.value}
          segments={states}
          onValueChange={pick}
          label={`States of ${title}`}
          className='min-w-0 flex-1'
        />
        {canAutoplay && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={playLabelOf(isPlaying)}
            aria-pressed={!isPinned}
            onClick={togglePlay}
          >
            {isPlaying && <PauseIcon />}
            {!isPlaying && <PlayIcon />}
          </Button>
        )}
      </div>
      <div
        aria-hidden='true'
        className='bg-foreground/[0.06] h-px overflow-hidden'
      >
        {isPlaying && (
          <motion.div
            key={index}
            className='bg-primary h-px origin-left'
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: holdSeconds, ease: 'linear' }}
          />
        )}
      </div>
    </article>
  );
}
