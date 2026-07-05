'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { useLiveNow } from '@/registry/ndeko/ui/live-duration';

const MINUTE_MS = 60_000;

const HOUR_MS = 60 * MINUTE_MS;

const DAY_MS = 24 * HOUR_MS;

export function relativeTimeOf(at: number, now: number) {
  const age = now - at;
  const elapsed = Math.max(0, age);
  if (elapsed < MINUTE_MS) {
    return 'just now';
  }
  if (elapsed < HOUR_MS) {
    const minutes = Math.floor(elapsed / MINUTE_MS);
    return `${minutes} min ago`;
  }
  if (elapsed < DAY_MS) {
    const hours = Math.floor(elapsed / HOUR_MS);
    return `${hours} h ago`;
  }
  const days = Math.floor(elapsed / DAY_MS);
  if (days === 1) {
    return 'yesterday';
  }
  return `${days} days ago`;
}

type RelativeTimeProps = {
  at: number;
  className?: string;
};

export function RelativeTime({ at, className }: RelativeTimeProps) {
  const now = useLiveNow(1000, true);
  const label = relativeTimeOf(at, now);

  return <span className={cn('tabular-nums', className)}>{label}</span>;
}
