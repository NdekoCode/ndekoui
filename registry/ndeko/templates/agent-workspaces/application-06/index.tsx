'use client';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { Composer, ReadOnlyNote } from './composer';
import {
  BRAND,
  DECLINED_LINE,
  LIVE_ID,
  LIVE_TITLE,
  NEW_ID,
  NEW_SESSION_TITLE,
  pastSessionOf,
  UNPAID_TOTAL,
  type Attachment,
} from './data';
import {
  INITIAL,
  isBusy,
  isReadOnly,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  sendableTextOf,
  type Decision,
  type WorkspaceState,
} from './session';
import { SessionHeader, statusWordOf } from './session-header';
import { rowsOf, SessionsSidebar } from './sessions-sidebar';
import { Thread } from './thread';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the sessions live in a sheet. */
const SHEET_BELOW_REM = 48;

function titleOf(state: WorkspaceState) {
  if (state.activeId === LIVE_ID) {
    if (state.turns.length === 0) {
      return NEW_SESSION_TITLE;
    }
    return LIVE_TITLE;
  }
  if (state.activeId === NEW_ID) {
    return NEW_SESSION_TITLE;
  }
  return pastSessionOf(state.activeId).title;
}

function placeholderOf(state: WorkspaceState) {
  const last = state.turns.at(-1);
  if (state.activeId === NEW_ID || !last) {
    return 'Describe the work';
  }
  if (last.stage === 'asking') {
    return 'Allow or deny the request above, or queue a follow-up';
  }
  if (isBusy(state)) {
    return 'Write a follow-up. It waits until the agent is done';
  }
  return 'Ask for something else';
}

function announcementOf(state: WorkspaceState) {
  const last = state.turns.at(-1);
  if (!last) {
    return '';
  }
  if (last.stage === 'asking') {
    return `Operator asks to send ${UNPAID_TOTAL.count} reminders on WhatsApp. Allow or deny it`;
  }
  if (last.stage === 'declined') {
    return DECLINED_LINE;
  }
  if (last.stage === 'done') {
    return 'Operator is done';
  }
  return '';
}

/**
 * Nothing calls a network. A real agent plugs in here: each message a person sends (also one that
 * waits in the queue), and their answer to a request that waits on them.
 */
export type Application06Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application06({
  onSend,
  onApprove,
  onDeny,
}: Application06Props) {
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
  const hasSheet = useIsNarrow(ref, SHEET_BELOW_REM);
  const last = state.turns.at(-1);
  const sendableText = sendableTextOf(state);
  const canSend = sendableText !== null;
  const canReplay = isFinished && !isAutoplaying;
  const isSheetShown = hasSheet && state.isSidebarOpen;
  const message = spokenUnless(isAutoplaying, announcementOf(state));

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

  /** The two buttons leave with the request, so the focus goes to what replaces them: the line that says what was decided. */
  function decide(decision: Decision) {
    act({ type: 'decided', decision });
    focusLater('[data-request]');
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    onApprove?.();
  }

  function openSessions() {
    act({ type: 'sidebar', isOpen: true });
    focusLater('[data-sheet-close="sessions"]');
  }

  function closeSessions() {
    act({ type: 'sidebar', isOpen: false });
    focusLater('[data-sidebar-open]');
  }

  function openSession(id: string) {
    act({ type: 'sessionOpened', id });
    focusLater('[data-composer-field]');
  }

  function startNewSession() {
    act({ type: 'newSession' });
    focusLater('[data-composer-field]');
  }

  const sidebar = {
    rows: rowsOf(state),
    activeId: state.activeId,
    search: state.search,
    onSearch: (text: string) => act({ type: 'searched', text }),
    onOpen: openSession,
    onNewSession: startNewSession,
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-sidebar text-foreground @container min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] overflow-hidden'>
          <div inert={isSheetShown} className='flex min-w-0 flex-1 @3xl:p-2'>
            <aside
              aria-label='Sessions'
              className='hidden w-64 shrink-0 pe-2 @3xl:flex'
            >
              {!hasSheet && <SessionsSidebar {...sidebar} />}
            </aside>
            <main className='bg-background @3xl:hairline-ring @3xl:ring-border flex min-w-0 flex-1 flex-col overflow-clip @3xl:rounded-xl @3xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <SessionHeader
                title={titleOf(state)}
                turn={last}
                statusWord={statusWordOf(last)}
                costUsd={state.costUsd}
                hasSheet={hasSheet}
                canReplay={canReplay}
                onReplay={restart}
                onOpenSessions={openSessions}
              />
              <Thread
                state={state}
                pressed={pressed}
                isActive={isInView}
                onDecide={decide}
              />
              <div className='mx-auto w-full max-w-2xl shrink-0 px-4 pb-4'>
                {isReadOnly(state) && (
                  <ReadOnlyNote onNewSession={startNewSession} />
                )}
                {!isReadOnly(state) && (
                  <Composer
                    draft={state.draft}
                    placeholder={placeholderOf(state)}
                    canSend={canSend}
                    isBusy={isBusy(state)}
                    attachments={state.attachments}
                    toolIds={state.toolIds}
                    skillIds={state.skillIds}
                    effort={state.effort}
                    queue={state.queue}
                    hint={state.hint}
                    refusals={state.refusals}
                    pressed={pressed}
                    onDraftChange={(text) => act({ type: 'typed', text })}
                    onSend={send}
                    onAttach={(attachments: Attachment[]) =>
                      act({ type: 'attached', attachments })
                    }
                    onDetach={(id) => act({ type: 'detached', id })}
                    onToggleTool={(id) => act({ type: 'toolToggled', id })}
                    onToggleSkill={(id) => act({ type: 'skillToggled', id })}
                    onEffortChange={(effort) =>
                      act({ type: 'effortSet', effort })
                    }
                    onRemoveQueued={(id) => act({ type: 'queueRemoved', id })}
                  />
                )}
              </div>
            </main>
          </div>

          <InlineSheet
            name='sessions'
            label={`${BRAND.name} sessions`}
            closeLabel='Close the sessions'
            side='start'
            isOpen={isSheetShown}
            className='@3xl:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closeSessions}
          >
            {hasSheet && <SessionsSidebar {...sidebar} />}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
