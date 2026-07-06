'use client';

import { useEffect } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ListChecksIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ApprovalTile } from './approval-tile';
import { ContextTile } from './context-tile';
import { CostTile } from './cost-tile';
import { APPROVAL, SECTION } from './data';
import { PlanTile } from './plan-tile';
import { PromptTile } from './prompt-tile';
import {
  doneCountOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TRAY_READ_MS,
  type RunState,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function spokenLineOf(state: RunState) {
  if (state.approval === 'waiting') {
    return `Ledgerfinch asks: ${APPROVAL.title}. Approve or decline.`;
  }
  if (state.approval === 'approved') {
    return 'Approved, the matches are posted';
  }
  if (state.approval === 'declined') {
    return 'Declined, the step was skipped';
  }
  return '';
}

export default function Features04() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  const isReading = state.tray === 'reading';
  const isSentByPerson = isReading && !isAutoplaying;
  const doneCount = doneCountOf(state);
  const message = spokenUnless(isAutoplaying, spokenLineOf(state));
  const canReplay = isFinished && !isAutoplaying;

  useKeptHeight(ref);

  useEffect(() => {
    if (!isSentByPerson) {
      return;
    }
    const timer = setTimeout(() => act({ type: 'planned' }), TRAY_READ_MS);
    return () => clearTimeout(timer);
  }, [isSentByPerson, act]);

  return (
    <div ref={ref} className='@container min-h-[60rem]'>
      <section className='px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <div className='mx-auto flex max-w-6xl flex-col gap-10'>
          <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-4'>
            <div className='flex max-w-2xl flex-col gap-3'>
              <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
                <ListChecksIcon className='size-4' />
                {SECTION.label}
              </p>
              <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
                {SECTION.title}
              </h2>
              <p className='text-muted-foreground text-base text-pretty'>
                {SECTION.lead}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay'
              />
              <Badge variant='secondary'>{SECTION.figures}</Badge>
            </div>
          </header>
          <ul className='grid gap-3 @4xl:grid-cols-6'>
            <li className='flex @4xl:col-span-3'>
              <PromptTile
                prompt={state.prompt}
                tray={state.tray}
                isSendPressed={pressed === 'send'}
                onType={(value) => act({ type: 'typed', value })}
                onSend={() => act({ type: 'sent' })}
              />
            </li>
            <li className='flex @4xl:col-span-3'>
              <PlanTile steps={state.steps} doneCount={doneCount} />
            </li>
            <li className='flex @4xl:col-span-2'>
              <ApprovalTile
                approval={state.approval}
                isApprovePressed={pressed === 'approve'}
                onApprove={() => act({ type: 'approved' })}
                onDecline={() => act({ type: 'declined' })}
              />
            </li>
            <li className='flex @4xl:col-span-2'>
              <ContextTile percent={state.context} />
            </li>
            <li className='flex @4xl:col-span-2'>
              <CostTile cost={state.cost} />
            </li>
          </ul>
        </div>
      </section>
      <LiveRegion message={message} />
    </div>
  );
}
