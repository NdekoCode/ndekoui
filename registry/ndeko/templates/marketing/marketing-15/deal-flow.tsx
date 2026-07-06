'use client';

import { useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { DEAL_FLOW } from './data';

type FlowState = {
  stage: number;
  round: number;
};

const LAST_STAGE = DEAL_FLOW.stages.length - 1;

const FIRST: FlowState = { stage: 0, round: 0 };

const STEP_MS = 1500;

function chipStyleOf(stage: number) {
  return { translate: `${stage * 100}% 0` };
}

function shownStageOf(stage: number, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return LAST_STAGE;
  }
  return stage;
}

function isWonAt(stage: number) {
  return stage === LAST_STAGE;
}

function slotToneOf(isHere: boolean) {
  if (isHere) {
    return 'bg-primary/10';
  }
  return 'bg-foreground/[0.04]';
}

export function DealFlow() {
  const [flow, setFlow] = useState<FlowState>(FIRST);
  const shouldReduceMotion = usePrefersReducedMotion();
  const shownStage = shownStageOf(flow.stage, shouldReduceMotion);
  const steps = [1, 2, 3].map((stage) => ({
    after: STEP_MS,
    run: () => setFlow((current) => ({ ...current, stage })),
  }));
  const { ref } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: () =>
      setFlow((current) => ({ stage: 0, round: current.round + 1 })),
  });

  return (
    <div ref={ref} className='flex flex-col gap-2'>
      <div className='grid grid-cols-4'>
        {DEAL_FLOW.stages.map((stage) => (
          <p
            key={stage}
            className='text-muted-foreground truncate text-center text-xs font-medium'
          >
            {stage}
          </p>
        ))}
      </div>
      <div className='relative'>
        <div className='grid grid-cols-4' aria-hidden='true'>
          {DEAL_FLOW.stages.map((stage, index) => (
            <span
              key={stage}
              className={cn(
                'm-0.5 h-20 rounded-lg transition-colors duration-300',
                slotToneOf(index === shownStage)
              )}
            />
          ))}
        </div>
        <div
          key={flow.round}
          style={chipStyleOf(shownStage)}
          className='absolute inset-y-0 left-0 w-1/4 p-0.5 transition-[translate] duration-500 ease-(--ease-out-strong) starting:opacity-0'
        >
          <div className='bg-card hairline-ring ring-border flex size-full flex-col justify-center gap-1 rounded-lg px-2 shadow-[0_1px_2px_rgb(0_0_0/0.08)]'>
            <div className='flex items-center gap-1.5'>
              <Avatar
                seed={DEAL_FLOW.deal}
                role='img'
                aria-label={DEAL_FLOW.deal}
                className='size-4'
              />
              <p className='truncate text-xs font-medium'>{DEAL_FLOW.deal}</p>
            </div>
            <div className='flex items-center justify-between gap-1'>
              <p className='text-muted-foreground truncate text-xs tabular-nums'>
                {DEAL_FLOW.value}
              </p>
              {isWonAt(shownStage) && (
                <DrawnCheck tone='success' label='Won' entrance='pop' />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
