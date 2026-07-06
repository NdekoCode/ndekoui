'use client';

import { memo, useRef } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  CopyPlusIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { KIND_WORD, type Step } from './model';
import { RenameInput } from './name-field';
import { StepTile } from './node-tile';
import type { StepRun, StepStatus } from './run';
import { StateMark, stateWordsOf } from './state-mark';

const CARD =
  'bg-card relative flex h-(--step-height) w-(--step-width) items-center rounded-xl transition-[translate,box-shadow,opacity,scale,background-color] duration-200 ease-(--ease-out-strong)';

/** A step that was just added grows into its place. The others were there already and do not play it. */
const ARRIVAL = 'starting:scale-95 starting:opacity-0';

const RESTING = 'shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

/** A step at work lifts by a pixel, under a hairline of the primary colour. */
const LIFTED = '-translate-y-px shadow-[0_4px_10px_-3px_rgb(0_0_0/0.14)]';

/** A note of the run takes the place of the kind with a fade. The kind itself is simply there when the page loads. */
const NOTE_FADE = 'transition-opacity duration-300 starting:opacity-0';

function isAtWork(status: StepStatus | undefined) {
  return status === 'running' || status === 'retrying';
}

function ringOf(isSelected: boolean, status: StepStatus | undefined) {
  if (isSelected) {
    return 'ring-primary/60 ring-2';
  }
  if (isAtWork(status)) {
    return 'hairline-ring ring-primary';
  }
  if (status === 'failed') {
    return 'hairline-ring ring-destructive/50';
  }
  if (status === 'waiting') {
    return 'hairline-ring ring-warning/70';
  }
  return 'hairline-ring ring-border';
}

function liftOf(status: StepStatus | undefined) {
  if (isAtWork(status)) {
    return LIFTED;
  }
  return RESTING;
}

function noteFadeOf(hasNote: boolean) {
  if (hasNote) {
    return NOTE_FADE;
  }
  return undefined;
}

function standingOf(status: StepStatus | undefined) {
  if (status === 'skipped') {
    return 'opacity-50';
  }
  return 'opacity-100';
}

function arrivalOf(isArrived: boolean) {
  if (isArrived) {
    return ARRIVAL;
  }
  return undefined;
}

function overlineToneOf(status: StepStatus | undefined) {
  if (status === 'failed') {
    return 'text-destructive-ink';
  }
  if (status === 'waiting') {
    return 'text-warning-foreground';
  }
  return 'text-muted-foreground';
}

/** "Tool: Find the order, step 4 of 10, Refund branch, done in 0.7s". */
function nameOf(
  step: Step,
  position: number,
  total: number,
  branchLabel: string | null,
  stepRun: StepRun | undefined
) {
  const parts = [
    `${KIND_WORD[step.kind]}: ${step.name}`,
    `step ${position} of ${total}`,
  ];
  if (branchLabel !== null) {
    parts.push(`${branchLabel} branch`);
  }
  const state = stateWordsOf(stepRun);
  parts.push(state);
  return parts.join(', ');
}

type NodeMenuProps = {
  name: string;
  onRename: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

function NodeMenu({ name, onRename, onDuplicate, onRemove }: NodeMenuProps) {
  const hasActed = useRef(false);

  function choose(action: () => void) {
    hasActed.current = true;
    action();
  }

  /** After an action the focus goes where the action leads: the field, the copy, the step before. Closing without one gives it back to the button. */
  function returnsFocus() {
    const wasActed = hasActed.current;
    hasActed.current = false;
    return !wasActed;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={`Actions for ${name}`}
            className='text-muted-foreground absolute end-1.5 bottom-1.5 size-6'
          />
        }
      >
        <EllipsisIcon className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='w-44'
        finalFocus={returnsFocus}
      >
        <DropdownMenuItem onClick={() => choose(onRename)}>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose(onDuplicate)}>
          <CopyPlusIcon />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onClick={() => choose(onRemove)}
        >
          <Trash2Icon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type NodeCardProps = {
  step: Step;
  position: number;
  total: number;
  branchLabel: string | null;
  stepRun: StepRun | undefined;
  isSelected: boolean;
  isArrived: boolean;
  isPressed: boolean;
  isRenaming: boolean;
  onSelect: (id: string, isFromKeyboard: boolean) => void;
  onReveal: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStartRename: (id: string) => void;
  onSettleRename: (id: string, name: string | null, isFromKey: boolean) => void;
};

export const NodeCard = memo(function NodeCard({
  step,
  position,
  total,
  branchLabel,
  stepRun,
  isSelected,
  isArrived,
  isPressed,
  isRenaming,
  onSelect,
  onReveal,
  onRemove,
  onDuplicate,
  onStartRename,
  onSettleRename,
}: NodeCardProps) {
  const status = stepRun?.status;
  const note = stepRun?.note ?? null;
  const overline = note ?? KIND_WORD[step.kind];
  const name = nameOf(step, position, total, branchLabel, stepRun);

  /** A click from the keyboard carries no press of a pointer: that is how Enter and Space are told apart from a tap. */
  function select(event: React.MouseEvent<HTMLButtonElement>) {
    const isFromKeyboard = event.detail === 0;
    event.currentTarget.focus();
    onSelect(step.id, isFromKeyboard);
  }

  /** A step reached with the keyboard may sit outside the frame: the canvas brings it into view. A press of a pointer never moves it. */
  function revealFromKeys(event: React.FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.matches(':focus-visible')) {
      onReveal(step.id);
    }
  }

  function handleKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isRemoveKey = event.key === 'Delete' || event.key === 'Backspace';
    if (isRemoveKey) {
      event.preventDefault();
      onRemove(step.id);
      return;
    }
    if (event.key === 'F2') {
      event.preventDefault();
      onStartRename(step.id);
    }
  }

  if (isRenaming) {
    return (
      <div
        data-solid
        className={cn(CARD, 'ring-primary/60 gap-2.5 px-2.5 ring-2')}
      >
        <StepTile step={step} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='text-muted-foreground text-[11px] leading-4'>
            {KIND_WORD[step.kind]}
          </span>
          <RenameInput
            value={step.name}
            label={`Name of the step ${step.name}`}
            onSettle={(next, isFromKey) =>
              onSettleRename(step.id, next, isFromKey)
            }
            className='-mx-1 h-5 font-medium'
          />
        </span>
      </div>
    );
  }

  return (
    <div
      data-solid
      className={cn(
        CARD,
        ringOf(isSelected, status),
        liftOf(status),
        standingOf(status),
        arrivalOf(isArrived),
        pressedQuietOf(isPressed)
      )}
    >
      <button
        type='button'
        data-node={step.id}
        aria-label={name}
        aria-pressed={isSelected}
        aria-keyshortcuts='F2 Delete'
        onClick={select}
        onFocus={revealFromKeys}
        onKeyDown={handleKeys}
        className='focus-visible:ring-ring focus-visible:ring-offset-background flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
      >
        <StepTile step={step} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='flex h-4 items-center gap-1.5'>
            <span
              key={overline}
              className={cn(
                'min-w-0 flex-1 truncate text-[11px] leading-4',
                overlineToneOf(status),
                noteFadeOf(note !== null)
              )}
            >
              {overline}
            </span>
            <StateMark stepRun={stepRun} />
          </span>
          <span className='truncate pe-6 text-[13px] leading-5 font-medium'>
            {step.name}
          </span>
        </span>
      </button>
      <NodeMenu
        name={step.name}
        onRename={() => onStartRename(step.id)}
        onDuplicate={() => onDuplicate(step.id)}
        onRemove={() => onRemove(step.id)}
      />
    </div>
  );
});
