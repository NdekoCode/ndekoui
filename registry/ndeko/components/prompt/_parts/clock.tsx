'use client';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { formatClock } from '@/registry/ndeko/lib/media-clock';
import { cn } from '@/registry/ndeko/lib/utils';

type ClockSinceProps = {
  startedAt: number;
  isRunning: boolean;
  className?: string;
};

/** A minutes and seconds clock; only this text re-renders while it runs. */
export function ClockSince({
  startedAt,
  isRunning,
  className,
}: ClockSinceProps) {
  const now = useNow(250, isRunning);
  const elapsed = now - startedAt;
  const text = formatClock(elapsed);

  return <span className={cn('tabular-nums', className)}>{text}</span>;
}
