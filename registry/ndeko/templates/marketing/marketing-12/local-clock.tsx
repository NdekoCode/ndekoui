'use client';

import { useInView } from 'motion/react';
import { useRef } from 'react';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { ClockIcon } from '@/registry/ndeko/lib/icons';

import { STUDIO_CLOCK } from './data';

const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: STUDIO_CLOCK.timeZone,
});

function timeTextOf(now: number) {
  if (now === 0) {
    return '--:--';
  }
  return TIME_FORMAT.format(now);
}

export function LocalClock() {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref);
  const now = useNow(1000, isInView);
  const timeText = timeTextOf(now);

  return (
    <p
      ref={ref}
      className='text-muted-foreground flex items-center gap-1.5 text-xs'
    >
      <ClockIcon className='size-3.5' />
      <span>{STUDIO_CLOCK.place}</span>
      <time className='text-foreground tabular-nums'>{timeText}</time>
    </p>
  );
}
