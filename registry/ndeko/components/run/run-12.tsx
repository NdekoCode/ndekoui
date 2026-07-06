'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { formatCost } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate, useLiveNow } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { useOpenState } from './_parts/use-open-state';

export type CostStepStatus = 'queued' | 'running' | 'done';

export type StepRate = {
  /** When the figures of the step were reported, in milliseconds. */
  since: number;
  tokensPerSecond: number;
  usdPerSecond: number;
};

export type CostStep = {
  id: string;
  title: string;
  /** The model family and tier, without a version: "Claude Sonnet". */
  model: string;
  brand: BrandSlug;
  status: CostStepStatus;
  inputTokens: number;
  /** The part of the input served from the cache. */
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
  /** A running step streams at this rate from the moment its figures were reported. */
  rate?: StepRate;
};

type Totals = {
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
};

const TOKEN_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const COST_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};

const PERCENT_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

const COUNT_FORMATTER = new Intl.NumberFormat('en-US', TOKEN_FORMAT);

const LIVE_TICK_MS = 125;

const MIN_BAR_SCALE_USD = 0.001;

function formatCount(count: number) {
  return COUNT_FORMATTER.format(Math.round(count));
}

function isDone(step: CostStep) {
  return step.status === 'done';
}

function isRunning(step: CostStep) {
  return step.status === 'running';
}

function runningStepOf(steps: CostStep[]) {
  return steps.find(isRunning);
}

function totalsOf(steps: CostStep[]): Totals {
  const totals: Totals = {
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
  for (const step of steps.filter(isDone)) {
    totals.inputTokens += step.inputTokens;
    totals.cachedTokens += step.cachedTokens;
    totals.outputTokens += step.outputTokens;
    totals.costUsd += step.costUsd;
  }
  return totals;
}

function cacheShareOf(totals: Totals) {
  if (totals.inputTokens === 0) {
    return 0;
  }
  const share = totals.cachedTokens / totals.inputTokens;
  return share * 100;
}

function secondsSince(now: number, since: number) {
  const elapsed = Math.max(0, now - since);
  return elapsed / 1000;
}

function liveOutputOf(step: CostStep, now: number) {
  if (!step.rate) {
    return step.outputTokens;
  }
  const seconds = secondsSince(now, step.rate.since);
  return step.outputTokens + step.rate.tokensPerSecond * seconds;
}

function liveCostOf(step: CostStep, now: number) {
  if (!step.rate) {
    return step.costUsd;
  }
  const seconds = secondsSince(now, step.rate.since);
  return step.costUsd + step.rate.usdPerSecond * seconds;
}

function barScaleOf(steps: CostStep[]) {
  let largest = MIN_BAR_SCALE_USD;
  for (const step of steps) {
    largest = Math.max(largest, step.costUsd);
  }
  return largest;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function stepPositionOf(steps: CostStep[], step: CostStep) {
  const index = steps.findIndex((candidate) => candidate.id === step.id);
  return index + 1;
}

function statusLineOf(steps: CostStep[]) {
  const running = runningStepOf(steps);
  if (running) {
    const position = stepPositionOf(steps, running);
    return `Step ${position} of ${steps.length}: ${running.title}`;
  }
  const doneCount = steps.filter(isDone).length;
  if (doneCount === steps.length) {
    return `Done, ${countOf(steps.length, 'step')}`;
  }
  if (doneCount === 0) {
    return 'Waiting for the first step';
  }
  return `Step ${doneCount} of ${steps.length} done`;
}

function LiveDelta({
  step,
  kind,
}: {
  step: CostStep;
  kind: 'input' | 'output' | 'cost';
}) {
  const now = useLiveNow(LIVE_TICK_MS, true);
  let text = formatCount(step.inputTokens);
  if (kind === 'output') {
    text = formatCount(liveOutputOf(step, now));
  }
  if (kind === 'cost') {
    text = formatCost(liveCostOf(step, now));
  }

  return <span className='text-primary-ink text-xs tabular-nums'>+{text}</span>;
}

function LiveAmount({
  step,
  kind,
}: {
  step: CostStep;
  kind: 'output' | 'cost';
}) {
  const now = useLiveNow(LIVE_TICK_MS, true);
  if (kind === 'output') {
    return <>{formatCount(liveOutputOf(step, now))}</>;
  }
  return <>{formatCost(liveCostOf(step, now))}</>;
}

function barStyleOf(share: number): React.CSSProperties {
  const bounded = Math.min(1, Math.max(0, share));
  return { transform: `scaleX(${bounded})` };
}

const BAR_FILL =
  'bg-primary h-full w-full origin-left rounded-full transition-transform duration-300 ease-(--ease-out-strong) motion-reduce:transition-none';

function LiveBar({ step, scaleUsd }: { step: CostStep; scaleUsd: number }) {
  const now = useLiveNow(LIVE_TICK_MS, true);
  const share = liveCostOf(step, now) / scaleUsd;

  return <span style={barStyleOf(share)} className={BAR_FILL} />;
}

function StepBar({ step, scaleUsd }: { step: CostStep; scaleUsd: number }) {
  if (isRunning(step)) {
    return <LiveBar step={step} scaleUsd={scaleUsd} />;
  }
  const share = step.costUsd / scaleUsd;

  return <span style={barStyleOf(share)} className={BAR_FILL} />;
}

function StepOutput({ step }: { step: CostStep }) {
  if (isRunning(step)) {
    return (
      <>
        <LiveAmount step={step} kind='output' /> out
      </>
    );
  }
  if (isDone(step)) {
    return <>{formatCount(step.outputTokens)} out</>;
  }
  return <>Waiting</>;
}

function StepCost({ step }: { step: CostStep }) {
  if (isRunning(step)) {
    return <LiveAmount step={step} kind='cost' />;
  }
  if (isDone(step)) {
    return <>{formatCost(step.costUsd)}</>;
  }
  return <span className='text-muted-foreground'>-</span>;
}

function StepRow({ step, scaleUsd }: { step: CostStep; scaleUsd: number }) {
  return (
    <li
      data-status={step.status}
      className='grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-1 py-2'
    >
      <CallStatusMark status={step.status} />
      <span className='min-w-0 truncate text-[13px]'>{step.title}</span>
      <span className='text-end text-[13px] tabular-nums'>
        <StepCost step={step} />
      </span>
      <span className='col-start-2 flex min-w-0 items-center gap-2'>
        <BrandTile brand={step.brand} size='sm' />
        <span className='text-muted-foreground min-w-0 truncate text-xs'>
          {step.model}
        </span>
        <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
          <StepOutput step={step} />
        </span>
      </span>
      <span
        aria-hidden='true'
        className='bg-foreground/10 col-start-3 h-1 w-14 overflow-hidden rounded-full @md:w-24'
      >
        <StepBar step={step} scaleUsd={scaleUsd} />
      </span>
    </li>
  );
}

type FigureTileProps = {
  label: string;
  children: React.ReactNode;
  live?: React.ReactNode;
};

function FigureTile({ label, children, live }: FigureTileProps) {
  const fade = fadePresence();

  return (
    <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2.5'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='flex flex-wrap items-baseline gap-x-1.5'>
        <span className='text-xl leading-7 font-semibold tabular-nums'>
          {children}
        </span>
        <AnimatePresence initial={false}>
          {live && (
            <motion.span key='live' className='inline-flex' {...fade}>
              {live}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

export type CostTrackerProps = {
  steps: CostStep[];
  isIllustrative?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Shows the per-step toggle held down, for a demonstration that presses it. */
  isTogglePressed?: boolean;
  className?: string;
};

export function CostTracker({
  steps,
  isIllustrative = false,
  isOpen,
  onOpenChange,
  isTogglePressed = false,
  className,
}: CostTrackerProps) {
  const tableId = useId();
  const openState = useOpenState({ isOpen, defaultOpen: false, onOpenChange });
  const totals = totalsOf(steps);
  const cacheShare = cacheShareOf(totals);
  const running = runningStepOf(steps);
  const isStreaming = running !== undefined;
  const statusLine = statusLineOf(steps);
  const scaleUsd = barScaleOf(steps);
  const rate = running?.rate;

  return (
    <section
      aria-label='Run cost'
      className={cn(
        'bg-card hairline-ring ring-border @container relative isolate flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <Wash shape='top' color='var(--info)' isShown={isStreaming} />
      <header className='flex flex-wrap items-start justify-between gap-x-3 gap-y-2'>
        <div className='flex min-w-0 flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-medium'>Run cost</h3>
            {isIllustrative && <Badge variant='outline'>Illustrative</Badge>}
          </div>
          <p className='text-muted-foreground flex min-w-0 items-center gap-2 text-xs'>
            <span className='min-w-0 truncate'>
              <WordRoll text={statusLine} />
            </span>
            {rate && (
              <span className='shrink-0 tabular-nums'>
                {formatCount(rate.tokensPerSecond)} tokens/s
              </span>
            )}
          </p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-expanded={openState.isOpen}
          aria-controls={tableId}
          onClick={openState.toggle}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(isTogglePressed)
          )}
        >
          Per step
          <ChevronDownIcon
            className={cn(
              'transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(openState.isOpen)
            )}
          />
        </Button>
      </header>
      <div className='grid grid-cols-2 gap-2 @xl:grid-cols-4'>
        <FigureTile
          label='Tokens in'
          live={running && <LiveDelta step={running} kind='input' />}
        >
          <MotionNumber value={totals.inputTokens} format={TOKEN_FORMAT} />
        </FigureTile>
        <FigureTile
          label='Tokens out'
          live={running && <LiveDelta step={running} kind='output' />}
        >
          <MotionNumber value={totals.outputTokens} format={TOKEN_FORMAT} />
        </FigureTile>
        <FigureTile label='From cache'>
          <MotionNumber value={cacheShare} format={PERCENT_FORMAT} suffix='%' />
        </FigureTile>
        <FigureTile
          label='Cost'
          live={running && <LiveDelta step={running} kind='cost' />}
        >
          <MotionNumber value={totals.costUsd} format={COST_FORMAT} />
        </FigureTile>
      </div>
      <Fold open={openState.isOpen} id={tableId}>
        <ol aria-label='Cost per step' className='flex flex-col'>
          {steps.map((step) => (
            <StepRow key={step.id} step={step} scaleUsd={scaleUsd} />
          ))}
        </ol>
      </Fold>
    </section>
  );
}

type StepSpec = {
  id: string;
  title: string;
  model: string;
  brand: BrandSlug;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
  /** What the figures show while the step streams: a little under what the final report says. */
  tokensPerSecond: number;
  usdPerSecond: number;
};

const SPECS: StepSpec[] = [
  {
    id: 'read',
    title: 'Read the request',
    model: 'Claude Haiku',
    brand: 'claude',
    inputTokens: 3180,
    cachedTokens: 2400,
    outputTokens: 224,
    costUsd: 0.003,
    tokensPerSecond: 145,
    usdPerSecond: 0.00194,
  },
  {
    id: 'search',
    title: 'Search the supplier sites',
    model: 'Gemini Flash',
    brand: 'gemini',
    inputTokens: 5940,
    cachedTokens: 0,
    outputTokens: 330,
    costUsd: 0.004,
    tokensPerSecond: 145,
    usdPerSecond: 0.00176,
  },
  {
    id: 'pages',
    title: 'Read the pricing pages',
    model: 'Claude Sonnet',
    brand: 'claude',
    inputTokens: 18420,
    cachedTokens: 12100,
    outputTokens: 212,
    costUsd: 0.046,
    tokensPerSecond: 79,
    usdPerSecond: 0.01716,
  },
  {
    id: 'draft',
    title: 'Draft the credit request',
    model: 'Claude Opus',
    brand: 'claude',
    inputTokens: 9760,
    cachedTokens: 7300,
    outputTokens: 138,
    costUsd: 0.171,
    tokensPerSecond: 48,
    usdPerSecond: 0.0592,
  },
  {
    id: 'review',
    title: 'Review the draft',
    model: 'Claude Sonnet',
    brand: 'claude',
    inputTokens: 11200,
    cachedTokens: 9950,
    outputTokens: 176,
    costUsd: 0.031,
    tokensPerSecond: 78,
    usdPerSecond: 0.01367,
  },
];

function queuedStep(spec: StepSpec): CostStep {
  return {
    id: spec.id,
    title: spec.title,
    model: spec.model,
    brand: spec.brand,
    status: 'queued',
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
}

function runningStep(spec: StepSpec, now: number): CostStep {
  const rate: StepRate = {
    since: now,
    tokensPerSecond: spec.tokensPerSecond,
    usdPerSecond: spec.usdPerSecond,
  };
  return {
    ...queuedStep(spec),
    status: 'running',
    inputTokens: spec.inputTokens,
    cachedTokens: spec.cachedTokens,
    rate,
  };
}

function doneStep(spec: StepSpec): CostStep {
  return {
    ...queuedStep(spec),
    status: 'done',
    inputTokens: spec.inputTokens,
    cachedTokens: spec.cachedTokens,
    outputTokens: spec.outputTokens,
    costUsd: spec.costUsd,
  };
}

type TrackerState = {
  steps: CostStep[];
  isOpen: boolean;
};

type TrackerAction =
  | { type: 'start'; id: string }
  | { type: 'finish'; id: string }
  | { type: 'open'; isOpen: boolean }
  | { type: 'hold' };

type TrackerStep = SessionStep<TrackerState, TrackerAction>;

const INITIAL: TrackerState = { steps: SPECS.map(queuedStep), isOpen: false };

function specOf(id: string) {
  return SPECS.find((spec) => spec.id === id);
}

function withStepReplaced(state: TrackerState, next: CostStep): TrackerState {
  const steps = state.steps.map((step) => {
    if (step.id === next.id) {
      return next;
    }
    return step;
  });
  return { ...state, steps };
}

function started(state: TrackerState, id: string, now: number) {
  const spec = specOf(id);
  const current = state.steps.find((step) => step.id === id);
  if (!spec || current?.status !== 'queued') {
    return state;
  }
  return withStepReplaced(state, runningStep(spec, now));
}

function finished(state: TrackerState, id: string) {
  const spec = specOf(id);
  const current = state.steps.find((step) => step.id === id);
  if (!spec || current?.status !== 'running') {
    return state;
  }
  return withStepReplaced(state, doneStep(spec));
}

function applyAt(
  state: TrackerState,
  action: TrackerAction,
  now: number
): TrackerState {
  switch (action.type) {
    case 'start':
      return started(state, action.id, now);
    case 'finish':
      return finished(state, action.id);
    case 'open':
      return { ...state, isOpen: action.isOpen };
    case 'hold':
      return state;
  }
}

/** The stream stamps a step when it starts, as a backend would report it. */
function reducer(state: TrackerState, action: TrackerAction) {
  return applyAt(state, action, Date.now());
}

function startStep(after: number, id: string): TrackerStep {
  return { after, action: { type: 'start', id } };
}

function finishStep(after: number, id: string): TrackerStep {
  return { after, action: { type: 'finish', id } };
}

const SCRIPT: TrackerStep[] = [
  startStep(900, 'read'),
  finishStep(1500, 'read'),
  {
    after: 400,
    by: 'demo',
    press: 'rows',
    action: { type: 'open', isOpen: true },
  },
  startStep(600, 'search'),
  finishStep(2200, 'search'),
  startStep(500, 'pages'),
  finishStep(2600, 'pages'),
  startStep(500, 'draft'),
  finishStep(2800, 'draft'),
  startStep(500, 'review'),
  finishStep(2200, 'review'),
  { after: 4500, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAt),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(steps: CostStep[]) {
  const running = runningStepOf(steps);
  if (running) {
    const position = stepPositionOf(steps, running);
    return `Step ${position} of ${steps.length} started: ${running.title}`;
  }
  const doneSteps = steps.filter(isDone);
  const last = doneSteps[doneSteps.length - 1];
  if (!last) {
    return '';
  }
  const total = formatCost(totalsOf(steps).costUsd);
  if (doneSteps.length === steps.length) {
    return `The run is done. Total cost ${total}`;
  }
  return `${last.title} is done. Total cost so far ${total}`;
}

export default function Run12() {
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
      className='flex min-h-[34rem] w-full max-w-[40rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <CostTracker
          steps={state.steps}
          isIllustrative
          isOpen={state.isOpen}
          onOpenChange={changeOpen}
          isTogglePressed={pressed === 'rows'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
