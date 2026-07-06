'use client';

import { useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AskBar } from './ask-bar';
import { PERSON, WORKSPACE } from './data';
import { Figures } from './figures';
import { NeedsYou } from './needs-you';
import { QuickActions } from './quick-actions';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  waitingCountOf,
} from './session';
import { SpendCard, TasksCard } from './trend-cards';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

export default function AiProduct02() {
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
  useKeptHeight(ref);
  const shouldReduceMotion = usePrefersReducedMotion();
  const [hasRolled, setHasRolled] = useState(false);
  if (isInView && !hasRolled) {
    setHasRolled(true);
  }
  const isRolled = hasRolled || shouldReduceMotion;
  const waiting = waitingCountOf(state);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;
  const isStreaming = !shouldReduceMotion;

  return (
    <div
      ref={ref}
      className='bg-background text-foreground @container min-h-[88rem] w-full @3xl:min-h-[50rem]'
    >
      <div className='mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 @2xl:px-6 @2xl:py-8'>
        <header className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
          <div className='flex min-w-0 items-center gap-2.5'>
            <CompanyMark seed={WORKSPACE.name} size='lg' />
            <div className='flex min-w-0 flex-col'>
              <h1 className='truncate text-lg font-semibold'>Home</h1>
              <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                {WORKSPACE.name}
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
            <span className='flex items-center gap-2 text-[13px]'>
              <Avatar seed={PERSON.name} className='size-7' />
              {PERSON.name}
            </span>
          </div>
        </header>

        <Figures isRolled={isRolled} waiting={waiting} />

        <AskBar
          question={state.question}
          answerId={state.answerId}
          isStreaming={isStreaming}
          pressed={pressed}
          onType={(text) => act({ type: 'questionTyped', text })}
          onAsk={() => act({ type: 'asked' })}
          onPick={(id) => act({ type: 'suggestionPicked', id })}
        />

        <QuickActions />

        <div className='grid gap-5 @3xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @3xl:items-start'>
          <NeedsYou
            arrived={state.arrived}
            resolved={state.resolved}
            waiting={waiting}
            pressed={pressed}
            onAct={(id) => act({ type: 'resolved', id })}
          />
          <div className='flex flex-col gap-5'>
            <SpendCard isRolled={isRolled} />
            <TasksCard isRolled={isRolled} />
          </div>
        </div>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
