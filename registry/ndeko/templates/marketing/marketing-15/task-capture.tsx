'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { TASK_CAPTURE } from './data';

type CaptureStage = 0 | 1 | 2 | 3;

const STEP_MS = 1200;

function stageOf(stage: CaptureStage, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 3;
  }
  return stage;
}

function phraseToneOf(isMarked: boolean) {
  if (isMarked) {
    return 'bg-primary/15 text-foreground';
  }
  return 'bg-transparent';
}

export function TaskCapture() {
  const [rawStage, setRawStage] = useState<CaptureStage>(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const stage = stageOf(rawStage, shouldReduceMotion);
  const steps = [
    { after: 1400, run: () => setRawStage(1) },
    { after: STEP_MS, run: () => setRawStage(2) },
    { after: STEP_MS, run: () => setRawStage(3) },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: () => setRawStage(0),
  });
  const isMarked = stage >= 1;
  const isTaskShown = stage >= 2;
  const isDone = stage >= 3;

  return (
    <div ref={ref} className='flex flex-col gap-3'>
      <p className='bg-card hairline-ring ring-border rounded-xl px-3 py-2.5 text-[13px]'>
        {TASK_CAPTURE.noteLead}{' '}
        <span
          className={cn(
            'rounded-sm px-0.5 transition-colors duration-300',
            phraseToneOf(isMarked)
          )}
        >
          {TASK_CAPTURE.notePhrase}
        </span>
      </p>
      <Fold open={isTaskShown}>
        <div className='bg-card hairline-ring ring-border flex items-center gap-3 rounded-xl px-3 py-2.5'>
          <span className='flex size-[18px] shrink-0 items-center justify-center'>
            {isDone && <DrawnCheck tone='success' label='Done' />}
            {!isDone && (
              <span className='border-foreground/25 size-4 rounded-full border' />
            )}
          </span>
          <p className='min-w-0 flex-1 truncate text-[13px] font-medium'>
            {TASK_CAPTURE.task}
          </p>
          <Badge variant='secondary'>{TASK_CAPTURE.due}</Badge>
        </div>
      </Fold>
    </div>
  );
}
