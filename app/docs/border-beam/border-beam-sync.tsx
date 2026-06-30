'use client';

import { useState } from 'react';

import { BorderBeam } from '@/components/core/border-beam';
import { RefreshCwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

function statusOf(isSyncing: boolean) {
  if (isSyncing) {
    return 'Syncing 1,204 files from the shared drive';
  }
  return 'Sync paused, 316 files left';
}

function actionOf(isSyncing: boolean) {
  if (isSyncing) {
    return 'Pause sync';
  }
  return 'Resume sync';
}

export function BorderBeamSync() {
  const [isSyncing, setIsSyncing] = useState(true);
  const status = statusOf(isSyncing);
  const action = actionOf(isSyncing);

  function toggleSync() {
    setIsSyncing((syncing) => !syncing);
  }

  return (
    <div className='bg-card hairline-ring ring-border relative flex w-full max-w-sm items-center gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <RefreshCwIcon className='size-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium'>Design library</p>
        <p
          aria-live='polite'
          className='text-muted-foreground truncate text-xs'
        >
          {status}
        </p>
      </div>
      <Button variant='outline' size='sm' onClick={toggleSync}>
        {action}
      </Button>
      <BorderBeam active={isSyncing} duration={5} />
    </div>
  );
}
