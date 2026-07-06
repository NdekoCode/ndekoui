'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AppHeader } from './app-header';
import { Composer } from './composer';
import { KEPT_LINE, RECEIVERS, seedOf, SHARED_LINE } from './data';
import { MemoPanel } from './memo-panel';
import { MemoSheet } from './memo-sheet';
import {
  INITIAL,
  isOver,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  sendableTextOf,
  SHARE_MS,
  type Decision,
  type ResearchState,
  type Stage,
} from './session';
import { peopleOf } from './share-request';
import { Thread } from './thread';
import { useIsNarrow } from './use-is-narrow';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the memo lives in a sheet. */
const SHEET_BELOW_REM = 48;

function placeholderOf(stage: Stage) {
  if (stage === 'idle') {
    return 'Ask a question about your workspace';
  }
  if (stage === 'asking') {
    return 'Allow or deny the request above';
  }
  if (isOver(stage)) {
    return 'Ask a follow-up';
  }
  return 'Researcher is working';
}

function announcementOf(stage: Stage) {
  if (stage === 'researching') {
    return 'Researcher is reading the workspace';
  }
  if (stage === 'answered') {
    return 'The answer and the memo are ready';
  }
  if (stage === 'asking') {
    const people = peopleOf(RECEIVERS.length);
    return `Researcher asks to share the memo with ${people}. Allow or deny it`;
  }
  if (stage === 'shared') {
    return SHARED_LINE;
  }
  if (stage === 'kept') {
    return KEPT_LINE;
  }
  return '';
}

function stepInProgressOf(state: ResearchState) {
  const running = state.activity.find((run) => run.status === 'running');
  if (!running) {
    return null;
  }
  const seed = seedOf(running.id);
  return seed.title;
}

/** Nothing calls a network. A real agent plugs in here: what a person sends, and their answer to the request to share. */
export type Application10Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application10({
  onSend,
  onApprove,
  onDeny,
}: Application10Props) {
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
  const isNarrow = useIsNarrow(ref, SHEET_BELOW_REM);
  const { stage } = state;
  const sendableText = sendableTextOf(state);
  const canSend = sendableText !== null;
  const canReplay = isFinished && !isAutoplaying;
  const isSheetShown = isNarrow && state.isSheetOpen;
  const isMemoBeingWritten = state.sectionsStarted > state.sectionsDone;
  const announcement = announcementOf(stage);
  const message = spokenUnless(isAutoplaying, announcement);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function send() {
    if (sendableText === null) {
      return;
    }
    act({ type: 'sent' });
    onSend?.(sendableText);
  }

  function decide(decision: Decision) {
    act({ type: 'decided', decision });
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    schedule(() => act({ type: 'shared' }), SHARE_MS);
    onApprove?.();
  }

  function openSheet() {
    act({ type: 'sheet', isOpen: true });
    focusLater('[data-memo-sheet-grip]');
  }

  function closeSheet() {
    act({ type: 'sheet', isOpen: false });
    focusLater('[data-memo-open]');
  }

  const memo = {
    stage,
    sectionsStarted: state.sectionsStarted,
    sectionsDone: state.sectionsDone,
    foldedSections: state.foldedSections,
    pressed,
    isActive: isInView,
    onToggleSection: (id: string) => act({ type: 'sectionToggled', id }),
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] flex-col overflow-hidden'>
          <div inert={isSheetShown} className='flex min-h-0 flex-1 flex-col'>
            <AppHeader
              stage={stage}
              costUsd={state.costUsd}
              isMemoBeingWritten={isMemoBeingWritten}
              canReplay={canReplay}
              onReplay={restart}
              onOpenMemo={openSheet}
            />
            <div className='flex min-h-0 flex-1'>
              <main className='flex min-w-0 flex-1 flex-col'>
                <Thread
                  state={state}
                  pressed={pressed}
                  isActive={isInView}
                  onDecide={decide}
                />
                <div className='mx-auto w-full max-w-2xl shrink-0 px-4 pb-4'>
                  <Composer
                    draft={state.draft}
                    placeholder={placeholderOf(stage)}
                    canSend={canSend}
                    isSendPressed={pressed === 'send'}
                    onDraftChange={(text) => act({ type: 'typed', text })}
                    onSend={send}
                  />
                </div>
              </main>
              <aside
                aria-label='Memo'
                className='hidden w-[22rem] shrink-0 pe-3 pb-3 @3xl:flex @4xl:w-[26rem]'
              >
                <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-h-0 flex-1 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                  {!isNarrow && (
                    <MemoPanel
                      {...memo}
                      stepInProgress={null}
                      className='w-full'
                    />
                  )}
                </div>
              </aside>
            </div>
          </div>

          <MemoSheet isOpen={isSheetShown} onClose={closeSheet}>
            {/* The thread is out of sight under the sheet, so the sheet says which step is running. */}
            {isNarrow && (
              <MemoPanel
                {...memo}
                stepInProgress={stepInProgressOf(state)}
                className='flex-1'
              />
            )}
          </MemoSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
