'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { RefreshCwIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

import { DashboardCard } from './dashboard-card';
import { ACTIVITY, LOAD_DURATION_MS } from './data';
import { fadePresence } from './motion-parts';
import { personOf } from './people';
import { PersonAvatar } from './working-cards';

type LoadState = 'failed' | 'loading' | 'loaded';

const SKELETON_ROWS = ['first', 'second', 'third'];

const META: Record<LoadState, string> = {
  failed: 'Not loaded',
  loading: 'Loading',
  loaded: 'Last 24 hours',
};

function FailedNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex items-start gap-3 py-1'>
      <StatusOrb tone='error' size='sm' className='mt-px' />
      <div className='min-w-0 flex-1'>
        <p className='text-[13px] font-medium'>Couldn’t load recent activity</p>
        <p className='text-muted-foreground mt-0.5 text-[13px] text-pretty'>
          The activity service took too long to answer, the other cards are up
          to date
        </p>
        <Button variant='outline' size='sm' onClick={onRetry} className='mt-3'>
          <RotateCcwIcon />
          Retry
        </Button>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div aria-busy='true' className='flex flex-col gap-3 py-1'>
      <span className='sr-only'>Loading recent activity</span>
      {SKELETON_ROWS.map((row) => (
        <div key={row} className='flex items-center gap-2.5'>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='h-2.5 w-2/5' />
          <Skeleton className='ms-auto h-2.5 w-8' />
        </div>
      ))}
    </div>
  );
}

function ActivityList() {
  return (
    <ul className='flex flex-col gap-3 py-1'>
      {ACTIVITY.map((entry) => {
        const person = personOf(entry.personId);
        return (
          <li key={entry.id} className='flex items-center gap-2.5'>
            <PersonAvatar person={person} />
            <p className='text-muted-foreground min-w-0 flex-1 truncate text-[13px]'>
              <span className='text-foreground font-medium'>{person.name}</span>{' '}
              {entry.text}
            </p>
            <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
              {entry.age}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityCard({ className }: { className?: string }) {
  const [state, setState] = useState<LoadState>('failed');
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const isLoaded = state === 'loaded';

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function load() {
    setState('loading');
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setState('loaded');
    }, LOAD_DURATION_MS);
    timers.current.add(timer);
  }

  const reloadButton = (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label='Reload activity'
      onClick={load}
      className='text-muted-foreground'
    >
      <RefreshCwIcon />
    </Button>
  );

  return (
    <DashboardCard
      title='Recent activity'
      meta={META[state]}
      action={isLoaded && reloadButton}
      className={className}
    >
      <AnimatedSize>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div key={state} {...fadePresence()}>
              {state === 'failed' && <FailedNotice onRetry={load} />}
              {state === 'loading' && <ActivitySkeleton />}
              {isLoaded && <ActivityList />}
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </DashboardCard>
  );
}
