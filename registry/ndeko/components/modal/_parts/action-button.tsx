'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckIcon, LoaderCircleIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

import { Swap } from './swap';

export type ActionState = 'idle' | 'working' | 'done';

export type ActionLabels = Record<ActionState, string>;

const WORKING_MS = 800;

const DONE_MS = 1600;

/** The life of an action that takes a moment: working, then done for a beat, then ready again. The change is committed when the work ends. */
export function useTimedAction() {
  const [state, setState] = useState<ActionState>('idle');
  const commitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (state === 'working') {
      const timeout = window.setTimeout(() => {
        const commit = commitRef.current;
        commitRef.current = null;
        if (commit) {
          commit();
        }
        setState('done');
      }, WORKING_MS);
      return () => window.clearTimeout(timeout);
    }
    if (state === 'done') {
      const timeout = window.setTimeout(() => {
        setState('idle');
      }, DONE_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [state]);

  function run(commit: () => void) {
    if (state !== 'idle') {
      return;
    }
    commitRef.current = commit;
    setState('working');
  }

  const isBusy = state !== 'idle';

  return { state, run, isBusy };
}

function iconOf(state: ActionState, idleIcon: React.ReactNode) {
  if (state === 'working') {
    return <LoaderCircleIcon className='animate-spin' />;
  }
  if (state === 'done') {
    return <CheckIcon />;
  }
  return idleIcon;
}

type ActionButtonProps = Omit<ButtonProps, 'children'> & {
  state: ActionState;
  labels: ActionLabels;
  idleIcon?: React.ReactNode;
};

/** One button that becomes its next state: its icon swaps, its label crossfades and its width follows the new label. */
export function ActionButton({
  state,
  labels,
  idleIcon,
  ...props
}: ActionButtonProps) {
  const icon = iconOf(state, idleIcon);
  const hasIcon = Boolean(icon);
  const label = labels[state];
  const isWorking = state === 'working';
  const isDone = state === 'done';

  return (
    <>
      <Button aria-busy={isWorking} {...props}>
        {hasIcon && <Swap swapKey={state}>{icon}</Swap>}
        <AnimatedSize axis='width' as='span'>
          <Swap swapKey={label} kind='label'>
            {label}
          </Swap>
        </AnimatedSize>
      </Button>
      <span className='sr-only' role='status'>
        {isDone && labels.done}
      </span>
    </>
  );
}
