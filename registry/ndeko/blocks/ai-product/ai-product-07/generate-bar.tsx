'use client';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { RESULT_COUNT } from './data';
import type { Phase } from './session';

function fillOf(phase: Phase, progress: number) {
  if (phase !== 'generating') {
    return { transform: 'scaleX(0)' };
  }
  return { transform: `scaleX(${progress / 100})` };
}

function labelKeyOf(phase: Phase) {
  if (phase === 'generating') {
    return 'generating';
  }
  if (phase === 'done') {
    return 'again';
  }
  return 'generate';
}

type GenerateBarProps = {
  phase: Phase;
  progress: number;
  pressed: string | null;
  onGenerate: () => void;
  onStartOver: () => void;
};

export function GenerateBar({
  phase,
  progress,
  pressed,
  onGenerate,
  onStartOver,
}: GenerateBarProps) {
  const labelKey = labelKeyOf(phase);
  const isGenerating = phase === 'generating';
  const isDone = phase === 'done';

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        type='button'
        size='lg'
        disabled={isGenerating}
        focusableWhenDisabled
        onClick={onGenerate}
        className={cn(
          'relative w-full overflow-hidden disabled:opacity-100 @md:w-64',
          pressedSolidOf(pressed === 'generate')
        )}
      >
        <span
          aria-hidden='true'
          style={fillOf(phase, progress)}
          className='bg-primary-foreground/25 absolute inset-0 origin-left transition-transform duration-500 ease-linear'
        />
        <Swap swapKey={labelKey} className='relative'>
          {labelKey === 'generate' && `Generate ${RESULT_COUNT} options`}
          {labelKey === 'again' && 'Generate again'}
          {labelKey === 'generating' && (
            <span>
              Generating <span className='tabular-nums'>{progress}%</span>
            </span>
          )}
        </Swap>
      </Button>
      {isDone && (
        <Button
          type='button'
          variant='ghost'
          size='lg'
          onClick={onStartOver}
          className='text-muted-foreground'
        >
          Start over
        </Button>
      )}
    </div>
  );
}
