'use client';

import { useId } from 'react';

import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Wash } from '@/registry/ndeko/ui/wash';

import type { ApprovalStep } from './model';
import type { Decision } from './run';
import type { Sample } from './samples';

type ApprovalCardProps = {
  step: ApprovalStep;
  sample: Sample;
  workflowName: string;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

/**
 * What a step asks a person before the run goes on. It hangs from its step on the canvas and keeps
 * its size whatever the zoom, so its two answers stay easy to press on a phone.
 */
export function ApprovalCard({
  step,
  sample,
  workflowName,
  pressed,
  onDecide,
}: ApprovalCardProps) {
  const titleId = useId();
  const keysId = useId();
  const request = sample.request;

  function allow() {
    onDecide('approved');
  }

  function deny() {
    onDecide('denied');
  }

  function decideFromKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      deny();
      return;
    }
    const isOnCard = event.target === event.currentTarget;
    const isEnter = event.key === 'Enter';
    if (isEnter && isOnCard) {
      event.preventDefault();
      allow();
    }
  }

  return (
    <div
      role='group'
      tabIndex={0}
      data-solid
      data-approval-card
      aria-labelledby={titleId}
      aria-describedby={keysId}
      onKeyDown={decideFromKeys}
      className='surface-raised focus-visible:ring-ring/25 absolute top-[calc(var(--step-height)+8px)] left-0 isolate flex w-60 origin-top-left scale-[calc(1/var(--zoom,1))] cursor-default flex-col gap-2.5 rounded-xl p-3 text-start transition-[opacity,translate] duration-200 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] @2xl/canvas:top-0 @2xl/canvas:left-[calc(var(--step-width)+8px)] starting:translate-y-1 starting:opacity-0'
    >
      <Wash color='var(--warning)' />
      <div className='flex items-center gap-2'>
        <h3
          id={titleId}
          className='min-w-0 flex-1 truncate text-[13px] font-medium'
        >
          {step.name}
        </h3>
        <Badge variant='warning'>Waiting on you</Badge>
      </div>
      {request && (
        <div className='flex flex-col gap-0.5'>
          <p className='text-2xl leading-8 font-semibold tabular-nums'>
            {request.amount}
          </p>
          <p className='text-muted-foreground text-xs'>
            {request.order}, {request.item}
          </p>
        </div>
      )}
      <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
        <Avatar seed={sample.from} className='size-4' />
        <span className='min-w-0'>
          Asked by {workflowName}, for {sample.from}
        </span>
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          onClick={allow}
          className={pressedSolidOf(pressed === 'allow')}
        >
          Allow
          <Kbd className='ms-0.5'>Enter</Kbd>
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={deny}>
          Deny
          <Kbd className='ms-0.5'>Esc</Kbd>
        </Button>
        <Badge variant='secondary' className='ms-auto'>
          Illustrative
        </Badge>
      </div>
      <span id={keysId} className='sr-only'>
        Enter allows, Escape denies
      </span>
    </div>
  );
}
