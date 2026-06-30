'use client';

import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { EyeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const BASE_WATCHERS = 1099;

function watchersLabelOf(count: number) {
  const formatted = count.toLocaleString('en-US');
  if (count === 1) {
    return '1 person watching';
  }
  return `${formatted} people watching`;
}

export default function Button62() {
  const [isWatching, setIsWatching] = useState(false);
  const ownWatch = Number(isWatching);
  const watcherCount = BASE_WATCHERS + ownWatch;

  function toggleWatch() {
    setIsWatching((current) => !current);
  }

  return (
    <Button
      variant='outline'
      className='py-0 pe-0'
      aria-pressed={isWatching}
      onClick={toggleWatch}
    >
      <EyeIcon className='group-aria-pressed/button:text-primary-ink opacity-60 transition-[opacity,color] duration-150 group-aria-pressed/button:opacity-100' />
      Watch
      <span className='hairline-l border-foreground/12 text-muted-foreground dark:border-foreground/15 ms-1 inline-flex h-full items-center px-3 text-xs font-medium tabular-nums'>
        <span className='flex' aria-hidden='true'>
          <MotionNumber value={watcherCount} locale='en-US' />
        </span>
        <span className='sr-only'>{watchersLabelOf(watcherCount)}</span>
      </span>
    </Button>
  );
}
