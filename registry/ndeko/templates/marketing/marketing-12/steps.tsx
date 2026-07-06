'use client';

import { useId, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  HOW_ANCHOR,
  STEPS,
  STEPS_SECTION,
  type Step,
  type StepId,
} from './data';
import { Reveal } from './reveal';
import { StepVisual } from './step-visuals';

const STEP_MS = 2800;

const FIRST_STEP_ID = STEPS[0].id;

function fillOf(isActive: boolean, isAutoplaying: boolean) {
  const isFilling = isActive && isAutoplaying;
  if (isFilling) {
    return 'scale-x-100 opacity-100 duration-[2800ms]';
  }
  return 'scale-x-0 opacity-0 duration-0';
}

function surfaceOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.04]';
  }
  return 'bg-transparent';
}

type StepRowProps = {
  step: Step;
  position: number;
  isActive: boolean;
  isAutoplaying: boolean;
  onPick: (id: StepId) => void;
};

function StepRow({
  step,
  position,
  isActive,
  isAutoplaying,
  onPick,
}: StepRowProps) {
  const panelId = useId();
  const StepIcon = step.icon;

  function pick() {
    onPick(step.id);
  }

  return (
    <li
      className={cn(
        'relative overflow-hidden rounded-2xl transition-colors duration-200',
        surfaceOf(isActive)
      )}
    >
      <button
        type='button'
        aria-expanded={isActive}
        aria-controls={panelId}
        onClick={pick}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex w-full items-center gap-4 rounded-2xl p-4 text-start transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
      >
        <span className='keycap-3d text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'>
          <StepIcon className='size-4' />
        </span>
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='text-muted-foreground text-xs tabular-nums'>
            Step {position}
          </span>
          <span className='text-base font-medium text-balance'>
            {step.title}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            isActive && 'rotate-180'
          )}
        />
      </button>
      <Fold open={isActive} id={panelId}>
        <div className='grid gap-4 px-4 pb-5 @2xl:grid-cols-[minmax(0,1fr)_16rem] @2xl:items-center @2xl:gap-8 @2xl:ps-[4.75rem]'>
          <p className='text-muted-foreground text-[13px] text-pretty'>
            {step.description}
          </p>
          <StepVisual id={step.id} />
        </div>
      </Fold>
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary absolute inset-x-4 bottom-0 h-0.5 origin-left rounded-full transition-transform ease-linear',
          fillOf(isActive, isAutoplaying)
        )}
      />
    </li>
  );
}

export function Steps() {
  const [activeId, setActiveId] = useState<StepId>(FIRST_STEP_ID);
  const tourSteps = STEPS.slice(1).map((step) => ({
    after: STEP_MS,
    run: () => setActiveId(step.id),
  }));
  const { ref, isAutoplaying } = useAutoplay<HTMLOListElement>(tourSteps, {
    loopAfter: STEP_MS,
    onReset: () => setActiveId(FIRST_STEP_ID),
  });
  useKeptHeight(ref);

  return (
    <section
      id={HOW_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-4xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {STEPS_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {STEPS_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem>
          <ol ref={ref} className='flex flex-col gap-2'>
            {STEPS.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                position={index + 1}
                isActive={step.id === activeId}
                isAutoplaying={isAutoplaying}
                onPick={setActiveId}
              />
            ))}
          </ol>
        </SettleItem>
      </Reveal>
    </section>
  );
}
