'use client';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { AppHeader } from './app-header';
import { Composer } from './composer';
import {
  DECLINED_LINE,
  OPENED_LINE,
  PULL_REQUEST,
  TEST_COUNT,
  type PanelTab,
} from './data';
import {
  INITIAL,
  isOver,
  LOOP_AFTER_MS,
  OPEN_MS,
  reducer,
  RESTING,
  SCRIPT,
  sendableTextOf,
  type CodingState,
  type Decision,
  type PageVersion,
  type Stage,
} from './session';
import { StatusFooter } from './status-footer';
import { Thread } from './thread';
import { WorkPanel } from './work-panel';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the diff, the tests and the preview live in a sheet. */
const SHEET_BELOW_REM = 48;

function placeholderOf(stage: Stage) {
  if (stage === 'idle') {
    return 'Describe a bug to fix';
  }
  if (stage === 'asking') {
    return 'Allow or deny the request above';
  }
  if (isOver(stage)) {
    return 'Ask for something else';
  }
  return 'Coder is working';
}

/** One line for each change a person cannot see at a glance: the two test results, the request and its outcome. */
function announcementOf(state: CodingState) {
  if (state.stage === 'asking') {
    return `Coder asks to open the pull request ${PULL_REQUEST.title}. Allow or deny it`;
  }
  if (state.stage === 'opened') {
    return OPENED_LINE;
  }
  if (state.stage === 'declined') {
    return DECLINED_LINE;
  }
  if (state.testRun === 'passed') {
    return `All ${TEST_COUNT} tests pass`;
  }
  if (state.testRun === 'failed') {
    return `1 of ${TEST_COUNT} tests fails: the bug is reproduced`;
  }
  return '';
}

/** Nothing calls a network. A real agent plugs in here: the task a person sends, and their answer to the pull request. */
export type Application12Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application12({
  onSend,
  onApprove,
  onDeny,
}: Application12Props) {
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
  const announcement = announcementOf(state);
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

  /** The two buttons leave with the request, so the focus goes to what replaces them: the line that says what was decided. */
  function decide(decision: Decision) {
    act({ type: 'decided', decision });
    focusLater('[data-request]');
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    schedule(() => act({ type: 'opened' }), OPEN_MS);
    onApprove?.();
  }

  function openSheet() {
    act({ type: 'sheet', isOpen: true });
    focusLater('[data-sheet-close="work"]');
  }

  function closeSheet() {
    act({ type: 'sheet', isOpen: false });
    focusLater('[data-work-open]');
  }

  function pickTab(tab: PanelTab) {
    act({ type: 'tabPicked', tab });
  }

  /** A step of the thread points at its tab. On a narrow page that tab is in the sheet, which opens with it. */
  function showTab(tab: PanelTab) {
    pickTab(tab);
    if (isNarrow) {
      openSheet();
    }
  }

  const panel = {
    tab: state.tab,
    hunksStarted: state.hunksStarted,
    hunksDone: state.hunksDone,
    testRun: state.testRun,
    pageVersion: state.preview,
    isActive: isInView,
    onTabChange: pickTab,
    onPageVersionChange: (view: PageVersion) =>
      act({ type: 'previewed', view }),
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
              state={state}
              canReplay={canReplay}
              onReplay={restart}
              onOpenWork={openSheet}
            />
            <div className='flex min-h-0 flex-1'>
              <main className='flex min-w-0 flex-1 flex-col @3xl:w-[24rem] @3xl:flex-none @4xl:w-[27rem]'>
                <Thread
                  state={state}
                  pressed={pressed}
                  isActive={isInView}
                  onShow={showTab}
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
                aria-label='Diff, tests and preview'
                className='hidden min-w-0 flex-1 pe-3 pb-3 @3xl:flex'
              >
                <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-h-0 min-w-0 flex-1 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
                  {!isNarrow && <WorkPanel {...panel} className='w-full' />}
                </div>
              </aside>
            </div>
            <StatusFooter tokens={state.tokens} costUsd={state.costUsd} />
          </div>

          <InlineSheet
            name='work'
            label='Work of the agent'
            closeLabel='Close the work panel'
            side='bottom'
            closer='grip'
            isOpen={isSheetShown}
            className='@3xl:hidden'
            panelClassName='h-[80%] px-4 pb-4'
            onClose={closeSheet}
          >
            {isNarrow && <WorkPanel {...panel} className='flex-1' />}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
