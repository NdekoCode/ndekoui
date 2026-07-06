'use client';

import type { CSSProperties } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { countOf } from '@/registry/ndeko/lib/words';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AppSidebar, rowsOf } from './app-sidebar';
import { ChatHeader } from './chat-header';
import { Composer } from './composer';
import {
  BRAND,
  chatOf,
  DECLINED_LINE,
  LIVE_ID,
  LIVE_TITLE,
  NEW_CHAT_TITLE,
  NEW_ID,
  SOURCES,
  STOPPED_LINE,
} from './data';
import { RunDetails } from './run-details';
import {
  INITIAL,
  isBusy,
  isOver,
  isReadOnly,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  sendableTextOf,
  type ChatState,
  type Decision,
} from './session';
import { Thread } from './thread';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the chats live in a sheet. */
const SIDEBAR_SHEET_BELOW_REM = 48;

/** The width of the `@6xl` container variant: under it the run details live in a sheet. */
const DETAILS_SHEET_BELOW_REM = 72;

const SIDEBAR_WIDTH = '16rem';

const PANEL_WIDTH = '21rem';

type LayoutStyle = CSSProperties & {
  '--sidebar-w': string;
  '--panel-w': string;
};

function widthOf(isShown: boolean, width: string) {
  if (isShown) {
    return width;
  }
  return '0rem';
}

function layoutStyleOf(isSidebarShown: boolean, isPanelShown: boolean) {
  const style: LayoutStyle = {
    '--sidebar-w': widthOf(isSidebarShown, SIDEBAR_WIDTH),
    '--panel-w': widthOf(isPanelShown, PANEL_WIDTH),
  };
  return style;
}

function titleOf(state: ChatState) {
  if (state.activeId === LIVE_ID) {
    if (state.question === null) {
      return NEW_CHAT_TITLE;
    }
    return LIVE_TITLE;
  }
  if (state.activeId === NEW_ID) {
    return NEW_CHAT_TITLE;
  }
  return chatOf(state.activeId).title;
}

function placeholderOf(state: ChatState) {
  if (isReadOnly(state)) {
    return 'Start a new chat to write';
  }
  if (state.activeId === NEW_ID) {
    return 'Message Quenby';
  }
  const { stage } = state;
  if (stage === 'idle') {
    return 'Ask about a shipment';
  }
  if (stage === 'asking') {
    return 'Allow or deny the request above';
  }
  if (isOver(stage)) {
    return 'Ask a follow-up';
  }
  return 'Quenby is working';
}

function announcementOf(state: ChatState) {
  const { stage } = state;
  if (stage === 'thinking') {
    return 'Quenby is thinking';
  }
  if (stage === 'asking') {
    return 'Quenby asks to read the forwarder rate sheet. Allow or deny it';
  }
  if (stage === 'answering') {
    return 'Quenby is writing the answer';
  }
  if (stage === 'done') {
    return `The answer is ready, with ${countOf(SOURCES.length, 'source')}`;
  }
  if (stage === 'declined') {
    return DECLINED_LINE;
  }
  if (stage === 'stopped') {
    return STOPPED_LINE;
  }
  return '';
}

function emptyLineOf(state: ChatState) {
  if (state.activeId === LIVE_ID) {
    return 'The plan, the tool calls and the cost of the run show here once you ask a question.';
  }
  return 'Nothing runs in this chat. The details of a run show here when the assistant works.';
}

/** Nothing calls a network. A real assistant plugs in here: what a person sends, the answer to the request, and Stop. */
export type Application08Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
  onStop?: () => void;
};

export default function Application08({
  onSend,
  onApprove,
  onDeny,
  onStop,
}: Application08Props) {
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
  const hasSidebarSheet = useIsNarrow(ref, SIDEBAR_SHEET_BELOW_REM);
  const hasDetailsSheet = useIsNarrow(ref, DETAILS_SHEET_BELOW_REM);
  const { stage } = state;
  const isLiveChat = state.activeId === LIVE_ID;
  const hasRun = isLiveChat && state.question !== null;
  const sendableText = sendableTextOf(state);
  const canSend = sendableText !== null;
  const showsStop = isLiveChat && isBusy(stage);
  const canReplay = isFinished && !isAutoplaying;
  const isSidebarSheetShown = hasSidebarSheet && state.isSidebarSheetOpen;
  const isDetailsSheetShown = hasDetailsSheet && state.isDetailsSheetOpen;
  const isBehindSheet = isSidebarSheetShown || isDetailsSheetShown;
  const isSidebarShown = !state.isSidebarCollapsed;
  const isPanelShown = state.isPanelOpen && !hasDetailsSheet;
  const message = spokenUnless(isAutoplaying, announcementOf(state));
  const layoutStyle = layoutStyleOf(isSidebarShown, isPanelShown);
  const canShowDetails = hasDetailsSheet || !isPanelShown;

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

  function stop() {
    act({ type: 'stopped' });
    onStop?.();
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

  function toggleSidebar() {
    if (hasSidebarSheet) {
      act({ type: 'sidebarSheet', isOpen: true });
      focusLater('[data-sheet-close="chats"]');
      return;
    }
    act({ type: 'sidebarCollapsed', isCollapsed: !state.isSidebarCollapsed });
  }

  function closeSidebarSheet() {
    act({ type: 'sidebarSheet', isOpen: false });
    focusLater('[data-sidebar-toggle]');
  }

  function openDetailsSheet() {
    act({ type: 'detailsSheet', isOpen: true });
    focusLater('[data-sheet-close="details"]');
  }

  function closeDetailsSheet() {
    act({ type: 'detailsSheet', isOpen: false });
    focusLater('[data-details-toggle]');
  }

  function toggleDetails() {
    if (hasDetailsSheet) {
      openDetailsSheet();
      return;
    }
    act({ type: 'panel', isOpen: !state.isPanelOpen });
  }

  function showDetails() {
    if (hasDetailsSheet) {
      openDetailsSheet();
      return;
    }
    act({ type: 'panel', isOpen: true });
  }

  function openChat(id: string) {
    act({ type: 'chatOpened', id });
    focusLater('[data-composer-field]');
  }

  function startNewChat() {
    act({ type: 'newChat' });
    focusLater('[data-composer-field]');
  }

  function suggest(text: string) {
    act({ type: 'typed', text });
    focusLater('[data-composer-field]');
  }

  const sidebar = {
    rows: rowsOf(state),
    activeId: state.activeId,
    search: state.search,
    onSearch: (text: string) => act({ type: 'searched', text }),
    onOpen: openChat,
    onNewChat: startNewChat,
  };

  const details = {
    stage,
    plan: state.plan,
    calls: state.calls,
    tokens: state.tokens,
    costUsd: state.costUsd,
    runModel: state.runModel,
    hasRun,
    emptyLine: emptyLineOf(state),
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
            style={layoutStyle}
            className='grid min-h-0 min-w-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-(--ease-drawer) @3xl:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] @3xl:p-2 @6xl:grid-cols-[var(--sidebar-w)_minmax(0,1fr)_var(--panel-w)]'
          >
            <aside
              aria-label='Chats'
              inert={state.isSidebarCollapsed}
              className='hidden min-h-0 min-w-0 overflow-hidden @3xl:block'
            >
              <div className='h-full w-64 pe-2'>
                {!hasSidebarSheet && <AppSidebar {...sidebar} />}
              </div>
            </aside>
            <main className='bg-background @3xl:hairline-ring @3xl:ring-border flex min-h-0 min-w-0 flex-col overflow-clip @3xl:rounded-xl @3xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
              <ChatHeader
                title={titleOf(state)}
                stage={stage}
                model={state.model}
                hasSidebarSheet={hasSidebarSheet}
                hasDetailsSheet={hasDetailsSheet}
                isSidebarShown={isSidebarShown}
                isDetailsShown={isPanelShown}
                canReplay={canReplay}
                onToggleSidebar={toggleSidebar}
                onToggleDetails={toggleDetails}
                onModelChange={(model) => act({ type: 'modelSet', model })}
                onReplay={restart}
              />
              <Thread
                state={state}
                pressed={pressed}
                isActive={isInView}
                onDecide={decide}
                canShowDetails={canShowDetails}
                onShowDetails={showDetails}
                onSuggest={suggest}
              />
              <div className='mx-auto w-full max-w-2xl shrink-0 px-4 pb-4'>
                <Composer
                  draft={state.draft}
                  placeholder={placeholderOf(state)}
                  canSend={canSend}
                  isRunning={showsStop}
                  isReadOnly={isReadOnly(state)}
                  isSendPressed={pressed === 'send'}
                  onDraftChange={(text) => act({ type: 'typed', text })}
                  onSend={send}
                  onStop={stop}
                />
              </div>
            </main>
            <aside
              aria-label='Run details'
              inert={!state.isPanelOpen}
              className='hidden min-h-0 min-w-0 overflow-hidden @6xl:block'
            >
              <div className='h-full w-[21rem] ps-2'>
                <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex h-full min-h-0 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                  {!hasDetailsSheet && (
                    <RunDetails {...details} className='w-full' />
                  )}
                </div>
              </div>
            </aside>
          </div>

          <InlineSheet
            name='chats'
            label={`${BRAND.name} chats`}
            closeLabel='Close the chats'
            side='start'
            isOpen={isSidebarSheetShown}
            className='@3xl:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closeSidebarSheet}
          >
            {hasSidebarSheet && <AppSidebar {...sidebar} />}
          </InlineSheet>
          <InlineSheet
            name='details'
            label='Run details'
            closeLabel='Close the run details'
            side='bottom'
            closer='grip'
            isOpen={isDetailsSheetShown}
            className='@6xl:hidden'
            panelClassName='h-[80%] px-4 pb-4'
            onClose={closeDetailsSheet}
          >
            {hasDetailsSheet && <RunDetails {...details} className='flex-1' />}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
