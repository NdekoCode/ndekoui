'use client';

import { useCallback } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { conversationOf, CONVERSATIONS, WRITER } from './data';
import { InboxList } from './inbox-list';
import { ReadingPane } from './reading-pane';
import {
  handledCountOf,
  INITIAL,
  LOOP_AFTER_MS,
  nextOpenAfter,
  reducer,
  RESTING,
  SCRIPT,
  SEND_MS,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const TOTAL = CONVERSATIONS.length;

/** A narrow page shows the list until a conversation is opened. A wide one shows both. */
function listVisibilityOf(isReading: boolean) {
  if (isReading) {
    return 'hidden';
  }
  return 'flex';
}

function paneVisibilityOf(isReading: boolean) {
  if (isReading) {
    return 'flex';
  }
  return 'hidden';
}

export default function AiData03() {
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
  const shouldReduceMotion = usePrefersReducedMotion();
  const { selectedId } = state;
  const conversation = conversationOf(selectedId);
  const live = state.live[selectedId];
  const handled = handledCountOf(state);
  const next = nextOpenAfter(state, selectedId);
  const isStreaming = state.streamingId === selectedId && !shouldReduceMotion;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  const focusLater = useCallback(
    (selector: string) => {
      requestAnimationFrame(() => {
        const target = ref.current?.querySelector<HTMLElement>(selector);
        target?.focus();
      });
    },
    [ref]
  );

  /**
   * On a narrow page the list leaves when a conversation opens and takes the pressed row with it:
   * the focus then goes to the heading of the conversation. On a wide page the row keeps it.
   */
  const open = useCallback(
    (id: string) => {
      act({ type: 'opened', id });
      requestAnimationFrame(() => {
        const row = ref.current?.querySelector<HTMLElement>(
          `[data-row="${id}"]`
        );
        const isRowHidden = row?.offsetParent === null;
        if (isRowHidden) {
          focusLater('[data-pane-heading]');
        }
      });
    },
    [act, ref, focusLater]
  );

  function back() {
    act({ type: 'closed' });
    focusLater(`[data-row="${selectedId}"]`);
  }

  function focusWhatComesNext() {
    requestAnimationFrame(() => {
      const root = ref.current;
      const next = root?.querySelector<HTMLElement>('[data-next]');
      const reopen = root?.querySelector<HTMLElement>('[data-reopen]');
      const target = next ?? reopen;
      target?.focus();
    });
  }

  /** Send leaves with the draft once the reply is gone: a focus that sat on it goes to what can be done next. */
  function deliver(id: string) {
    const sendButton = ref.current?.querySelector('[data-send]');
    const hadFocus = sendButton === document.activeElement;
    act({ type: 'delivered', id });
    if (sendButton && hadFocus) {
      focusWhatComesNext();
    }
  }

  function send() {
    act({ type: 'sendPressed', id: selectedId });
    schedule(() => deliver(selectedId), SEND_MS);
  }

  function edit() {
    act({ type: 'editStarted', id: selectedId });
    requestAnimationFrame(() => {
      const field =
        ref.current?.querySelector<HTMLTextAreaElement>('[data-draft-field]');
      if (!field) {
        return;
      }
      const end = field.value.length;
      field.focus();
      field.setSelectionRange(end, end);
    });
  }

  function save() {
    act({ type: 'editSaved', id: selectedId });
    focusLater('[data-edit]');
  }

  function cancel() {
    act({ type: 'editCancelled', id: selectedId });
    focusLater('[data-edit]');
  }

  function reopen() {
    act({ type: 'reopened', id: selectedId });
    focusLater('[data-send]');
  }

  function openNext() {
    if (!next) {
      return;
    }
    act({ type: 'opened', id: next.id });
    focusLater('[data-pane-heading]');
  }

  /** A reply on its way belongs to the round it was sent in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='mx-auto flex max-w-6xl flex-col gap-5 p-4 @3xl:gap-6 @3xl:p-8'>
          <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='text-lg font-semibold text-balance'>Inbox</h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                <span className='flex items-center gap-1.5'>
                  <MeshTile
                    seed={WRITER.name}
                    size='sm'
                    color={seriesColorOf(WRITER.series)}
                  />
                  Sorted and drafted by {WRITER.name}
                </span>
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Replay'
            />
            <p className='flex items-baseline gap-1.5'>
              <MotionNumber
                value={handled}
                className='text-2xl leading-8 font-semibold'
              />
              <span className='text-muted-foreground text-xs tabular-nums'>
                of {TOTAL} handled
              </span>
            </p>
          </header>

          <div className='flex gap-6'>
            <div
              className={cn(
                'w-full @3xl:flex @3xl:w-80 @3xl:shrink-0',
                listVisibilityOf(state.isReading)
              )}
            >
              <InboxList
                live={state.live}
                selectedId={selectedId}
                pressed={pressed}
                onOpen={open}
              />
            </div>
            <div
              className={cn(
                'min-w-0 flex-1 @3xl:sticky @3xl:top-8 @3xl:flex @3xl:self-start',
                paneVisibilityOf(state.isReading)
              )}
            >
              <ReadingPane
                key={selectedId}
                conversation={conversation}
                live={live}
                isStreaming={isStreaming}
                hasNext={next !== null}
                pressed={pressed}
                onBack={back}
                onSend={send}
                onEdit={edit}
                onType={(text) =>
                  act({ type: 'draftTyped', id: selectedId, text })
                }
                onSave={save}
                onCancel={cancel}
                onRegenerate={() =>
                  act({ type: 'regenerated', id: selectedId })
                }
                onReopen={reopen}
                onNext={openNext}
              />
            </div>
          </div>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
