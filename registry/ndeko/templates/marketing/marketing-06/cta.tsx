'use client';

import { useEffect, useId } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Wash } from '@/registry/ndeko/ui/wash';

import { SECTION } from './cta-data';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  resolvedCountOf,
  SCRIPT,
  SEND_MS,
  type CtaState,
} from './cta-session';
import { ANCHORS } from './data';
import { EmailForm } from './email-form';
import { QueueCard } from './queue-card';
import { SectionFrame } from './section-frame';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function spokenLineOf(state: CtaState) {
  if (state.form === 'invalid') {
    return 'Enter an address like name@company.com';
  }
  if (state.form === 'sending') {
    return 'Sending your sign-in link';
  }
  if (state.form === 'sent') {
    return `We sent a sign-in link to ${state.sentTo}`;
  }
  return '';
}

export function Cta() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  const titleId = useId();
  const isSending = state.form === 'sending';
  const resolved = resolvedCountOf(state);
  const message = spokenUnless(isAutoplaying, spokenLineOf(state));
  const canReplay = isFinished && !isAutoplaying;

  useKeptHeight(ref);

  useEffect(() => {
    if (!isSending) {
      return;
    }
    const timer = setTimeout(() => act({ type: 'sent' }), SEND_MS);
    return () => clearTimeout(timer);
  }, [isSending, act]);

  return (
    <SectionFrame id={ANCHORS.start} ref={ref}>
      <div
        aria-labelledby={titleId}
        role='group'
        className='surface-brand relative isolate grid grid-cols-1 gap-8 rounded-2xl p-6 @2xl:p-10 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @3xl:items-center @3xl:gap-12'
      >
        <Wash />
        <div className='flex flex-col gap-6'>
          <div className='flex max-w-xl flex-col gap-2'>
            <h2
              id={titleId}
              className='text-2xl font-semibold text-balance @2xl:text-3xl'
            >
              {SECTION.title}
            </h2>
            <p className='text-muted-foreground text-base text-pretty'>
              {SECTION.description}
            </p>
          </div>
          <EmailForm
            email={state.email}
            form={state.form}
            attempts={state.attempts}
            sentTo={state.sentTo}
            isPressed={pressed === 'submit'}
            onType={(value) => act({ type: 'typed', value })}
            onSubmit={() => act({ type: 'submitted' })}
            onReset={() => act({ type: 'reset' })}
          />
          <div className='flex'>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
          </div>
        </div>
        <QueueCard tasks={state.tasks} resolved={resolved} />
      </div>
      <LiveRegion message={message} />
    </SectionFrame>
  );
}
