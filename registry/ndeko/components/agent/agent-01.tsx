'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  formatDuration,
  seriesColorOf,
  type ApprovalRequest,
  type PlanStep,
  type RunAgent,
  type RunSnapshot,
  type RunStatus,
  type StepStatus,
} from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  CircleCheckIcon,
  CircleIcon,
  CircleXIcon,
  ListCollapseIcon,
  LoaderIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';
import { ClockGate, LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Progress, ProgressLabel } from '@/registry/ndeko/ui/progress';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AgentTile } from './_parts/agent-tile';
import { PAGE_ERROR, PLANNER, RUN_TITLE } from './_parts/crew';
import { DECIDE_AFTER_MS } from './_parts/demo';
import { focusLater } from './_parts/focus-later';
import { KeyedHeight } from './_parts/keyed-height';
import { RelativeTime } from './_parts/relative-time';
import { countOf, nounOf } from './_parts/words';

export type PlanChange = {
  stepId: string;
  kind: 'added' | 'skipped';
};

type PlanPhase =
  'waiting' | 'editing' | 'running' | 'revised' | 'done' | 'failed' | 'stopped';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

const PHASE_LOOK: Record<PlanPhase, { label: string; variant: BadgeVariant }> =
  {
    waiting: { label: 'Needs your approval', variant: 'warning' },
    editing: { label: 'Editing', variant: 'secondary' },
    running: { label: 'Running', variant: 'info' },
    revised: { label: 'Revised', variant: 'info' },
    done: { label: 'Done', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    stopped: { label: 'Stopped', variant: 'secondary' },
  };

const STEP_STATUS_WORD: Record<StepStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
};

const CHANGE_WORD: Record<PlanChange['kind'], string> = {
  added: 'Added',
  skipped: 'Skipped',
};

const NO_CHANGES: PlanChange[] = [];

function isPendingApproval(approval: ApprovalRequest | undefined) {
  return approval?.status === 'pending';
}

function phaseOf(
  status: RunStatus,
  approval: ApprovalRequest | undefined,
  changes: PlanChange[],
  isEditing: boolean
): PlanPhase {
  if (isEditing) {
    return 'editing';
  }
  if (isPendingApproval(approval)) {
    return 'waiting';
  }
  if (status === 'done') {
    return 'done';
  }
  if (status === 'failed') {
    return 'failed';
  }
  if (status === 'cancelled') {
    return 'stopped';
  }
  if (changes.length > 0) {
    return 'revised';
  }
  return 'running';
}

function isCounted(step: PlanStep) {
  return step.status !== 'skipped';
}

function countedStepsOf(steps: PlanStep[]) {
  return steps.filter(isCounted);
}

function countWithStatus(steps: PlanStep[], status: StepStatus) {
  const matching = steps.filter((step) => step.status === status);
  return matching.length;
}

function shareOf(part: number, total: number) {
  if (total === 0) {
    return 0;
  }
  const ratio = part / total;
  return ratio * 100;
}

function firstFound(primary: number, fallback: number) {
  if (primary >= 0) {
    return primary;
  }
  return fallback;
}

type CurrentStep = {
  step: PlanStep;
  position: number;
  total: number;
};

/** The running step, or between two steps the next one, so the folded line never blinks empty. */
export function currentStepOf(steps: PlanStep[]): CurrentStep | null {
  const counted = countedStepsOf(steps);
  const runningIndex = counted.findIndex((step) => step.status === 'running');
  const upcomingIndex = counted.findIndex((step) => step.status === 'upcoming');
  const index = firstFound(runningIndex, upcomingIndex);
  if (index < 0) {
    return null;
  }
  return { step: counted[index], position: index + 1, total: counted.length };
}

function changeOf(changes: PlanChange[], stepId: string) {
  return changes.find((change) => change.stepId === stepId);
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function titleToneOf(status: StepStatus) {
  if (status === 'skipped') {
    return 'text-muted-foreground decoration-muted-foreground/70';
  }
  if (status === 'upcoming') {
    return 'text-foreground/70 decoration-transparent';
  }
  return 'text-foreground decoration-transparent';
}

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'upcoming') {
    return <CircleIcon className='text-muted-foreground/60 size-4' />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  if (status === 'done') {
    return <CircleCheckIcon className='text-success-foreground size-4' />;
  }
  if (status === 'failed') {
    return <CircleXIcon className='text-destructive-ink size-4' />;
  }
  return <MinusIcon className='text-muted-foreground size-4' />;
}

function StepMark({
  status,
  className,
}: {
  status: StepStatus;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex size-4 shrink-0', className)}>
      <Swap swapKey={status} className='size-4'>
        <StepGlyph status={status} />
      </Swap>
      <span className='sr-only'>{STEP_STATUS_WORD[status]}</span>
    </span>
  );
}

/** A duration that ticks keeps its width, so the title beside it never shifts. */
function StepTime({ step }: { step: PlanStep }) {
  const isRunning = step.status === 'running';
  const hasStarted = step.startedAt !== undefined;
  if (!hasStarted) {
    return null;
  }
  return (
    <LiveDuration
      item={step}
      isRunning={isRunning}
      className='text-muted-foreground min-w-8 shrink-0 text-end text-xs leading-5'
    />
  );
}

function SubstepList({ substeps }: { substeps: PlanStep[] }) {
  return (
    <ol className='flex flex-col gap-1 ps-9 pe-2 pt-0.5 pb-2'>
      {substeps.map((substep) => (
        <li key={substep.id} className='flex items-start gap-2.5 text-xs'>
          <StepMark status={substep.status} className='mt-0.5' />
          <span
            className={cn(
              'min-w-0 flex-1 leading-5',
              titleToneOf(substep.status)
            )}
          >
            {substep.title}
          </span>
          <StepTime step={substep} />
        </li>
      ))}
    </ol>
  );
}

type StepContentProps = {
  step: PlanStep;
  change: PlanChange | undefined;
  agent: Pick<RunAgent, 'name' | 'series'>;
  hasSubsteps: boolean;
  isOpen: boolean;
  /** The step the agent is on: the one that runs, or the next one in the breath between two steps. */
  isCurrent: boolean;
  highlightId: string;
};

function StepContent({
  step,
  change,
  agent,
  hasSubsteps,
  isOpen,
  isCurrent,
  highlightId,
}: StepContentProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);
  const isFailed = step.status === 'failed';
  const failure = step.detail ?? '';
  const hasFailure = failure !== '';
  const showsFailure = isFailed && hasFailure;
  const chipColor = seriesColorOf(agent.series);

  return (
    <>
      {isCurrent && (
        <motion.span
          layoutId={highlightId}
          layoutDependency={step.id}
          transition={spring}
          aria-hidden='true'
          className='bg-foreground/[0.04] dark:bg-foreground/[0.06] absolute inset-0 -z-10 rounded-lg'
        />
      )}
      <StepMark status={step.status} className='mt-0.5' />
      <span className='flex min-w-0 flex-1 flex-col gap-1'>
        <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <span
            className={cn(
              'text-[13px] leading-5 line-through transition-[color,text-decoration-color] duration-300 ease-(--ease-out-strong)',
              titleToneOf(step.status)
            )}
          >
            {step.title}
          </span>
          <AnimatePresence initial={false}>
            {change && (
              <motion.span
                key={change.kind}
                className='inline-flex'
                {...fadePresence()}
              >
                <Chip color={chipColor}>
                  {CHANGE_WORD[change.kind]} by {agent.name}
                </Chip>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <AnimatePresence initial={false}>
          {showsFailure && (
            <motion.span
              key='failure'
              className='text-destructive-ink block overflow-hidden text-xs leading-5'
              {...rowPresence}
            >
              {failure}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <StepTime step={step} />
      {hasSubsteps && (
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      )}
    </>
  );
}

const ROW =
  'relative isolate flex w-full items-start gap-3 rounded-lg px-2 py-2';

type StepRowProps = {
  step: PlanStep;
  change: PlanChange | undefined;
  agent: Pick<RunAgent, 'name' | 'series'>;
  isOpen: boolean;
  isCurrent: boolean;
  onToggle: (stepId: string, isOpen: boolean) => void;
  highlightId: string;
};

function StepRow({
  step,
  change,
  agent,
  isOpen,
  isCurrent,
  onToggle,
  highlightId,
}: StepRowProps) {
  const panelId = useId();
  const substeps = step.substeps ?? [];
  const hasSubsteps = substeps.length > 0;

  function toggle() {
    onToggle(step.id, !isOpen);
  }

  const content = (
    <StepContent
      step={step}
      change={change}
      agent={agent}
      hasSubsteps={hasSubsteps}
      isOpen={isOpen}
      isCurrent={isCurrent}
      highlightId={highlightId}
    />
  );

  return (
    <div data-status={step.status}>
      {hasSubsteps && (
        <button
          type='button'
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={toggle}
          className={cn(
            ROW,
            'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 cursor-pointer text-start outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
          )}
        >
          {content}
        </button>
      )}
      {!hasSubsteps && <div className={ROW}>{content}</div>}
      {hasSubsteps && (
        <Fold open={isOpen} id={panelId}>
          <SubstepList substeps={substeps} />
        </Fold>
      )}
    </div>
  );
}

type StepListProps = {
  steps: PlanStep[];
  changes: PlanChange[];
  agent: Pick<RunAgent, 'name' | 'series'>;
  currentId: string | null;
};

function StepList({ steps, changes, agent, currentId }: StepListProps) {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const highlightId = useId();

  function isOpenOf(step: PlanStep) {
    const isRunning = step.status === 'running';
    return toggled[step.id] ?? isRunning;
  }

  function setOpen(stepId: string, isOpen: boolean) {
    setToggled((current) => ({ ...current, [stepId]: isOpen }));
  }

  return (
    <ol aria-label='Steps' className='-mx-2 flex flex-col'>
      <AnimatePresence initial={false}>
        {steps.map((step) => (
          <motion.li key={step.id} className='overflow-hidden' {...rowPresence}>
            <StepRow
              step={step}
              change={changeOf(changes, step.id)}
              agent={agent}
              isOpen={isOpenOf(step)}
              isCurrent={step.id === currentId}
              onToggle={setOpen}
              highlightId={highlightId}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

type DraftStep = {
  id: string;
  title: string;
  substeps?: PlanStep[];
};

function draftOf(step: PlanStep): DraftStep {
  return { id: step.id, title: step.title, substeps: step.substeps };
}

function planStepOf(draft: DraftStep): PlanStep {
  const title = draft.title.trim();
  if (draft.substeps) {
    return {
      id: draft.id,
      title,
      status: 'upcoming',
      substeps: draft.substeps,
    };
  }
  return { id: draft.id, title, status: 'upcoming' };
}

function isBlank(draft: DraftStep) {
  return draft.title.trim() === '';
}

function describedByOf(isInvalid: boolean, errorId: string) {
  if (isInvalid) {
    return errorId;
  }
  return undefined;
}

function fieldLabelOf(draft: DraftStep, index: number) {
  if (isBlank(draft)) {
    return `step ${index + 1}`;
  }
  return draft.title;
}

/** A row moved to an end loses the button that moved it, so focus lands on the one still enabled. */
function landingButtonOf(target: number, count: number, offset: -1 | 1) {
  const isAtTop = target === 0;
  const isAtBottom = target === count - 1;
  if (isAtTop) {
    return 'down';
  }
  if (isAtBottom) {
    return 'up';
  }
  if (offset < 0) {
    return 'up';
  }
  return 'down';
}

type PlanEditorProps = {
  steps: PlanStep[];
  onCancel: () => void;
  onSave: (steps: PlanStep[]) => void;
};

function PlanEditor({ steps, onCancel, onSave }: PlanEditorProps) {
  const [draft, setDraft] = useState<DraftStep[]>(() => steps.map(draftOf));
  const [showsErrors, setShowsErrors] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const errorId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);
  const rowTransition = { ...rowPresence.transition, layout: spring };
  const draftIds = draft.map((step) => step.id);
  const orderKey = draftIds.join(' ');
  const blankStep = draft.find(isBlank);
  const showsBlankError = showsErrors && blankStep !== undefined;
  const isLastStep = draft.length === 1;

  function rename(stepId: string, title: string) {
    setDraft((current) =>
      current.map((step) => {
        if (step.id !== stepId) {
          return step;
        }
        return { ...step, title };
      })
    );
  }

  function move(stepId: string, offset: -1 | 1) {
    const index = draft.findIndex((step) => step.id === stepId);
    const target = index + offset;
    const isAboveStart = target < 0;
    const isPastEnd = target >= draft.length;
    if (isAboveStart || isPastEnd) {
      return;
    }
    const next = [...draft];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setDraft(next);
    const landing = landingButtonOf(target, next.length, offset);
    focusLater(rootRef, `[data-move="${stepId}-${landing}"]`);
  }

  function remove(stepId: string) {
    const index = draft.findIndex((step) => step.id === stepId);
    const next = draft.filter((step) => step.id !== stepId);
    setDraft(next);
    const neighbour = next[index] ?? next[index - 1];
    if (neighbour) {
      focusLater(rootRef, `[data-field="${neighbour.id}"]`);
      return;
    }
    focusLater(rootRef, '[data-add-step]');
  }

  function add() {
    const id = `added-${Date.now()}`;
    setDraft((current) => [...current, { id, title: '' }]);
    focusLater(rootRef, `[data-field="${id}"]`);
  }

  function save() {
    if (blankStep) {
      setShowsErrors(true);
      focusLater(rootRef, `[data-field="${blankStep.id}"]`);
      return;
    }
    const planSteps = draft.map(planStepOf);
    onSave(planSteps);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  function saveOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
  }

  return (
    <div ref={rootRef} onKeyDown={handleKeys} className='flex flex-col gap-3'>
      <ol aria-label='Steps to edit' className='-mx-1 flex flex-col'>
        <AnimatePresence initial={false}>
          {draft.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === draft.length - 1;
            const label = fieldLabelOf(step, index);
            const isInvalid = showsErrors && isBlank(step);
            const substepCount = step.substeps?.length ?? 0;
            const hasSubsteps = substepCount > 0;

            return (
              <motion.li
                key={step.id}
                layout='position'
                layoutDependency={orderKey}
                className='overflow-hidden'
                {...rowPresence}
                transition={rowTransition}
              >
                <div className='flex items-start gap-2 px-1 py-1'>
                  <span className='text-muted-foreground w-4 shrink-0 pt-2 text-end text-xs tabular-nums'>
                    {index + 1}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <Input
                      value={step.title}
                      onChange={(event) => rename(step.id, event.target.value)}
                      onKeyDown={saveOnEnter}
                      aria-label={`Step ${index + 1}`}
                      aria-invalid={isInvalid}
                      aria-describedby={describedByOf(isInvalid, errorId)}
                      placeholder='Name the step'
                      data-field={step.id}
                      autoFocus={isFirst}
                    />
                    {hasSubsteps && (
                      <p className='text-muted-foreground mt-1 ps-0.5 text-xs'>
                        Keeps its {countOf(substepCount, 'sub-step')}
                      </p>
                    )}
                  </div>
                  <div className='flex shrink-0 items-center pt-0.5'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      disabled={isFirst}
                      onClick={() => move(step.id, -1)}
                      aria-label={`Move ${label} up`}
                      data-move={`${step.id}-up`}
                      className='text-muted-foreground'
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      disabled={isLast}
                      onClick={() => move(step.id, 1)}
                      aria-label={`Move ${label} down`}
                      data-move={`${step.id}-down`}
                      className='text-muted-foreground'
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      disabled={isLastStep}
                      onClick={() => remove(step.id)}
                      aria-label={`Remove ${label}`}
                      className='text-muted-foreground'
                    >
                      <XIcon />
                    </Button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
      <button
        type='button'
        onClick={add}
        data-add-step
        className='hairline-border border-foreground/20 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border-dashed px-3 text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
      >
        <PlusIcon className='size-4' />
        Add a step
      </button>
      <AnimatePresence initial={false}>
        {showsBlankError && (
          <motion.p
            key='blank'
            id={errorId}
            className='text-destructive-ink overflow-hidden text-xs'
            {...rowPresence}
          >
            Name every step, or remove the empty one
          </motion.p>
        )}
      </AnimatePresence>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
          Cancel
        </Button>
        <Button type='button' size='sm' onClick={save}>
          <CheckIcon />
          Save plan
        </Button>
      </div>
    </div>
  );
}

function PlanProgress({
  steps,
  startedAt,
  endedAt,
  isLive,
}: {
  steps: PlanStep[];
  startedAt?: number;
  endedAt?: number;
  isLive: boolean;
}) {
  const counted = countedStepsOf(steps);
  const total = counted.length;
  const doneCount = countWithStatus(counted, 'done');
  const failedCount = countWithStatus(counted, 'failed');
  const settledCount = doneCount + failedCount;
  const value = shareOf(settledCount, total);
  const hasFailed = failedCount > 0;
  const hasStarted = startedAt !== undefined;

  return (
    <Progress value={value}>
      <div className='flex items-baseline justify-between gap-3'>
        <ProgressLabel className='text-muted-foreground text-xs font-normal'>
          <MotionNumber value={doneCount} /> of <MotionNumber value={total} />{' '}
          {nounOf(total, 'step')}
          {hasFailed && (
            <span className='text-destructive-ink'>, {failedCount} failed</span>
          )}
        </ProgressLabel>
        {hasStarted && (
          <LiveDuration
            item={{ startedAt, endedAt }}
            isRunning={isLive}
            className='text-muted-foreground min-w-8 text-end text-xs'
          />
        )}
      </div>
    </Progress>
  );
}

function FoldedLine({
  phase,
  steps,
  startedAt,
  endedAt,
}: {
  phase: PlanPhase;
  steps: PlanStep[];
  startedAt?: number;
  endedAt?: number;
}) {
  const counted = countedStepsOf(steps);
  const stepCount = countOf(counted.length, 'step');
  const current = currentStepOf(steps);
  const label = PHASE_LOOK[phase].label;

  if (phase === 'waiting') {
    return <>Plan of {stepCount} waits for your approval</>;
  }
  if (phase === 'done') {
    const end = endedAt ?? 0;
    const start = startedAt ?? 0;
    const elapsed = end - start;
    return (
      <>
        Done: {stepCount} in {formatDuration(elapsed)}
      </>
    );
  }
  if (!current) {
    return <>{label}</>;
  }
  const isRunning = current.step.status === 'running';
  return (
    <>
      <span className='font-medium'>
        Step {current.position} of {current.total}:
      </span>{' '}
      {current.step.title}
      {isRunning && (
        <>
          ,{' '}
          <LiveDuration
            item={current.step}
            isRunning
            className='text-muted-foreground'
          />
        </>
      )}
    </>
  );
}

function foldedKeyOf(phase: PlanPhase, steps: PlanStep[]) {
  const current = currentStepOf(steps);
  const stepKey = current?.step.id ?? 'none';
  return `${phase}-${stepKey}`;
}

function toggleLabelOf(isFolded: boolean) {
  if (isFolded) {
    return 'Unfold the plan';
  }
  return 'Fold the plan into one line';
}

function isLiveStatus(status: RunStatus) {
  const isRunning = status === 'running';
  const isWaiting = status === 'waiting';
  return isRunning || isWaiting;
}

/**
 * The row the agent is on. While the run is live it is the step that runs or, between two steps, the
 * next one: the mark of the step that just ended and the highlight of the one that starts then move
 * in the same instant.
 */
function currentIdOf(steps: PlanStep[], isLive: boolean) {
  if (isLive) {
    const current = currentStepOf(steps);
    return current?.step.id ?? null;
  }
  const running = steps.find((step) => step.status === 'running');
  return running?.id ?? null;
}

export type AgentPlanProps = {
  goal: string;
  agent: Pick<RunAgent, 'name' | 'series'>;
  steps: PlanStep[];
  status: RunStatus;
  /** The person's go-ahead for the plan: while pending, the plan waits with Approve plan and Edit plan. */
  approval?: ApprovalRequest;
  /** Steps the agent added or skipped while it worked. */
  changes?: PlanChange[];
  startedAt?: number;
  endedAt?: number;
  onApprove?: () => void;
  onSave?: (steps: PlanStep[]) => void;
  /** Shows Approve plan held down, for a demonstration that presses it. */
  isApprovePressed?: boolean;
  defaultFolded?: boolean;
  className?: string;
};

export function AgentPlan({
  goal,
  agent,
  steps,
  status,
  approval,
  changes = NO_CHANGES,
  startedAt,
  endedAt,
  onApprove,
  onSave,
  isApprovePressed = false,
  defaultFolded = false,
  className,
}: AgentPlanProps) {
  const [isFolded, setIsFolded] = useState(defaultFolded);
  const [isEditing, setIsEditing] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const bodyId = useId();
  const fade = fadePresence();
  const phase = phaseOf(status, approval, changes, isEditing);
  const look = PHASE_LOOK[phase];
  const isWaiting = phase === 'waiting';
  const wasApproved = approval?.status === 'approved';
  const resolvedAt = approval?.resolvedAt ?? 0;
  const showsTrace = wasApproved && !isEditing;
  const isLive = isLiveStatus(status);
  const currentId = currentIdOf(steps, isLive);
  const foldedKey = foldedKeyOf(phase, steps);
  const toggleLabel = toggleLabelOf(isFolded);
  const shapeKey = `${isFolded}-${isEditing}`;

  function toggleFolded() {
    setIsFolded((current) => !current);
  }

  function approve() {
    onApprove?.();
    focusLater(rootRef, '[data-plan-toggle]');
  }

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    focusLater(rootRef, '[data-plan-action="edit"]');
  }

  function saveEditing(nextSteps: PlanStep[]) {
    onSave?.(nextSteps);
    setIsEditing(false);
    focusLater(rootRef, '[data-plan-action="approve"]');
  }

  return (
    <section
      ref={rootRef}
      aria-label={`${agent.name}'s plan: ${goal}`}
      className={cn(
        'bg-card hairline-ring ring-border relative rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      {!isEditing && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-expanded={!isFolded}
          aria-controls={bodyId}
          aria-label={toggleLabel}
          onClick={toggleFolded}
          data-plan-toggle
          className='text-muted-foreground absolute end-2.5 top-2.5 z-10'
        >
          <Swap swapKey={String(isFolded)}>
            {isFolded && <ChevronsUpDownIcon />}
            {!isFolded && <ListCollapseIcon />}
          </Swap>
        </Button>
      )}
      <KeyedHeight changeKey={shapeKey}>
        <div className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            {isFolded && (
              <motion.div
                key='folded'
                className='flex min-h-12 items-center gap-2.5 py-2 ps-3 pe-12'
                {...fade}
              >
                <AgentTile name={agent.name} series={agent.series} />
                <p className='relative min-w-0 flex-1 truncate text-[13px] leading-5'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    <motion.span
                      key={foldedKey}
                      className='block truncate'
                      {...fade}
                    >
                      <FoldedLine
                        phase={phase}
                        steps={steps}
                        startedAt={startedAt}
                        endedAt={endedAt}
                      />
                    </motion.span>
                  </AnimatePresence>
                </p>
              </motion.div>
            )}
            {!isFolded && (
              <motion.div
                key='full'
                id={bodyId}
                className='flex flex-col gap-4 p-4'
                {...fade}
              >
                <header className='flex items-start gap-3 pe-8'>
                  <AgentTile
                    name={agent.name}
                    series={agent.series}
                    size='lg'
                  />
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-sm font-medium' title={goal}>
                      {goal}
                    </h3>
                    <div className='mt-1 flex flex-wrap items-center gap-2'>
                      <span className='text-muted-foreground text-xs'>
                        {agent.name}&rsquo;s plan
                      </span>
                      <Swap swapKey={phase}>
                        <Badge variant={look.variant}>{look.label}</Badge>
                      </Swap>
                    </div>
                  </div>
                </header>
                <PlanProgress
                  steps={steps}
                  startedAt={startedAt}
                  endedAt={endedAt}
                  isLive={isLive}
                />
                <div className='relative'>
                  <AnimatePresence mode='popLayout' initial={false}>
                    {isEditing && (
                      <motion.div key='editor' {...fade}>
                        <PlanEditor
                          steps={steps}
                          onCancel={cancelEditing}
                          onSave={saveEditing}
                        />
                      </motion.div>
                    )}
                    {!isEditing && (
                      <motion.div key='steps' {...fade}>
                        <StepList
                          steps={steps}
                          changes={changes}
                          agent={agent}
                          currentId={currentId}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence mode='popLayout' initial={false}>
                  {isWaiting && (
                    <motion.div
                      key='ask'
                      className='flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2'
                      {...fade}
                    >
                      <p className='text-muted-foreground text-xs'>
                        {agent.name} starts once you approve
                      </p>
                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={startEditing}
                          data-plan-action='edit'
                        >
                          <PencilIcon />
                          Edit plan
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          onClick={approve}
                          data-plan-action='approve'
                          className={pressedSolidOf(isApprovePressed)}
                        >
                          <CheckIcon />
                          Approve plan
                        </Button>
                      </div>
                    </motion.div>
                  )}
                  {showsTrace && (
                    <motion.p
                      key='trace'
                      className='text-muted-foreground flex min-h-8 items-center gap-1.5 text-xs'
                      {...fade}
                    >
                      <CheckIcon className='text-success-foreground size-3.5 shrink-0' />
                      <span>
                        You approved this plan, <RelativeTime at={resolvedAt} />
                      </span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </KeyedHeight>
    </section>
  );
}

const GOAL = 'Find where Brightmoor overcharged us in Q3 and ask for a credit';

function upcoming(id: string, title: string, substeps?: PlanStep[]): PlanStep {
  if (substeps) {
    return { id, title, status: 'upcoming', substeps };
  }
  return { id, title, status: 'upcoming' };
}

const PLAN: PlanStep[] = [
  upcoming('gather', 'Gather the Q3 invoices from the finance drive', [
    upcoming('gather-list', 'List the invoice files for July to September'),
    upcoming('gather-read', 'Read the 117 invoice lines'),
  ]),
  upcoming('page', 'Read the Brightmoor pricing page'),
  upcoming('compare', 'Compare each invoice line with the list price', [
    upcoming('compare-match', 'Match the items by SKU'),
    upcoming('compare-flag', 'Flag the lines above the list price'),
    upcoming('compare-sum', 'Add up what was overpaid'),
  ]),
  upcoming('contract', 'Check the bulk discounts in the contract'),
  upcoming('page-check', 'Confirm the page prices against the contract'),
  upcoming('draft', 'Draft the credit request to Brightmoor accounts'),
  upcoming('summary', 'Write a summary for the finance team'),
];

const FAILING_STEP_ID = 'page';

const ADDED_STEP = upcoming(
  'ask-list',
  'Ask Brightmoor accounts for their price list'
);

const DROPPED_STEP_ID = 'page-check';

const PLAN_APPROVAL: ApprovalRequest = {
  id: 'plan',
  title: 'Run this plan',
  risk: 'low',
  status: 'pending',
  agentId: PLANNER.id,
};

const INITIAL_RUN = emptyRun({
  id: 'brightmoor-plan',
  title: RUN_TITLE,
  agents: [PLANNER],
  plan: PLAN,
  approvals: [PLAN_APPROVAL],
});

const NO_SCRIPT: RunScriptStep[] = [];

const STEP_GAP_MS = 300;

const REVISION_PAUSE_MS = 900;

const DEFAULT_STEP_MS = 1600;

const STEP_MS: Record<string, number> = {
  gather: 2000,
  page: 1300,
  'ask-list': 1900,
  compare: 2700,
  contract: 1500,
  draft: 2300,
  summary: 1500,
};

function stepTo(id: string, status: StepStatus): RunScriptStep['event'] {
  return { type: 'step.updated', id, patch: { status } };
}

function hasStep(plan: PlanStep[], stepId: string) {
  return plan.some((step) => step.id === stepId);
}

/** The agent's revision is planned with the rest, out of sight until the step it answers fails. */
function withRevisionSlot(plan: PlanStep[]) {
  const hasRevision = hasStep(plan, ADDED_STEP.id);
  const failingIndex = plan.findIndex((step) => step.id === FAILING_STEP_ID);
  const canFail = failingIndex >= 0;
  if (hasRevision || !canFail) {
    return plan;
  }
  const revised = [...plan];
  revised.splice(failingIndex + 1, 0, ADDED_STEP);
  return revised;
}

function substepEventsOf(substeps: PlanStep[], duration: number) {
  const exactShare = duration / substeps.length;
  const share = Math.round(exactShare);
  const events: RunScriptStep[] = [];
  for (const substep of substeps) {
    events.push(
      { after: 0, event: stepTo(substep.id, 'running') },
      { after: share, event: stepTo(substep.id, 'done') }
    );
  }
  return events;
}

function failureEventsOf(plan: PlanStep[], duration: number) {
  const failure: RunScriptStep['event'] = {
    type: 'step.updated',
    id: FAILING_STEP_ID,
    patch: { status: 'failed', detail: PAGE_ERROR },
  };
  const events: RunScriptStep[] = [
    { after: STEP_GAP_MS, event: stepTo(FAILING_STEP_ID, 'running') },
    { after: duration, event: failure },
  ];
  const canDrop = hasStep(plan, DROPPED_STEP_ID);
  if (canDrop) {
    events.push({
      after: REVISION_PAUSE_MS,
      event: stepTo(DROPPED_STEP_ID, 'skipped'),
    });
  }
  return events;
}

function eventsOfStep(step: PlanStep, plan: PlanStep[]): RunScriptStep[] {
  const duration = STEP_MS[step.id] ?? DEFAULT_STEP_MS;
  if (step.id === FAILING_STEP_ID) {
    return failureEventsOf(plan, duration);
  }
  const isDropped = step.id === DROPPED_STEP_ID;
  const isRevisedPlan = hasStep(plan, ADDED_STEP.id);
  if (isDropped && isRevisedPlan) {
    return [];
  }
  const start = { after: STEP_GAP_MS, event: stepTo(step.id, 'running') };
  const substeps = step.substeps ?? [];
  if (substeps.length === 0) {
    return [start, { after: duration, event: stepTo(step.id, 'done') }];
  }
  const substepEvents = substepEventsOf(substeps, duration);
  return [
    start,
    ...substepEvents,
    { after: 0, event: stepTo(step.id, 'done') },
  ];
}

/** The run follows the plan as approved, edits included: renamed, moved, removed and added steps. */
function scriptOf(plan: PlanStep[]) {
  const script: RunScriptStep[] = [
    { after: 400, event: { type: 'run.started' } },
  ];
  for (const step of plan) {
    const events = eventsOfStep(step, plan);
    script.push(...events);
  }
  script.push({ after: 500, event: { type: 'run.finished', status: 'done' } });
  return script;
}

function isRevisedRun(plan: PlanStep[]) {
  const failing = plan.find((step) => step.id === FAILING_STEP_ID);
  return failing?.status === 'failed';
}

function visibleStepsOf(plan: PlanStep[]) {
  if (isRevisedRun(plan)) {
    return plan;
  }
  return plan.filter((step) => step.id !== ADDED_STEP.id);
}

function changesOf(plan: PlanStep[]) {
  if (!isRevisedRun(plan)) {
    return NO_CHANGES;
  }
  const changes: PlanChange[] = [];
  if (hasStep(plan, ADDED_STEP.id)) {
    changes.push({ stepId: ADDED_STEP.id, kind: 'added' });
  }
  const dropped = plan.find((step) => step.id === DROPPED_STEP_ID);
  if (dropped?.status === 'skipped') {
    changes.push({ stepId: DROPPED_STEP_ID, kind: 'skipped' });
  }
  return changes;
}

function isAddedStep(changes: PlanChange[], stepId: string) {
  const change = changeOf(changes, stepId);
  return change?.kind === 'added';
}

function announcementOf(
  run: RunSnapshot,
  steps: PlanStep[],
  changes: PlanChange[]
) {
  const [approval] = run.approvals;
  if (isPendingApproval(approval)) {
    const stepCount = countOf(steps.length, 'step');
    return `${PLANNER.name} proposes a plan of ${stepCount} and waits for your approval`;
  }
  if (run.status === 'done') {
    return 'The plan is done';
  }
  const current = currentStepOf(steps);
  if (!current) {
    return '';
  }
  const position = `Step ${current.position} of ${current.total}: ${current.step.title}`;
  if (isAddedStep(changes, current.step.id)) {
    return `The pricing page failed, so ${PLANNER.name} revised the plan. ${position}`;
  }
  return position;
}

function durationOf(script: RunScriptStep[]) {
  let total = 0;
  for (const step of script) {
    total += step.after;
  }
  return total;
}

const DEMO_PLAN = withRevisionSlot(PLAN);

const DEMO_SCRIPT = scriptOf(DEMO_PLAN);

const LAST_CHECK_MS = 600;

/**
 * The demonstration approves the plan as it was proposed, so it knows how long that run takes: it
 * holds for as long, then a moment more so the last check is seen landing, before the next round.
 */
const DEMO_RUN_MS = durationOf(DEMO_SCRIPT) + LAST_CHECK_MS;

type PressKey = 'approve';

/**
 * The run is built from the plan a person approves, edits included, so its script is not known
 * ahead: it plays into the run store, and the demonstration only presses Approve plan and waits.
 */
export default function Agent01() {
  const [script, setScript] = useState(NO_SCRIPT);
  const { pressed, press } = usePress<PressKey>();
  const demoSteps: AutoplayStep[] = [
    { after: DECIDE_AFTER_MS, run: () => press('approve') },
    { after: PRESS_LEAD_MS, run: () => approve() },
    { after: DEMO_RUN_MS, run: hold },
  ];
  const {
    ref,
    isInView,
    isAutoplaying,
    restart: replay,
  } = useAutoplay(demoSteps, { loopAfter: 3000, onReset: () => resetRun() });
  const {
    snapshot,
    store,
    restart: restartRun,
  } = useRunScript(script, { initial: INITIAL_RUN, isActive: isInView });
  const steps = visibleStepsOf(snapshot.plan);
  const changes = changesOf(snapshot.plan);
  const [approval] = snapshot.approvals;
  const isEnded = snapshot.endedAt !== undefined;
  const canReplay = isEnded && !isAutoplaying;
  const announcement = announcementOf(snapshot, steps, changes);

  function approve() {
    const plan = withRevisionSlot(snapshot.plan);
    store.dispatch({ type: 'plan.set', steps: plan });
    store.dispatch({
      type: 'approval.resolved',
      id: PLAN_APPROVAL.id,
      decision: 'approved',
    });
    setScript(scriptOf(plan));
  }

  function save(nextSteps: PlanStep[]) {
    store.dispatch({ type: 'plan.set', steps: nextSteps });
  }

  function resetRun() {
    setScript(NO_SCRIPT);
    restartRun();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[38.5rem] w-full max-w-[34rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <AgentPlan
          goal={GOAL}
          agent={PLANNER}
          steps={steps}
          status={snapshot.status}
          approval={approval}
          changes={changes}
          startedAt={snapshot.startedAt}
          endedAt={snapshot.endedAt}
          onApprove={approve}
          onSave={save}
          isApprovePressed={pressed === 'approve'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={canReplay}
          onReplay={replay}
          label='Replay the plan'
        />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
