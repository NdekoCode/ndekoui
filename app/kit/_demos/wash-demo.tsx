'use client';

import { useState } from 'react';

import { Switch } from '@/registry/ndeko/ui/switch';
import { Wash } from '@/registry/ndeko/ui/wash';

function runWordOf(isRunning: boolean) {
  if (isRunning) {
    return 'is running';
  }
  return 'is idle';
}

export function WashDemo() {
  const [isRunning, setIsRunning] = useState(true);
  const runWord = runWordOf(isRunning);

  return (
    <div className='flex w-full max-w-sm flex-col gap-3'>
      <div className='bg-card hairline-ring ring-border relative isolate rounded-xl p-4'>
        <Wash />
        <p className='text-sm font-medium'>Team plan</p>
        <p className='text-muted-foreground text-[13px]'>
          The one featured card of a pricing table
        </p>
        <p className='mt-6 text-2xl font-semibold tabular-nums'>29 EUR</p>
      </div>
      <div className='bg-card hairline-ring ring-border relative isolate flex h-10 items-center gap-2 rounded-lg px-3 text-[13px]'>
        <Wash shape='bar' color='var(--info)' isShown={isRunning} />
        <span className='min-w-0 flex-1 truncate'>Researcher {runWord}</span>
        <Switch
          checked={isRunning}
          onCheckedChange={setIsRunning}
          aria-label='Researcher is running'
        />
      </div>
    </div>
  );
}
