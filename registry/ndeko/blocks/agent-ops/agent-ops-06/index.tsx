'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { cn } from '@/registry/ndeko/lib/utils';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { EndpointDetail } from './endpoint-detail';
import { EndpointList, HEALTH_WORD, shortUrlOf } from './endpoint-list';
import {
  endpointOf,
  healthOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  RETRY_MS,
  SCRIPT,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** On a phone one view shows at a time; a wide block always shows both. */
function listVisibilityOf(isDetailOpen: boolean) {
  if (isDetailOpen) {
    return 'hidden';
  }
  return 'block';
}

function detailVisibilityOf(isDetailOpen: boolean) {
  if (isDetailOpen) {
    return 'block';
  }
  return 'hidden';
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

export default function AgentOps06() {
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
  const { schedule } = useTimeouts();
  const endpoint = endpointOf(state, state.selectedId);
  const health = healthOf(state, endpoint.id);
  const announcement = `${shortUrlOf(endpoint.url)}: ${HEALTH_WORD[health]}`;
  const message = spokenUnless(isAutoplaying, announcement);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function select(id: string) {
    act({ type: 'selected', id });
    focusLater('[data-back]');
  }

  function back() {
    act({ type: 'back' });
    focusLater(`[data-endpoint="${state.selectedId}"]`);
  }

  function retry(id: string) {
    act({ type: 'retry', id });
    schedule(() => act({ type: 'retried', id }), RETRY_MS);
  }

  function openForm() {
    act({ type: 'formOpened' });
    focusLater('[data-form-first]');
  }

  function closeForm() {
    act({ type: 'formClosed' });
    focusLater('[data-add-endpoint]');
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:p-8 @4xl:flex-row @4xl:items-start @4xl:gap-6'>
          <div
            className={cn(
              'transition-opacity duration-200 @4xl:block @4xl:w-[24rem] @4xl:shrink-0 starting:opacity-0',
              listVisibilityOf(state.isDetailOpen)
            )}
          >
            <EndpointList
              state={state}
              pressed={pressed}
              onAction={act}
              onSelect={select}
              onOpenForm={openForm}
              onCloseForm={closeForm}
            />
            <div className='flex h-9 items-end'>
              <ReplayButton
                isShown={canReplay}
                onReplay={restart}
                label='Replay the retry'
              />
            </div>
          </div>
          <div
            className={cn(
              'min-w-0 flex-1 @4xl:block',
              detailVisibilityOf(state.isDetailOpen)
            )}
          >
            <EndpointDetail
              endpoint={endpoint}
              state={state}
              pressed={pressed}
              onAction={act}
              onBack={back}
              onRetry={retry}
            />
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
