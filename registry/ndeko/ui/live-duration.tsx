'use client';

import { createContext, useContext } from 'react';

import { useNow } from '@/registry/ndeko/hooks/use-agent-run';
import { elapsedOf, formatDuration } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

/** Off screen, every live clock under it holds still, so nothing re-renders where no one looks. */
const ClockGateContext = createContext(true);

type ClockGateProps = {
  isActive: boolean;
  children: React.ReactNode;
};

export function ClockGate({ isActive, children }: ClockGateProps) {
  return (
    <ClockGateContext.Provider value={isActive}>
      {children}
    </ClockGateContext.Provider>
  );
}

export function useLiveNow(intervalMs: number, isRunning: boolean) {
  const isOpen = useContext(ClockGateContext);
  const isTicking = isRunning && isOpen;
  return useNow(intervalMs, isTicking);
}

type Timed = { startedAt?: number; endedAt?: number };

type LiveDurationProps = {
  item: Timed;
  isRunning: boolean;
  className?: string;
};

export function LiveDuration({
  item,
  isRunning,
  className,
}: LiveDurationProps) {
  const now = useLiveNow(100, isRunning);
  const elapsed = elapsedOf(item, now);
  const text = formatDuration(elapsed);

  return <span className={cn('tabular-nums', className)}>{text}</span>;
}
