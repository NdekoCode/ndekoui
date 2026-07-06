'use client';

import { useCallback } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  indexOfPhase,
  modelOf,
  PHASES,
  toolOf,
  WORKSPACE,
  type ModelId,
  type PhaseId,
  type ToolId,
} from './data';
import { FirstRun } from './first-run';
import { AgentStep, TeamStep, ToolsStep } from './phase-forms';
import { PhaseRow, type PhaseStatus } from './phase-row';
import { isRunDone, type Run } from './run';
import {
  CONNECT_MS,
  connectedToolsOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  TOTAL,
  type TextField,
  type WorkspaceAction,
  type WorkspaceState,
} from './session';
import { useRunClock } from './use-run-clock';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const LAST_INDEX = PHASES.length - 1;

function phaseStatusOf(index: number, currentIndex: number): PhaseStatus {
  if (index < currentIndex) {
    return 'done';
  }
  if (index === currentIndex) {
    return 'current';
  }
  return 'upcoming';
}

function hasRunEnded(run: Run | null) {
  if (!run) {
    return false;
  }
  return isRunDone(run);
}

function markerOf(status: PhaseStatus, isOver: boolean): PhaseStatus {
  if (isOver) {
    return 'done';
  }
  return status;
}

function doneCountOf(currentIndex: number, isLastStepOver: boolean) {
  if (isLastStepOver) {
    return currentIndex + 1;
  }
  return currentIndex;
}

function bodyIf(isCurrent: boolean, body: React.ReactNode) {
  if (isCurrent) {
    return body;
  }
  return null;
}

function continueLabelOf(phase: PhaseId) {
  if (phase === 'agent') {
    return 'Create agent';
  }
  return 'Continue';
}

/** Linear, Linear and GitHub, Notion, Linear and GitHub. */
function listOf(names: string[]) {
  if (names.length < 2) {
    return names.join('');
  }
  const head = names.slice(0, -1);
  const last = names[names.length - 1];
  return `${head.join(', ')} and ${last}`;
}

function peopleLineOf(count: number) {
  if (count === 1) {
    return '1 person invited';
  }
  return `${count} people invited`;
}

function summaryOf(phase: PhaseId, state: WorkspaceState) {
  if (phase === 'tools') {
    const connected = connectedToolsOf(state);
    const names = connected.map((id) => toolOf(id).name);
    return `${listOf(names)} connected`;
  }
  if (phase === 'team') {
    return peopleLineOf(state.invites.length);
  }
  if (phase === 'agent') {
    const model = modelOf(state.model).name;
    return `${state.agentName.trim()} on ${model}`;
  }
  return 'First job done';
}

export default function Onboarding03() {
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
  const tickRun = useCallback(() => act({ type: 'runTicked' }), [act]);
  useRunClock(state.run, isInView, tickRun);
  const { run } = state;
  const currentIndex = indexOfPhase(state.phase);
  const isWatching = state.phase === 'watch';
  const isRunOver = hasRunEnded(run);
  const isLastStepOver = isWatching && isRunOver;
  const doneCount = doneCountOf(currentIndex, isLastStepOver);
  const hasMoved = state.moves > 0;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  /**
   * Works out where an action leads before it is sent: a step that changes takes the focus to its
   * heading, an entry that is refused takes it to what has to change.
   */
  function actAndFollow(action: WorkspaceAction) {
    const after = reducer(state, action);
    act(action);
    if (after.phase !== state.phase) {
      focusLater('[data-phase-heading]');
      return;
    }
    const wasRefused = after.attempts !== state.attempts;
    const refusal = after.hint;
    if (wasRefused && refusal) {
      focusLater(`[data-field="${refusal.field}"]`);
    }
  }

  /** The tool answers on its own a moment after the press, whoever pressed. */
  function connect(tool: ToolId) {
    act({ type: 'connectPressed', tool });
    schedule(() => act({ type: 'connected', tool }), CONNECT_MS);
  }

  /** The button that disconnects leaves with the connection, so the focus goes back to Connect. */
  function disconnect(tool: ToolId) {
    act({ type: 'disconnected', tool });
    focusLater(`[data-connect="${tool}"]`);
  }

  function typeText(field: TextField, value: string) {
    act({ type: 'typed', field, value });
  }

  function commitInvites() {
    actAndFollow({ type: 'inviteCommitted' });
  }

  /** The chip takes its button with it, so the focus goes back to the address box. */
  function removeInvite(address: string) {
    act({ type: 'inviteRemoved', address });
    focusLater('[data-field="invites"]');
  }

  function pickModel(model: ModelId) {
    act({ type: 'modelPicked', model });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actAndFollow({ type: 'continued' });
  }

  function edit(phase: PhaseId) {
    actAndFollow({ type: 'edited', phase });
  }

  /** Run again leaves with the result it sat in, so the focus goes to the heading of the step. */
  function runAgain() {
    act({ type: 'ranAgain' });
    focusLater('[data-phase-heading]');
  }

  /** A tool that is still connecting belongs to the round it was pressed in. */
  function replay() {
    clearAll();
    restart();
  }

  function currentBody() {
    if (isWatching) {
      if (!run) {
        return null;
      }
      return (
        <FirstRun
          run={run}
          agentName={state.agentName}
          model={state.model}
          onRunAgain={runAgain}
        />
      );
    }
    return (
      <form noValidate onSubmit={submit} className='flex flex-col gap-4'>
        {state.phase === 'tools' && (
          <ToolsStep
            tools={state.tools}
            hint={state.hint}
            attempts={state.attempts}
            pressed={pressed}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        )}
        {state.phase === 'team' && (
          <TeamStep
            invites={state.invites}
            draft={state.inviteDraft}
            hint={state.hint}
            attempts={state.attempts}
            pressed={pressed}
            onType={typeText}
            onCommit={commitInvites}
            onRemove={removeInvite}
          />
        )}
        {state.phase === 'agent' && (
          <AgentStep
            agentName={state.agentName}
            model={state.model}
            job={state.job}
            hint={state.hint}
            attempts={state.attempts}
            onType={typeText}
            onPickModel={pickModel}
          />
        )}
        <div className='flex justify-end'>
          <Button
            type='submit'
            className={pressedSolidOf(pressed === 'continue')}
          >
            {continueLabelOf(state.phase)}
          </Button>
        </div>
      </form>
    );
  }

  const body = currentBody();

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container flex min-h-dvh w-full flex-col items-center p-4 @2xl:p-8'
      >
        <div className='flex w-full max-w-xl flex-col gap-5 @2xl:pt-4'>
          <header className='flex items-center gap-3'>
            <CompanyMark seed={WORKSPACE.name} size='lg' />
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <h1 className='truncate text-lg font-semibold'>
                Set up {WORKSPACE.name}
              </h1>
              <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
                <span className='flex items-baseline gap-1 tabular-nums'>
                  <MotionNumber value={doneCount} />
                  of {TOTAL} steps done
                </span>
                <Badge variant='secondary'>Illustrative</Badge>
              </p>
            </div>
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Replay'
            />
          </header>

          <section
            aria-label='Workspace setup'
            className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] @container rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] @md:px-5'
          >
            <ol aria-label='Setup steps' className='flex flex-col'>
              {PHASES.map((phase, index) => {
                const status = phaseStatusOf(index, currentIndex);
                const isCurrent = status === 'current';
                const isLast = index === LAST_INDEX;
                const showsEndedCheck = isLast && isLastStepOver;
                return (
                  <PhaseRow
                    key={phase.id}
                    phase={phase}
                    number={index + 1}
                    status={status}
                    marker={markerOf(status, showsEndedCheck)}
                    summary={summaryOf(phase.id, state)}
                    body={bodyIf(isCurrent, body)}
                    hasMoved={hasMoved}
                    onEdit={edit}
                  />
                );
              })}
            </ol>
          </section>
        </div>
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
