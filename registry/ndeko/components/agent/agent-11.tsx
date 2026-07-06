'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import type { RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, CircleIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AgentTile } from './_parts/agent-tile';
import { RESEARCHER } from './_parts/crew';
import { useOpenState } from './_parts/use-open-state';

export type ChecklistStepStatus = 'pending' | 'running' | 'done';

export type ChecklistStep = {
  id: string;
  title: string;
  status: ChecklistStepStatus;
  /** How far the running step is, from 0 to 100. */
  progress?: number;
  detail?: string;
};

const STATUS_WORD: Record<ChecklistStepStatus, string> = {
  pending: 'Not started',
  running: 'Running',
  done: 'Done',
};

const HEADER_RING_SIZE = 28;

const HEADER_RING_STROKE = 3;

const STEP_RING_SIZE = 18;

const STEP_RING_STROKE = 2.5;

function circumferenceOf(size: number, stroke: number) {
  const radius = (size - stroke) / 2;
  return 2 * Math.PI * radius;
}

function isDone(step: ChecklistStep) {
  return step.status === 'done';
}

function progressOf(step: ChecklistStep) {
  return step.progress ?? 0;
}

function wholeShareOf(steps: ChecklistStep[]) {
  if (steps.length === 0) {
    return 0;
  }
  let total = 0;
  for (const step of steps) {
    if (isDone(step)) {
      total += 100;
    }
    if (step.status === 'running') {
      total += progressOf(step);
    }
  }
  return total / (steps.length * 100);
}

function titleToneOf(status: ChecklistStepStatus) {
  if (status === 'done') {
    return 'text-muted-foreground';
  }
  if (status === 'running') {
    return 'text-foreground';
  }
  return 'text-foreground/70';
}

function strikeOf(status: ChecklistStepStatus) {
  if (status === 'done') {
    return 'scale-x-100';
  }
  return 'scale-x-0';
}

function ringFillOf(isComplete: boolean) {
  if (isComplete) {
    return 'stroke-success';
  }
  return 'stroke-primary';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type RingProps = {
  size: number;
  stroke: number;
  share: number;
  fillClassName: string;
};

function Ring({ size, stroke, share, fillClassName }: RingProps) {
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = circumferenceOf(size, stroke);
  const bounded = Math.min(1, Math.max(0, share));
  const dashOffset = circumference * (1 - bounded);

  return (
    <svg
      aria-hidden='true'
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className='-rotate-90'
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        strokeWidth={stroke}
        className='stroke-foreground/10'
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        strokeWidth={stroke}
        strokeLinecap='round'
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={cn(
          'transition-[stroke-dashoffset,stroke] duration-500 ease-(--ease-out-strong) motion-reduce:transition-none',
          fillClassName
        )}
      />
    </svg>
  );
}

function StepGlyph({ step }: { step: ChecklistStep }) {
  if (step.status === 'pending') {
    return <CircleIcon className='text-muted-foreground/60 size-4' />;
  }
  if (step.status === 'running') {
    return (
      <Ring
        size={STEP_RING_SIZE}
        stroke={STEP_RING_STROKE}
        share={progressOf(step) / 100}
        fillClassName='stroke-primary'
      />
    );
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function StepMark({ step }: { step: ChecklistStep }) {
  return (
    <span className='inline-flex size-5 shrink-0 items-center justify-center'>
      <Swap swapKey={step.status} className='size-5 justify-center'>
        <StepGlyph step={step} />
      </Swap>
      <span className='sr-only'>{STATUS_WORD[step.status]}</span>
    </span>
  );
}

function StepRow({ step }: { step: ChecklistStep }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isRunning = step.status === 'running';
  const hasDetail = step.detail !== undefined;
  const showsDetail = isRunning && hasDetail;
  const percent = Math.round(progressOf(step));

  return (
    <li data-status={step.status} className='flex items-start gap-3 py-1.5'>
      <StepMark step={step} />
      <span className='min-w-0 flex-1'>
        <span className='relative inline-block max-w-full align-top'>
          <span
            className={cn(
              'block truncate text-[13px] leading-5 transition-colors duration-300 ease-(--ease-out-strong)',
              titleToneOf(step.status)
            )}
          >
            {step.title}
          </span>
          <span
            aria-hidden='true'
            className={cn(
              'bg-muted-foreground/70 absolute inset-x-0 top-2.5 h-px origin-left transition-[scale] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
              strikeOf(step.status)
            )}
          />
        </span>
        <AnimatePresence initial={false}>
          {showsDetail && (
            <motion.span
              key='detail'
              className='text-muted-foreground block overflow-hidden text-xs leading-5'
              {...rowPresence}
            >
              {step.detail}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <AnimatePresence initial={false}>
        {isRunning && (
          <motion.span
            key='percent'
            className='text-muted-foreground inline-flex shrink-0 text-xs leading-5'
            {...rowPresence}
          >
            <MotionNumber value={percent} suffix='%' />
          </motion.span>
        )}
      </AnimatePresence>
    </li>
  );
}

export type TaskChecklistProps = {
  title: string;
  agent: Pick<RunAgent, 'name' | 'series'>;
  steps: ChecklistStep[];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Shows the header held down, for a demonstration that presses it. */
  isTogglePressed?: boolean;
  className?: string;
};

export function TaskChecklist({
  title,
  agent,
  steps,
  isOpen,
  onOpenChange,
  isTogglePressed = false,
  className,
}: TaskChecklistProps) {
  const listId = useId();
  const openState = useOpenState({ isOpen, defaultOpen: true, onOpenChange });
  const doneCount = steps.filter(isDone).length;
  const share = wholeShareOf(steps);
  const isComplete = steps.length > 0 && doneCount === steps.length;
  const ringFill = ringFillOf(isComplete);

  return (
    <section
      aria-label={`${agent.name}'s checklist: ${title}`}
      className={cn(
        'bg-card hairline-ring ring-border rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <button
        type='button'
        aria-expanded={openState.isOpen}
        aria-controls={listId}
        onClick={openState.toggle}
        className={cn(
          'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start transition-[background-color,scale] outline-none focus-visible:ring-[3px]',
          pressedQuietOf(isTogglePressed)
        )}
      >
        <AgentTile name={agent.name} series={agent.series} size='lg' />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-sm font-medium'>{title}</span>
          <span className='text-muted-foreground text-xs'>
            <MotionNumber value={doneCount} /> of{' '}
            <MotionNumber value={steps.length} /> done
          </span>
        </span>
        <Ring
          size={HEADER_RING_SIZE}
          stroke={HEADER_RING_STROKE}
          share={share}
          fillClassName={ringFill}
        />
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(openState.isOpen)
          )}
        />
      </button>
      <Fold open={openState.isOpen} id={listId}>
        <ol aria-label='Steps' className='flex flex-col px-2 pt-1 pb-2'>
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      </Fold>
    </section>
  );
}

type StepSpec = {
  id: string;
  title: string;
  detail: string;
};

const SPECS: StepSpec[] = [
  {
    id: 'collect',
    title: 'Collect the Q3 invoices',
    detail: 'Reading 117 invoice lines',
  },
  {
    id: 'match',
    title: 'Match each line to the price list',
    detail: 'Comparing 42 products',
  },
  {
    id: 'flag',
    title: 'Flag the lines above the list price',
    detail: 'Checking 9 suspect lines',
  },
  {
    id: 'draft',
    title: 'Draft the credit request',
    detail: 'Writing to Brightmoor accounts',
  },
  {
    id: 'send',
    title: 'Send the summary to finance',
    detail: 'Preparing one email',
  },
];

const TITLE = 'Prepare the Q3 vendor review';

type ChecklistState = {
  steps: ChecklistStep[];
  isOpen: boolean;
};

type ChecklistAction =
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; percent: number }
  | { type: 'finish'; id: string }
  | { type: 'open'; isOpen: boolean }
  | { type: 'hold' };

type ChecklistScriptStep = SessionStep<ChecklistState, ChecklistAction>;

function pendingStep(spec: StepSpec): ChecklistStep {
  return { id: spec.id, title: spec.title, status: 'pending' };
}

const INITIAL: ChecklistState = {
  steps: SPECS.map(pendingStep),
  isOpen: true,
};

function withStep(
  state: ChecklistState,
  id: string,
  change: (step: ChecklistStep) => ChecklistStep
): ChecklistState {
  const steps = state.steps.map((step) => {
    if (step.id === id) {
      return change(step);
    }
    return step;
  });
  return { ...state, steps };
}

function detailOf(id: string) {
  const spec = SPECS.find((candidate) => candidate.id === id);
  return spec?.detail;
}

function reducer(
  state: ChecklistState,
  action: ChecklistAction
): ChecklistState {
  switch (action.type) {
    case 'start':
      return withStep(state, action.id, (step) => ({
        ...step,
        status: 'running',
        progress: 0,
        detail: detailOf(step.id),
      }));
    case 'progress':
      return withStep(state, action.id, (step) => ({
        ...step,
        progress: action.percent,
      }));
    case 'finish':
      return withStep(state, action.id, (step) => ({
        ...step,
        status: 'done',
        progress: 100,
        detail: undefined,
      }));
    case 'open':
      return { ...state, isOpen: action.isOpen };
    case 'hold':
      return state;
  }
}

const PROGRESS_STOPS = [22, 58, 86];

function scriptOfStep(id: string): ChecklistScriptStep[] {
  const steps: ChecklistScriptStep[] = [
    { after: 500, action: { type: 'start', id } },
  ];
  for (const percent of PROGRESS_STOPS) {
    steps.push({ after: 500, action: { type: 'progress', id, percent } });
  }
  steps.push({ after: 450, action: { type: 'finish', id } });
  return steps;
}

function scriptOfAllSteps() {
  const steps: ChecklistScriptStep[] = [];
  for (const spec of SPECS) {
    steps.push(...scriptOfStep(spec.id));
  }
  return steps;
}

const SCRIPT: ChecklistScriptStep[] = [
  ...scriptOfAllSteps(),
  {
    after: 1400,
    by: 'demo',
    press: 'toggle',
    action: { type: 'open', isOpen: false },
  },
  { after: 2600, action: { type: 'hold' } },
];

function restingStepOf(spec: StepSpec, index: number): ChecklistStep {
  if (index < 3) {
    return { ...pendingStep(spec), status: 'done', progress: 100 };
  }
  if (index === 3) {
    return {
      ...pendingStep(spec),
      status: 'running',
      progress: 58,
      detail: spec.detail,
    };
  }
  return pendingStep(spec);
}

const RESTING: ChecklistState = {
  steps: SPECS.map(restingStepOf),
  isOpen: true,
};

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(steps: ChecklistStep[]) {
  const running = steps.find((step) => step.status === 'running');
  const doneCount = steps.filter(isDone).length;
  if (running) {
    const position = steps.indexOf(running) + 1;
    return `Step ${position} of ${steps.length}: ${running.title}`;
  }
  if (doneCount === steps.length) {
    return 'The checklist is done';
  }
  return '';
}

export default function Agent11() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const isOver = state.steps.every(isDone);
  const canReplay = isOver && isFinished && !isAutoplaying;
  const announcement = announcementOf(state.steps);

  function changeOpen(isOpen: boolean) {
    act({ type: 'open', isOpen });
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[22rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <TaskChecklist
          title={TITLE}
          agent={RESEARCHER}
          steps={state.steps}
          isOpen={state.isOpen}
          onOpenChange={changeOpen}
          isTogglePressed={pressed === 'toggle'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
