'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState, useSyncExternalStore } from 'react';

import { TicketPercentIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

const SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const CLOCK_NOT_STARTED = 0;
const EMPTY_DIGITS = '--';

const COLLAPSE_TRANSITION: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };
const DISMISS_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const COLLAPSE_VARIANTS: Variants = {
  shown: { height: 'auto', opacity: 1 },
  hidden: { height: 0, opacity: 0, transition: DISMISS_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  shown: { opacity: 1 },
  hidden: { opacity: 0, transition: DISMISS_TRANSITION },
};

let clockSecond = CLOCK_NOT_STARTED;

function collapseVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return COLLAPSE_VARIANTS;
}

function currentSecond() {
  const now = Date.now();
  return Math.floor(now / SECOND_MS);
}

function subscribeToClock(onTick: () => void) {
  function tick() {
    clockSecond = currentSecond();
    onTick();
  }
  tick();
  const interval = window.setInterval(tick, SECOND_MS);
  return () => window.clearInterval(interval);
}

function readClock() {
  return clockSecond;
}

function readServerClock() {
  return CLOCK_NOT_STARTED;
}

function secondsUntilMidnight(epochSecond: number) {
  const midnight = new Date(epochSecond * SECOND_MS);
  midnight.setHours(24, 0, 0, 0);
  const midnightMs = midnight.getTime();
  const midnightSecond = Math.floor(midnightMs / SECOND_MS);
  return midnightSecond - epochSecond;
}

function twoDigits(value: number) {
  const text = String(value);
  return text.padStart(2, '0');
}

function countdownOf(epochSecond: number) {
  if (epochSecond === CLOCK_NOT_STARTED) {
    return {
      hours: EMPTY_DIGITS,
      minutes: EMPTY_DIGITS,
      seconds: EMPTY_DIGITS,
    };
  }
  const remaining = secondsUntilMidnight(epochSecond);
  const hours = Math.floor(remaining / SECONDS_PER_HOUR);
  const secondsInHour = remaining % SECONDS_PER_HOUR;
  const minutes = Math.floor(secondsInHour / SECONDS_PER_MINUTE);
  const seconds = remaining % SECONDS_PER_MINUTE;
  return {
    hours: twoDigits(hours),
    minutes: twoDigits(minutes),
    seconds: twoDigits(seconds),
  };
}

export default function Banner10() {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const collapseVariants = collapseVariantsOf(shouldReduceMotion);
  const epochSecond = useSyncExternalStore(
    subscribeToClock,
    readClock,
    readServerClock
  );
  const countdown = countdownOf(epochSecond);

  function dismiss() {
    setIsVisible(false);
  }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key='banner'
          className='bg-primary/[0.06] hairline-ring ring-primary/15 dark:bg-primary/10 @container w-full overflow-hidden rounded-xl'
          variants={collapseVariants}
          initial='hidden'
          animate='shown'
          exit='hidden'
          transition={COLLAPSE_TRANSITION}
        >
          <div className='flex gap-2 px-4 py-3 @xl:items-center'>
            <div className='flex grow gap-3 @xl:items-center'>
              <StatusOrb
                tone='brand'
                glyph={<TicketPercentIcon strokeWidth={2.25} />}
                className='m-1'
              />
              <div className='flex grow flex-col justify-between gap-3 @xl:flex-row @xl:items-center'>
                <div className='flex flex-col gap-0.5 text-[13px]'>
                  <p className='font-medium'>Spring sale ends at midnight</p>
                  <p className='text-muted-foreground'>
                    Annual plans are 30% off until the end of the day.
                  </p>
                </div>
                <div className='flex flex-wrap items-center gap-3'>
                  <div
                    role='timer'
                    className='bg-card hairline-ring ring-border hairline-divide-x divide-border flex h-7 items-center rounded-md text-[13px] tabular-nums'
                  >
                    <span className='px-2'>
                      {countdown.hours}
                      <span className='text-muted-foreground'>h</span>
                    </span>
                    <span className='px-2'>
                      {countdown.minutes}
                      <span className='text-muted-foreground'>m</span>
                    </span>
                    <span className='px-2'>
                      {countdown.seconds}
                      <span className='text-muted-foreground'>s</span>
                    </span>
                  </div>
                  <Button size='sm'>Buy now</Button>
                </div>
              </div>
            </div>
            <Button
              variant='ghost'
              size='icon-sm'
              className='-me-2 @xl:-my-0.5'
              aria-label='Dismiss banner'
              onClick={dismiss}
            >
              <XIcon className='opacity-60' />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
