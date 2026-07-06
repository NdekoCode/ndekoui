'use client';

import { memo } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { samplePressKeyOf, type Sample, type SampleId } from './samples';

type SampleCardProps = {
  sample: Sample;
  /** The sample the card offers to run next. */
  other: Sample;
  isRunning: boolean;
  pressed: string | null;
  onRun: (id: SampleId) => void;
  onClear: () => void;
};

/** The email a test run sends through the flow, pinned over the top of the canvas while its marks show. */
export const SampleCard = memo(function SampleCard({
  sample,
  other,
  isRunning,
  pressed,
  onRun,
  onClear,
}: SampleCardProps) {
  const isOtherPressed = pressed === samplePressKeyOf(other.id);

  return (
    <section
      data-solid
      data-canvas-overlay='card'
      aria-label='Sample email of the test run'
      className='surface-raised pointer-events-auto flex w-full max-w-[19rem] flex-col gap-2 rounded-xl p-3'
    >
      <div className='flex items-center gap-2'>
        <Avatar seed={sample.from} className='size-6' />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <span className='truncate text-[13px] font-medium'>
            {sample.from}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {sample.subject}
          </span>
        </div>
        <Badge variant='secondary'>Sample</Badge>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Clear the marks of the run'
          disabled={isRunning}
          onClick={onClear}
          className='text-muted-foreground -me-1 size-6'
        >
          <XIcon className='size-3.5' />
        </Button>
      </div>
      <p
        key={sample.id}
        className='text-[13px] leading-relaxed transition-opacity duration-300 starting:opacity-0'
      >
        {sample.body}
      </p>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isRunning}
        onClick={() => onRun(other.id)}
        className={cn('self-start', pressedQuietOf(isOtherPressed))}
      >
        {other.runLabel}
      </Button>
    </section>
  );
});
