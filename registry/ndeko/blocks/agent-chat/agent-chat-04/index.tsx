'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CallPanel, discModeOf } from './call-panel';
import { CALL_TITLE, NOTES, TODOS, TRANSCRIPT } from './data';
import { NotesPage } from './notes-page';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  SHARE_MS,
  type CallStatus,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function announcementOf(status: CallStatus, latestTodo: string | undefined) {
  if (status === 'ended') {
    return 'Call ended. The page is now a summary you can copy or share.';
  }
  if (latestTodo) {
    return `To-do added: ${latestTodo}`;
  }
  return '';
}

function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}

export default function AgentChat04() {
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const { schedule } = useTimeouts();
  const lines = TRANSCRIPT.slice(0, state.linesShown);
  const notes = NOTES.slice(0, state.notesShown);
  const todos = TODOS.slice(0, state.todosShown);
  const latestLine = lines.at(-1);
  const speaker = latestLine?.speaker ?? null;
  const mode = discModeOf(state.status, state.isMuted, speaker);
  const isEnded = state.status === 'ended';
  const latestTodo = todos.at(-1)?.text;
  const announcement = announcementOf(state.status, latestTodo);
  const message = spokenUnless(isAutoplaying, announcement);
  const canCallAgain = isEnded && !isAutoplaying;

  function share() {
    act({ type: 'sharing' });
    schedule(() => act({ type: 'shared' }), SHARE_MS);
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container min-h-dvh w-full p-3 @3xl:p-6'
      >
        <div className='mx-auto flex max-w-5xl flex-col gap-3 @3xl:flex-row @3xl:items-start'>
          <div className='@3xl:w-80 @3xl:shrink-0'>
            <CallPanel
              title={CALL_TITLE}
              status={state.status}
              mode={mode}
              isMuted={state.isMuted}
              lines={lines}
              startedAt={state.startedAt}
              endedAt={state.endedAt}
              isActive={isInView}
              pressed={pressed}
              onToggleMute={() => act({ type: 'muted' })}
              onEnd={() => act({ type: 'ended' })}
              footer={
                <ReplayButton
                  isShown={canCallAgain}
                  onReplay={restart}
                  label='Call again'
                />
              }
            />
          </div>
          <NotesPage
            title={CALL_TITLE}
            notes={notes}
            todos={todos}
            doneBy={state.doneBy}
            isEnded={isEnded}
            share={state.share}
            onToggleTodo={(id) => act({ type: 'toggled', id })}
            onShare={share}
          />
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
