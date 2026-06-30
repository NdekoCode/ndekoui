'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';

import { heightPresenceOf, RollingCount } from './_parts/motion-parts';
import { StrikeTitle } from './_parts/subtask-parts';

type Step = {
  id: string;
  title: string;
  isDone: boolean;
};

type Phase = {
  id: string;
  title: string;
  steps: Step[];
};

const PHASES: Phase[] = [
  {
    id: 'design',
    title: 'Design the export',
    steps: [
      { id: 'd1', title: 'Pick the columns finance needs', isDone: true },
      { id: 'd2', title: 'Agree on the file name pattern', isDone: true },
    ],
  },
  {
    id: 'build',
    title: 'Build the export',
    steps: [
      { id: 'b1', title: 'CSV writer with escaped fields', isDone: true },
      { id: 'b2', title: 'Totals row at the end', isDone: false },
      { id: 'b3', title: 'Dates in the account time zone', isDone: false },
    ],
  },
  {
    id: 'ship',
    title: 'Ship it',
    steps: [
      {
        id: 's1',
        title: 'Download button on the invoices page',
        isDone: false,
      },
      { id: 's2', title: 'Note in the changelog', isDone: false },
    ],
  },
];

function doneCountOf(steps: Step[]) {
  return steps.filter((step) => step.isDone).length;
}

function withStep(phase: Phase, stepId: string, isDone: boolean): Phase {
  const steps = phase.steps.map((step) => {
    if (step.id !== stepId) {
      return step;
    }
    return { ...step, isDone };
  });
  return { ...phase, steps };
}

function withAllSteps(phase: Phase, isDone: boolean): Phase {
  const steps = phase.steps.map((step) => ({ ...step, isDone }));
  return { ...phase, steps };
}

function StepRow({
  step,
  onChange,
}: {
  step: Step;
  onChange: (isDone: boolean) => void;
}) {
  return (
    <li>
      <label className='hover:bg-foreground/[0.03] flex h-8 cursor-pointer items-center gap-3 rounded-lg ps-9 pe-2'>
        <Checkbox checked={step.isDone} onCheckedChange={onChange} />
        <StrikeTitle title={step.title} isDone={step.isDone} />
      </label>
    </li>
  );
}

function PhaseBlock({
  phase,
  onChange,
}: {
  phase: Phase;
  onChange: (phase: Phase) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(true);
  const stepsId = useId();
  const doneCount = doneCountOf(phase.steps);
  const total = phase.steps.length;
  const isAllDone = doneCount === total;
  const isPartlyDone = doneCount > 0 && !isAllDone;

  return (
    <li>
      <div className='flex h-9 items-center gap-1 rounded-lg pe-2'>
        <button
          type='button'
          aria-expanded={isOpen}
          aria-controls={stepsId}
          aria-label={`Show the steps of ${phase.title}`}
          onClick={() => setIsOpen((current) => !current)}
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
        >
          <ChevronRightIcon
            className={cn(
              'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
              isOpen && 'rotate-90'
            )}
          />
        </button>
        <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-3 self-stretch'>
          <Checkbox
            checked={isAllDone}
            indeterminate={isPartlyDone}
            onCheckedChange={(isDone) => onChange(withAllSteps(phase, isDone))}
          />
          <StrikeTitle
            title={phase.title}
            isDone={isAllDone}
            className='font-medium'
          />
        </label>
        <span className='keycap-3d text-muted-foreground inline-flex h-5 shrink-0 items-center rounded-[5px] px-1.5 text-[11px] font-medium tabular-nums'>
          <RollingCount value={doneCount} />/{total}
        </span>
      </div>
      <div id={stepsId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.ul
              {...heightPresenceOf(shouldReduceMotion)}
              className='overflow-hidden'
            >
              {phase.steps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onChange={(isDone) =>
                    onChange(withStep(phase, step.id, isDone))
                  }
                />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function replaced(phases: Phase[], next: Phase) {
  return phases.map((phase) => {
    if (phase.id !== next.id) {
      return phase;
    }
    return next;
  });
}

export default function Subtask05() {
  const [phases, setPhases] = useState(PHASES);
  const allSteps = phases.flatMap((phase) => phase.steps);
  const doneCount = doneCountOf(allSteps);

  return (
    <section aria-label='Nested sub-tasks' className='w-full max-w-md'>
      <header className='flex items-baseline justify-between gap-3 px-2'>
        <h3 className='text-sm font-medium'>Sub-tasks</h3>
        <p className='text-muted-foreground text-xs'>
          <RollingCount value={doneCount} /> of {allSteps.length} steps done
        </p>
      </header>
      <ul className='mt-2 flex flex-col gap-1'>
        {phases.map((phase) => (
          <PhaseBlock
            key={phase.id}
            phase={phase}
            onChange={(next) => setPhases((current) => replaced(current, next))}
          />
        ))}
      </ul>
    </section>
  );
}
