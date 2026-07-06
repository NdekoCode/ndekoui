'use client';

import { useId } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { ChevronDownIcon, LockIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import { CalmCheck } from './calm-check';
import { STEPS, WORKSPACE, type SetupStep, type StepId } from './data';
import { ProgressRing } from './progress-ring';
import { statusOf, TOTAL, type StepStatus } from './session';

const NUMBER =
  'inline-flex size-[18px] items-center justify-center rounded-full text-[11px] leading-none font-medium tabular-nums';

const ROW =
  'focus-visible:ring-ring/25 flex h-10 w-full items-center gap-2.5 rounded-lg px-2 text-start outline-none transition-colors duration-150 focus-visible:ring-[3px]';

const HOW_TO_TOGGLE =
  'text-primary-ink focus-visible:ring-ring/25 -mx-1 flex h-6 w-fit cursor-pointer items-center gap-1 rounded-sm px-1 text-xs font-medium outline-none transition-[background-color,scale] duration-150 hover:bg-foreground/[0.05] focus-visible:ring-[3px]';

function rowToneOf(status: StepStatus) {
  if (status === 'locked') {
    return 'text-muted-foreground cursor-not-allowed';
  }
  return 'hover:bg-foreground/[0.04] cursor-pointer';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function stepsLeftLineOf(left: number) {
  if (left === 0) {
    return 'Every step is done';
  }
  if (left === 1) {
    return '1 step left';
  }
  return `${left} steps left`;
}

type StepMarkProps = {
  status: StepStatus;
  number: number;
};

/** The number becomes a check when the step is done. Steps that are done when the page loads show their check at once. */
function StepMark({ status, number }: StepMarkProps) {
  return (
    <Swap swapKey={status} className='size-[18px] shrink-0 justify-center'>
      {status === 'done' && (
        <DrawnCheck tone='success' entrance='draw' pace='calm' />
      )}
      {status === 'current' && (
        <span className={cn(NUMBER, 'bg-primary text-primary-foreground')}>
          {number}
        </span>
      )}
      {status === 'locked' && (
        <span
          className={cn(NUMBER, 'bg-foreground/[0.06] text-muted-foreground')}
        >
          {number}
        </span>
      )}
    </Swap>
  );
}

type StepRowProps = {
  step: SetupStep;
  number: number;
  status: StepStatus;
  isOpen: boolean;
  isHowToOpen: boolean;
  pressed: string | null;
  onToggle: (id: StepId) => void;
  onToggleHowTo: (id: StepId) => void;
  onComplete: (id: StepId) => void;
};

function StepRow({
  step,
  number,
  status,
  isOpen,
  isHowToOpen,
  pressed,
  onToggle,
  onToggleHowTo,
  onComplete,
}: StepRowProps) {
  const bodyId = useId();
  const howToId = useId();
  const isLocked = status === 'locked';
  const isCurrent = status === 'current';
  const hasAction = isCurrent && step.action !== undefined;

  return (
    <li>
      <button
        type='button'
        data-step-row={step.id}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        disabled={isLocked}
        onClick={() => onToggle(step.id)}
        className={cn(ROW, rowToneOf(status))}
      >
        <StepMark status={status} number={number} />
        <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
          {step.title}
        </span>
        {isLocked && (
          <LockIcon aria-hidden='true' className='size-3.5 shrink-0' />
        )}
        {isLocked && <span className='sr-only'>Locked</span>}
        {!isLocked && (
          <ChevronDownIcon
            aria-hidden='true'
            className={cn(
              'text-muted-foreground size-3.5 shrink-0 transition-[rotate] duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isOpen)
            )}
          />
        )}
      </button>
      <Fold open={isOpen} id={bodyId}>
        <div className='flex flex-col items-start gap-2.5 ps-[2.375rem] pe-2 pb-2.5'>
          <p className='text-muted-foreground text-xs leading-5 text-pretty'>
            {step.detail}
          </p>
          {step.howTo && (
            <div className='flex w-full flex-col'>
              <button
                type='button'
                aria-expanded={isHowToOpen}
                aria-controls={howToId}
                onClick={() => onToggleHowTo(step.id)}
                className={cn(
                  HOW_TO_TOGGLE,
                  pressedQuietOf(pressed === `howto-${step.id}`)
                )}
              >
                How it works
                <ChevronDownIcon
                  aria-hidden='true'
                  className={cn(
                    'size-3.5 transition-[rotate] duration-200 ease-(--ease-out-strong)',
                    chevronTurnOf(isHowToOpen)
                  )}
                />
              </button>
              <Fold open={isHowToOpen} id={howToId}>
                <ol className='text-muted-foreground flex list-decimal flex-col gap-1 ps-4 pt-1.5 text-xs leading-5 marker:tabular-nums'>
                  {step.howTo.map((line) => (
                    <li key={line} className='ps-0.5'>
                      {line}
                    </li>
                  ))}
                </ol>
              </Fold>
            </div>
          )}
          {hasAction && (
            <Button
              type='button'
              size='sm'
              data-step-cta={step.id}
              onClick={() => onComplete(step.id)}
              className={pressedSolidOf(pressed === `cta-${step.id}`)}
            >
              {step.action}
            </Button>
          )}
        </div>
      </Fold>
    </li>
  );
}

type RevealProps = {
  isOpen: boolean;
  children: React.ReactNode;
};

function rowsOf(isOpen: boolean) {
  if (isOpen) {
    return 'grid-rows-[1fr] opacity-100';
  }
  return 'grid-rows-[0fr] opacity-0';
}

/**
 * A part of the card that opens to the height of what it holds. The row of a grid does it, so the
 * steps inside keep folding at their own pace without a second measure chasing them.
 */
function Reveal({ isOpen, children }: RevealProps) {
  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-(--ease-out-strong)',
        rowsOf(isOpen)
      )}
    >
      <div inert={!isOpen} className='min-h-0 overflow-hidden'>
        {children}
      </div>
    </div>
  );
}

export type ChecklistCardProps = {
  done: StepId[];
  openId: StepId | null;
  howToId: StepId | null;
  /** Every step is done and the card says so before it leaves. */
  isComplete: boolean;
  pressed: string | null;
  onToggle: (id: StepId) => void;
  onToggleHowTo: (id: StepId) => void;
  onComplete: (id: StepId) => void;
  onSnooze: () => void;
  onDismiss: () => void;
};

/** The card closes over its steps and opens on its closing message: it is the same card, saying something shorter. */
export function ChecklistCard({
  done,
  openId,
  howToId,
  isComplete,
  pressed,
  onToggle,
  onToggleHowTo,
  onComplete,
  onSnooze,
  onDismiss,
}: ChecklistCardProps) {
  const headingId = useId();
  const doneCount = done.length;
  const left = TOTAL - doneCount;

  return (
    <>
      <Reveal isOpen={isComplete}>
        {isComplete && (
          <div
            data-complete
            tabIndex={-1}
            className='flex items-center gap-3 p-4 outline-none'
          >
            <CalmCheck />
            <div className='flex min-w-0 flex-col gap-0.5'>
              <p className='text-sm font-medium'>{WORKSPACE.name} is set up</p>
              <p className='text-muted-foreground text-xs text-pretty'>
                This guide stays under Setup guide in the top bar
              </p>
            </div>
          </div>
        )}
      </Reveal>
      <Reveal isOpen={!isComplete}>
        <header className='flex items-center gap-3 p-3.5 pb-2'>
          <ProgressRing done={doneCount} total={TOTAL}>
            <MotionNumber
              value={doneCount}
              className='text-xs leading-none font-semibold'
            />
          </ProgressRing>
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <h2 id={headingId} className='truncate text-sm font-medium'>
              Set up {WORKSPACE.name}
            </h2>
            <p className='text-muted-foreground text-xs tabular-nums'>
              <span className='sr-only'>
                {doneCount} of {TOTAL} steps done.{' '}
              </span>
              {stepsLeftLineOf(left)}
            </p>
          </div>
        </header>
        <ol aria-labelledby={headingId} className='flex flex-col px-1.5'>
          {STEPS.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              number={index + 1}
              status={statusOf(done, step.id)}
              isOpen={openId === step.id}
              isHowToOpen={howToId === step.id}
              pressed={pressed}
              onToggle={onToggle}
              onToggleHowTo={onToggleHowTo}
              onComplete={onComplete}
            />
          ))}
        </ol>
        <footer className='flex items-center justify-end gap-1 p-1.5 pt-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            data-snooze
            onClick={onSnooze}
            className={cn(
              'text-muted-foreground',
              pressedQuietOf(pressed === 'snooze')
            )}
          >
            Snooze
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onDismiss}
            className='text-muted-foreground'
          >
            Dismiss
          </Button>
        </footer>
      </Reveal>
    </>
  );
}
