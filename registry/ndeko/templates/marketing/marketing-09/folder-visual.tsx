'use client';

import { AnimatePresence } from 'motion/react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { FOLDER } from './data';
import { useSteps } from './use-steps';
import { type VisualProps } from './visual-props';

const STEPS = 1 + FOLDER.items.length;

function paperPlaceOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-0';
  }
  return 'translate-y-[20%]';
}

function flapPlaceOf(isOpen: boolean) {
  if (isOpen) {
    return 'translate-y-[115%] opacity-0';
  }
  return 'translate-y-0 opacity-100';
}

function labelToneOf(isTicked: boolean) {
  if (isTicked) {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

type CheckItemProps = {
  label: string;
  isTicked: boolean;
  isWorking: boolean;
};

function CheckItem({ label, isTicked, isWorking }: CheckItemProps) {
  return (
    <li className='flex items-center gap-3 py-2'>
      <span className='relative flex size-5 shrink-0 items-center justify-center'>
        <span
          aria-hidden='true'
          className='hairline-ring ring-foreground/25 absolute size-[18px] rounded-full'
        />
        <AnimatePresence initial={false}>
          {isTicked && (
            <DrawnCheck key='tick' tone='success' className='absolute' />
          )}
        </AnimatePresence>
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 text-[13px] transition-colors duration-200',
          labelToneOf(isTicked)
        )}
      >
        {label}
      </span>
      {isWorking && (
        <span
          aria-hidden='true'
          className='bg-primary size-1.5 shrink-0 animate-pulse rounded-full'
        />
      )}
    </li>
  );
}

export function FolderVisual({ progress }: VisualProps) {
  const step = useSteps(progress, STEPS, 0.9);
  const isOpen = step >= 1;
  const ticked = Math.max(0, step - 1);

  return (
    <div className='relative mx-auto aspect-[5/4] w-full max-w-sm'>
      <div
        aria-hidden='true'
        className='bg-foreground/[0.08] absolute inset-x-0 top-7 bottom-0 rounded-2xl'
      />
      <div
        aria-hidden='true'
        className='bg-foreground/[0.08] text-muted-foreground absolute start-0 top-0 flex h-9 w-32 items-center rounded-t-xl px-3 text-xs'
      >
        {FOLDER.name}
      </div>
      <div
        className={cn(
          'bg-card hairline-ring ring-border absolute inset-x-3 top-11 bottom-3 flex flex-col gap-1 rounded-xl p-4 transition-transform duration-700 ease-(--ease-out-strong) motion-reduce:transition-none',
          paperPlaceOf(isOpen)
        )}
      >
        <div className='flex items-center justify-between gap-3'>
          <p className='text-sm font-medium'>Follow-through</p>
          <Chip color='var(--success)'>{FOLDER.status}</Chip>
        </div>
        <ul>
          {FOLDER.items.map((label, index) => (
            <CheckItem
              key={label}
              label={label}
              isTicked={index < ticked}
              isWorking={isOpen && index === ticked}
            />
          ))}
        </ul>
      </div>
      <div
        aria-hidden='true'
        className={cn(
          'bg-card hairline-ring ring-border absolute inset-x-0 bottom-0 z-10 h-[62%] rounded-2xl shadow-[0_-1px_2px_rgb(0_0_0/0.04)] transition-[transform,opacity] duration-700 ease-(--ease-out-strong) motion-reduce:transition-none',
          flapPlaceOf(isOpen)
        )}
      />
    </div>
  );
}
