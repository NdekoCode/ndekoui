'use client';

import { useEffect } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from '@/registry/ndeko/ui/stepper';

import {
  indexOfStep,
  stepOf,
  STEPS,
  type Fields,
  type RoleId,
  type SourceId,
  type StepId,
} from './data';
import { ReviewStep, Success } from './review-step';
import {
  CREATE_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOTAL,
  type FinishStatus,
  type WizardAction,
} from './session';
import { firstErrorOf } from './validate';
import { SourceStep, TeamStep, WorkspaceStep } from './wizard-steps';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const FINISH_STATE: Record<FinishStatus, MorphState> = {
  idle: 'idle',
  creating: 'busy',
  created: 'done',
};

const FINISH_LABELS: Record<MorphState, string> = {
  idle: 'Create workspace',
  busy: 'Creating',
  done: 'Created',
};

/** What the wizard hands over once the workspace is created. */
export type WorkspaceSetup = {
  name: string;
  slug: string;
  /** Nothing when the step was skipped. */
  source: SourceId | null;
  connection: string | null;
  invites: string[];
  role: RoleId;
};

function setupOf(fields: Fields, skipped: StepId[]): WorkspaceSetup {
  const setup: WorkspaceSetup = {
    name: fields.name.trim(),
    slug: fields.slug,
    source: null,
    connection: null,
    invites: [],
    role: fields.role,
  };
  if (!skipped.includes('source')) {
    setup.source = fields.source;
    setup.connection = fields.connection.trim();
  }
  if (!skipped.includes('team')) {
    setup.invites = fields.invites;
  }
  return setup;
}

/** Once the workspace exists every step counts as done: the stepper is told the step after the last. */
function activeNumberOf(stepIndex: number, isCreated: boolean) {
  if (isCreated) {
    return TOTAL + 1;
  }
  return stepIndex + 1;
}

function currentStepOf(isCurrent: boolean): 'step' | undefined {
  if (isCurrent) {
    return 'step';
  }
  return undefined;
}

/** A step opened from the review leads back to it. */
function nextLabelOf(isReturning: boolean) {
  if (isReturning) {
    return 'Back to review';
  }
  return 'Next';
}

/** The first step is there when the page loads. The ones that follow fade in. */
function arrivalOf(hasMoved: boolean) {
  if (hasMoved) {
    return 'transition-opacity duration-200 starting:opacity-0';
  }
  return undefined;
}

function stepLineOf(stepIndex: number, isOptional: boolean) {
  const line = `Step ${stepIndex + 1} of ${TOTAL}`;
  if (isOptional) {
    return `${line}, optional`;
  }
  return line;
}

export type Onboarding02Props = {
  /**
   * Keeps the step in the hash of the address, and follows the hash when it changes. It waits for a
   * person: the demonstration never writes to the address of the page.
   */
  syncHash?: boolean;
  /** Nothing calls a network. A real app creates the workspace here. */
  onFinish?: (setup: WorkspaceSetup) => void;
};

export default function Onboarding02({
  syncHash = false,
  onFinish,
}: Onboarding02Props) {
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
  const { schedule, clearAll } = useTimeouts();
  const step = stepOf(state.step);
  const stepIndex = indexOfStep(state.step);
  const isCreated = state.finish === 'created';
  const isCreating = state.finish === 'creating';
  const isEditable = state.finish === 'idle';
  const isReview = state.step === 'review';
  const canGoBack = stepIndex > 0;
  const canSkip = step.isOptional;
  const activeNumber = activeNumberOf(stepIndex, isCreated);
  const shouldSyncHash = syncHash && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  useEffect(() => {
    if (!shouldSyncHash) {
      return;
    }
    const hash = `#${state.step}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [shouldSyncHash, state.step]);

  useEffect(() => {
    if (!shouldSyncHash) {
      return;
    }
    function followHash() {
      const id = window.location.hash.slice(1);
      const target = STEPS.find((candidate) => candidate.id === id);
      if (target) {
        act({ type: 'jumped', step: target.id });
      }
    }
    window.addEventListener('hashchange', followHash);
    return () => window.removeEventListener('hashchange', followHash);
  }, [shouldSyncHash, act]);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /**
   * Works out where an action leads before it is sent: a step that changes takes the focus to its
   * heading, an entry that is refused takes it to the first field at fault.
   */
  function actAndFollow(action: WizardAction) {
    const after = reducer(state, action);
    act(action);
    if (after.step !== state.step) {
      focusLater('[data-step-heading]');
      return;
    }
    const wasRefused = after.attempts !== state.attempts;
    const refusal = firstErrorOf(after.errors);
    if (wasRefused && refusal) {
      focusLater(`[data-field="${refusal.field}"]`);
    }
  }

  const stepBody = {
    fields: state.fields,
    errors: state.errors,
    attempts: state.attempts,
    pressed,
    onAction: actAndFollow,
  };

  /** The button leaves with the review once the workspace exists: a focus that sat on it goes to the message. */
  function create(setup: WorkspaceSetup) {
    const finishButton = ref.current?.querySelector('[data-finish]');
    const hadFocus = finishButton === document.activeElement;
    act({ type: 'created' });
    onFinish?.(setup);
    if (finishButton && hadFocus) {
      focusLater('[data-success]');
    }
  }

  function finish() {
    if (!isEditable) {
      return;
    }
    const setup = setupOf(state.fields, state.skipped);
    act({ type: 'finishPressed' });
    schedule(() => create(setup), CREATE_MS);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReview) {
      finish();
      return;
    }
    actAndFollow({ type: 'nextPressed' });
  }

  function jumpToNumber(number: number) {
    const target = STEPS[number - 1];
    if (target) {
      actAndFollow({ type: 'jumped', step: target.id });
    }
  }

  /** The chip takes its button with it, so the focus goes back to the address box. */
  function removeInvite(address: string) {
    act({ type: 'inviteRemoved', address });
    focusLater('[data-field="invites"]');
  }

  /** A workspace on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex min-h-dvh w-full flex-col items-center p-4 @2xl:p-8'
      >
        <div className='flex w-full max-w-xl flex-col gap-5 @2xl:pt-4'>
          <header className='flex min-h-8 items-center gap-3'>
            <h1 className='min-w-0 flex-1 text-lg font-semibold text-balance'>
              Set up a workspace
            </h1>
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Replay'
            />
          </header>

          <nav aria-label='Setup steps'>
            <Stepper value={activeNumber} onValueChange={jumpToNumber}>
              {STEPS.map((candidate, index) => {
                const number = index + 1;
                const isLast = number === TOTAL;
                const isAhead = index > state.furthest;
                const isCurrent = index === stepIndex && !isCreated;
                return (
                  <StepperItem
                    key={candidate.id}
                    step={number}
                    disabled={isAhead || !isEditable}
                    loading={isCreating}
                    className='not-last:flex-1'
                  >
                    <StepperTrigger
                      aria-current={currentStepOf(isCurrent)}
                      className='gap-2'
                    >
                      <StepperIndicator />
                      <span className='sr-only text-[13px] font-medium whitespace-nowrap @md:not-sr-only'>
                        {candidate.label}
                      </span>
                    </StepperTrigger>
                    {!isLast && <StepperSeparator className='mx-2' />}
                  </StepperItem>
                );
              })}
            </Stepper>
          </nav>

          <section
            aria-label='Workspace setup'
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <AnimatedSize>
              {isCreated && (
                <Success
                  fields={state.fields}
                  skipped={state.skipped}
                  onRestart={() => actAndFollow({ type: 'restarted' })}
                />
              )}
              {!isCreated && (
                <form
                  key={state.step}
                  noValidate
                  onSubmit={submit}
                  className={cn(
                    'flex flex-col gap-5',
                    arrivalOf(state.moves > 0)
                  )}
                >
                  <div className='flex flex-col gap-1'>
                    <p className='text-muted-foreground text-xs tabular-nums'>
                      {stepLineOf(stepIndex, step.isOptional)}
                    </p>
                    <h2
                      data-step-heading
                      tabIndex={-1}
                      className='focus-visible:ring-ring/25 rounded-sm text-base font-semibold text-balance outline-none focus-visible:ring-[3px]'
                    >
                      {step.title}
                    </h2>
                    <p className='text-muted-foreground text-[13px] text-pretty'>
                      {step.lead}
                    </p>
                  </div>

                  {state.step === 'workspace' && (
                    <WorkspaceStep {...stepBody} />
                  )}
                  {state.step === 'source' && <SourceStep {...stepBody} />}
                  {state.step === 'team' && (
                    <TeamStep {...stepBody} onRemoveInvite={removeInvite} />
                  )}
                  {isReview && (
                    <ReviewStep
                      fields={state.fields}
                      skipped={state.skipped}
                      isLocked={!isEditable}
                      pressed={pressed}
                      onEdit={(target) =>
                        actAndFollow({ type: 'jumped', step: target })
                      }
                    />
                  )}

                  <div className='flex flex-wrap items-center gap-2'>
                    {canGoBack && (
                      <Button
                        type='button'
                        variant='ghost'
                        disabled={!isEditable}
                        onClick={() => actAndFollow({ type: 'backPressed' })}
                      >
                        Back
                      </Button>
                    )}
                    <span className='flex-1' />
                    {canSkip && (
                      <Button
                        type='button'
                        variant='ghost'
                        onClick={() => actAndFollow({ type: 'skipPressed' })}
                        className={cn(
                          'text-muted-foreground',
                          pressedQuietOf(pressed === 'skip')
                        )}
                      >
                        Skip
                      </Button>
                    )}
                    {!isReview && (
                      <Button
                        type='submit'
                        className={pressedSolidOf(pressed === 'next')}
                      >
                        {nextLabelOf(state.isReturning)}
                      </Button>
                    )}
                    {isReview && (
                      <MorphButton
                        type='submit'
                        data-finish
                        state={FINISH_STATE[state.finish]}
                        labels={FINISH_LABELS}
                        className={pressedSolidOf(pressed === 'finish')}
                      />
                    )}
                  </div>
                </form>
              )}
            </AnimatedSize>
          </section>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
