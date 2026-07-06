'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  LockIcon,
  RotateCcwIcon,
  ShuffleIcon,
  UnlockIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';
import { Switch } from '@/registry/ndeko/ui/switch';

import type { LightId } from './data';
import { callOf } from './seed-call';

function lockGlyphOf(isLocked: boolean) {
  if (isLocked) {
    return <LockIcon className='size-4' />;
  }
  return <UnlockIcon className='size-4' />;
}

function lockNoteOf(isLocked: boolean) {
  if (isLocked) {
    return 'Seed locked: the composition stays when the light changes';
  }
  return 'Seed unlocked: each change of light starts a new take';
}

type SeedCardProps = {
  light: LightId;
  seed: number;
  isLocked: boolean;
  isLockPressed: boolean;
  isReproducePressed: boolean;
  onLockChange: () => void;
  onShuffle: () => void;
  onReproduce: () => void;
};

export function SeedCard({
  light,
  seed,
  isLocked,
  isLockPressed,
  isReproducePressed,
  onLockChange,
  onShuffle,
  onReproduce,
}: SeedCardProps) {
  const call = callOf(light, seed);
  const labelId = useId();

  return (
    <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex items-center gap-3'>
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='text-muted-foreground text-xs'>Seed</p>
          <p className='font-mono text-3xl font-semibold tabular-nums'>
            <MotionNumber value={seed} format={{ useGrouping: false }} />
          </p>
        </div>
        <div className='ms-auto flex items-center gap-2 text-[13px] font-medium'>
          <Swap swapKey={String(isLocked)} className='text-muted-foreground'>
            {lockGlyphOf(isLocked)}
          </Swap>
          <span id={labelId}>Lock the seed</span>
          <Switch
            checked={isLocked}
            onCheckedChange={onLockChange}
            aria-labelledby={labelId}
            className={pressedQuietOf(isLockPressed)}
          />
        </div>
      </div>
      <p className='text-muted-foreground text-xs text-pretty'>
        {lockNoteOf(isLocked)}
      </p>
      <div className='bg-foreground/[0.04] relative rounded-lg p-3'>
        <pre className='overflow-x-auto pe-8 font-mono text-xs leading-relaxed'>
          <code>{call}</code>
        </pre>
        <div className='absolute top-1.5 right-1.5'>
          <CopyButton text={call} label='Copy the call' />
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={isLocked}
          onClick={onShuffle}
        >
          <ShuffleIcon />
          Shuffle seed
        </Button>
        <Button
          size='sm'
          onClick={onReproduce}
          className={pressedQuietOf(isReproducePressed)}
        >
          <RotateCcwIcon />
          Reproduce the take
        </Button>
      </div>
    </div>
  );
}
