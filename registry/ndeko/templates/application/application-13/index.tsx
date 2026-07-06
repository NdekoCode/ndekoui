'use client';

import { useRef } from 'react';

import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { MenuIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { BRAND, type Attachment } from './data';
import { GlyphField } from './glyph-field';
import { PromptBox } from './prompt-box';
import { RecentRuns } from './recent-runs';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  RUN_MS,
  SCRIPT,
  sentRunIdOf,
  START_MS,
  type Decision,
} from './session';
import { SessionSidebar } from './session-sidebar';
import { Suggestions } from './suggestions';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The width of the `@3xl` container variant: under it the recent sessions live in a sheet. */
const SHEET_BELOW_REM = 48;

/**
 * Nothing calls a network. A real agent plugs in here: the prompt a person starts a session with,
 * and their answer to a run that waits on them.
 */
export type Application13Props = {
  onSend?: (text: string) => void;
  onApprove?: () => void;
  onDeny?: () => void;
};

export default function Application13({
  onSend,
  onApprove,
  onDeny,
}: Application13Props) {
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
  const fieldHostRef = useRef<HTMLElement>(null);
  const isNarrow = useIsNarrow(ref, SHEET_BELOW_REM);
  const isSidebarShown = isNarrow && state.isSidebarOpen;
  const canReplay = isFinished && !isAutoplaying;
  const message = spokenUnless(isAutoplaying, state.spoken);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function focusPromptAtEnd() {
    requestAnimationFrame(() => {
      const field = ref.current?.querySelector<HTMLTextAreaElement>(
        '[data-prompt-field]'
      );
      if (!field) {
        return;
      }
      const end = field.value.length;
      field.focus();
      field.setSelectionRange(end, end);
    });
  }

  /** The run of a sent prompt starts, then ends: a backend would send these two events itself. */
  function send() {
    const text = state.draft.trim();
    act({ type: 'sent' });
    if (text === '') {
      return;
    }
    const sentCount = state.sentCount + 1;
    const id = sentRunIdOf(sentCount);
    const endsAfter = START_MS + RUN_MS;
    schedule(() => act({ type: 'runStarted', id }), START_MS);
    schedule(() => act({ type: 'runFinished', id }), endsAfter);
    onSend?.(text);
  }

  function closeSidebar() {
    act({ type: 'sidebar', isOpen: false });
    focusLater('[data-sidebar-open]');
  }

  function openSidebar() {
    act({ type: 'sidebar', isOpen: true });
    focusLater('[data-sheet-close="sessions"]');
  }

  function fillPrompt(prompt: string) {
    act({ type: 'picked', prompt });
    if (isSidebarShown) {
      act({ type: 'sidebar', isOpen: false });
    }
    focusPromptAtEnd();
  }

  function startNewSession() {
    fillPrompt('');
  }

  /** The two buttons leave the row, so the focus goes to the row, which now says what was decided. */
  function decide(id: string, decision: Decision) {
    act({ type: 'decided', id, decision });
    focusLater(`[data-run="${id}"]`);
    if (decision === 'denied') {
      onDeny?.();
      return;
    }
    schedule(() => act({ type: 'runStarted', id }), START_MS);
    onApprove?.();
  }

  const sidebar = {
    sessions: state.sessions,
    onNewSession: startNewSession,
    onAskAgain: fillPrompt,
  };

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-sidebar text-foreground @container min-h-dvh w-full'
      >
        <div className='relative flex h-dvh min-h-[40rem] overflow-hidden'>
          <div inert={isSidebarShown} className='flex min-w-0 flex-1 @3xl:p-2'>
            <aside
              aria-label='Sessions'
              className='hidden w-60 shrink-0 pe-2 @3xl:flex'
            >
              {!isNarrow && <SessionSidebar {...sidebar} />}
            </aside>
            <main
              ref={fieldHostRef}
              className='bg-background @3xl:hairline-ring @3xl:ring-border relative flex min-w-0 flex-1 flex-col overflow-hidden @3xl:rounded-xl @3xl:shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
            >
              <GlyphField
                hostRef={fieldHostRef}
                isActive={isInView}
                demoLens={state.demoLens}
                demoRipples={state.demoRipples}
              />
              <div className='relative flex min-h-0 flex-1 flex-col overflow-y-auto'>
                <div className='flex h-12 shrink-0 items-center gap-2 px-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    data-sidebar-open
                    aria-label='Open the recent sessions'
                    aria-haspopup='dialog'
                    onClick={openSidebar}
                    className='text-muted-foreground @3xl:hidden'
                  >
                    <MenuIcon />
                  </Button>
                  <span className='text-[13px] font-semibold @3xl:hidden'>
                    {BRAND.name}
                  </span>
                  <span className='ms-auto'>
                    <ReplayButton
                      isShown={canReplay}
                      onReplay={restart}
                      label='Replay'
                    />
                  </span>
                </div>
                <div className='mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pt-4 pb-10 @3xl:pt-8'>
                  <header className='flex flex-col gap-1.5'>
                    <h1 className='text-xl font-semibold text-balance @md:text-2xl'>
                      Start a session
                    </h1>
                    <p className='text-muted-foreground text-sm text-balance'>
                      Say what you need, attach what it takes and choose how far
                      the agent may go on its own
                    </p>
                  </header>
                  <div className='flex flex-col gap-3'>
                    <PromptBox
                      draft={state.draft}
                      attachments={state.attachments}
                      model={state.model}
                      mode={state.mode}
                      hint={state.hint}
                      refusals={state.refusals}
                      pressed={pressed}
                      onType={(text) => act({ type: 'typed', text })}
                      onSend={send}
                      onAttach={(attachments: Attachment[]) =>
                        act({ type: 'attached', attachments })
                      }
                      onDetach={(id) => act({ type: 'detached', id })}
                      onModelChange={(model) =>
                        act({ type: 'modelSet', model })
                      }
                      onModeChange={(mode) => act({ type: 'modeSet', mode })}
                    />
                    <Suggestions
                      draft={state.draft}
                      pressed={pressed}
                      onPick={fillPrompt}
                    />
                  </div>
                  <RecentRuns
                    runs={state.runs}
                    pressed={pressed}
                    onDecide={decide}
                  />
                </div>
              </div>
            </main>
          </div>

          <InlineSheet
            name='sessions'
            label='Recent sessions'
            closeLabel='Close the recent sessions'
            side='start'
            isOpen={isSidebarShown}
            className='@3xl:hidden'
            panelClassName='bg-sidebar gap-1 p-3'
            onClose={closeSidebar}
          >
            {isNarrow && <SessionSidebar {...sidebar} />}
          </InlineSheet>
          <LiveRegion message={message} />
        </div>
      </div>
    </ClockGate>
  );
}
