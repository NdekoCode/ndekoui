'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { Conversation, ConversationHeader } from './conversation';
import { CopilotPanel, type CopilotWork } from './copilot-panel';
import { SCRIPTED_TICKET } from './data';
import { InlineSheet } from './inline-sheet';
import { RefundRequest } from './refund-request';
import { ReplyComposer } from './reply-composer';
import {
  INITIAL,
  LOOP_AFTER_MS,
  openOf,
  placementOf,
  reducer,
  REFUND_MS,
  RESTING,
  SCRIPT,
  SEND_MS,
  type Decision,
  type DraftStatus,
  type InboxState,
  type OpenTicket,
  type RefundStatus,
} from './session';
import { TicketList } from './ticket-list';
import { useIsNarrow } from './use-is-narrow';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@4xl` container variant: under it the ticket list lives in a sheet. */
const LIST_SHEET_BELOW_REM = 56;

/** The width of the `@2xl` container variant: under it the copilot lives in a sheet. */
const COPILOT_SHEET_BELOW_REM = 42;

function ticketOfOpen(open: OpenTicket | null) {
  if (!open) {
    return null;
  }
  return open.ticket;
}

/** The copilot follows one ticket: its work, its draft and its refund show on that ticket only. */
function workOf(state: InboxState): CopilotWork | null {
  if (state.openId !== SCRIPTED_TICKET) {
    return null;
  }
  return {
    steps: state.steps,
    lookedUpFields: state.customerFields,
    articlesFound: state.articlesFound,
    refund: state.refund,
  };
}

function draftOf(state: InboxState): DraftStatus {
  if (state.openId !== SCRIPTED_TICKET) {
    return 'none';
  }
  return state.draft;
}

function refundOf(state: InboxState): RefundStatus {
  if (state.openId !== SCRIPTED_TICKET) {
    return 'none';
  }
  return state.refund;
}

/** Nothing calls a network. A real help desk plugs in here: the reply a person sends, and their answer to the refund. */
export type Application11Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application11({
  onSend,
  onApprove,
  onDeny,
}: Application11Props) {
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
  const isCompact = useIsNarrow(ref, LIST_SHEET_BELOW_REM);
  const isPhone = useIsNarrow(ref, COPILOT_SHEET_BELOW_REM);
  const open = openOf(state);
  const work = workOf(state);
  const draft = draftOf(state);
  const refund = refundOf(state);
  const isListShown = isCompact && state.isListOpen;
  const isCopilotShown = isPhone && state.isCopilotOpen;
  const isBehindSheet = isListShown || isCopilotShown;
  const hasRefund = refund !== 'none';
  const showsRefundAboveReply = isPhone && hasRefund;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function focusReplyAtEnd() {
    requestAnimationFrame(() => {
      const field =
        ref.current?.querySelector<HTMLTextAreaElement>('[data-reply-field]');
      if (!field) {
        return;
      }
      const end = field.value.length;
      field.focus();
      field.setSelectionRange(end, end);
    });
  }

  function openTicket(id: string) {
    act({ type: 'opened', id });
    if (isListShown) {
      focusLater('[data-sheet-open="list"]');
    }
  }

  function send() {
    if (!open) {
      return;
    }
    if (open.live.send === 'sending') {
      return;
    }
    const { id } = open;
    const text = open.live.reply.trim();
    act({ type: 'sendPressed' });
    if (text === '') {
      return;
    }
    schedule(() => act({ type: 'delivered', id }), SEND_MS);
    onSend?.(text);
  }

  /** Insert leaves the reply ready to send as it is; Edit puts the caret at its end. */
  function insert() {
    act({ type: 'draftInserted' });
    focusLater('[data-reply-send]');
  }

  function edit() {
    act({ type: 'draftInserted' });
    focusReplyAtEnd();
  }

  function discard() {
    act({ type: 'draftDiscarded' });
    focusLater('[data-draft-restore]');
  }

  function restore() {
    act({ type: 'draftRestored' });
    focusLater('[data-reply-field]');
  }

  /** The two buttons leave with the request, so the focus goes to what replaces them: the line that says what was decided. */
  function decide(decision: Decision) {
    act({ type: 'refundDecided', decision });
    focusLater('[data-request]');
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    schedule(() => act({ type: 'refunded' }), REFUND_MS);
    onApprove?.();
  }

  function openList() {
    act({ type: 'listSheet', isOpen: true });
    focusLater('[data-sheet-close="list"]');
  }

  function closeList() {
    act({ type: 'listSheet', isOpen: false });
    focusLater('[data-sheet-open="list"]');
  }

  function openCopilot() {
    act({ type: 'copilotSheet', isOpen: true });
    focusLater('[data-sheet-close="copilot"]');
  }

  function closeCopilot() {
    act({ type: 'copilotSheet', isOpen: false });
    focusLater('[data-sheet-open="copilot"]');
  }

  const list = {
    live: state.live,
    openId: state.openId,
    placement: placementOf(state),
    pressed,
    onOpen: openTicket,
  };

  const copilot = {
    ticket: ticketOfOpen(open),
    work,
    pressed,
    onDecide: decide,
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-sidebar text-foreground @container min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] overflow-hidden'>
          <div
            inert={isBehindSheet}
            className='flex min-w-0 flex-1 gap-2 @2xl:p-2'
          >
            <aside
              aria-label='Tickets'
              className='hidden w-60 shrink-0 @4xl:flex'
            >
              {!isCompact && <TicketList {...list} />}
            </aside>
            <main className='bg-background @2xl:hairline-ring @2xl:ring-border flex min-w-0 flex-1 flex-col overflow-clip @2xl:rounded-xl @2xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <ConversationHeader
                open={open}
                canReplay={canReplay}
                onReplay={restart}
                onOpenList={openList}
                onOpenCopilot={openCopilot}
              />
              {!open && <Conversation ticket={null} />}
              {open && (
                <Conversation
                  ticket={open.ticket}
                  live={open.live}
                  refund={refund}
                />
              )}
              {open && (
                <div className='mx-auto flex min-h-0 w-full max-w-2xl shrink flex-col gap-2 overflow-y-auto px-3 pt-1 pb-3 @2xl:px-4 @2xl:pb-4'>
                  {showsRefundAboveReply && (
                    <RefundRequest
                      status={refund}
                      pressed={pressed}
                      isCompact
                      onDecide={decide}
                      className='shrink-0'
                    />
                  )}
                  <ReplyComposer
                    live={open.live}
                    draft={draft}
                    showsSendHint={state.showsSendHint}
                    emptySends={state.emptySends}
                    isActive={isInView}
                    isInsertPressed={pressed === 'insert'}
                    isSendPressed={pressed === 'send'}
                    onType={(text) => act({ type: 'replyTyped', text })}
                    onSend={send}
                    onInsert={insert}
                    onEdit={edit}
                    onDiscard={discard}
                    onRestore={restore}
                  />
                </div>
              )}
            </main>
            <aside
              aria-label='Copilot'
              className='hidden w-72 shrink-0 py-1 @2xl:flex @4xl:w-80'
            >
              {!isPhone && (
                <CopilotPanel {...copilot} showsRefund className='w-full' />
              )}
            </aside>
          </div>

          <InlineSheet
            name='list'
            title='Tickets'
            closeLabel='Close the ticket list'
            side='start'
            isOpen={isListShown}
            hiddenFrom='@4xl:hidden'
            onClose={closeList}
          >
            {isCompact && <TicketList {...list} />}
          </InlineSheet>
          <InlineSheet
            name='copilot'
            title='Copilot'
            closeLabel='Close the copilot'
            side='bottom'
            isOpen={isCopilotShown}
            hiddenFrom='@2xl:hidden'
            onClose={closeCopilot}
          >
            {isPhone && (
              <CopilotPanel
                {...copilot}
                showsRefund={false}
                className='min-h-0 flex-1'
              />
            )}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
