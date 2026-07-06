'use client';

import { LayoutGroup } from 'motion/react';
import { useId } from 'react';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { AuthFrame, StepSwap } from './auth-frame';
import type { ProviderId } from './data';
import {
  CHECK_MS,
  INITIAL,
  LOOP_AFTER_MS,
  OPEN_MS,
  PROVIDER_MS,
  reducer,
  RESENT_MS,
  RESTING,
  SCRIPT,
  SEND_MS,
  workspaceOf,
  type AuthAction,
  type AuthState,
  type AuthStep,
} from './session';
import {
  CodeStep,
  DoneStep,
  OpeningStep,
  StartStep,
  WorkspaceStep,
} from './steps';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const HEADING = '[data-step-heading]';

/** A step that leaves stays in the page while it fades, ahead of the one that arrives: the last match is the one on screen. */
function lastOf(elements: NodeListOf<HTMLElement> | undefined) {
  if (!elements) {
    return null;
  }
  const lastIndex = elements.length - 1;
  return elements.item(lastIndex);
}

function pickedAt(state: AuthState, step: AuthStep) {
  if (state.step !== step) {
    return null;
  }
  return workspaceOf(state, state.pickedId) ?? null;
}

export default function Auth04() {
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
  const groupId = useId();
  const opening = pickedAt(state, 'opening');
  const entered = pickedAt(state, 'done');
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const matches = ref.current?.querySelectorAll<HTMLElement>(selector);
      const target = lastOf(matches);
      target?.focus();
    });
  }

  /** A person who moves to a new step lands on its title. */
  function actAndLand(action: AuthAction) {
    act(action);
    focusLater(HEADING);
  }

  function requestCode() {
    const after = reducer(state, { type: 'codeRequested' });
    act({ type: 'codeRequested' });
    if (!after.isSending) {
      focusLater('[data-email]');
      return;
    }
    schedule(() => actAndLand({ type: 'codeSent' }), SEND_MS);
  }

  function pressProvider(id: ProviderId) {
    act({ type: 'providerPressed', id });
    schedule(() => actAndLand({ type: 'providerReturned', id }), PROVIDER_MS);
  }

  /** The code is read only while it is checked, so the outcome is known when it is sent. */
  function submitCode() {
    const after = reducer(state, { type: 'codeSubmitted' });
    act({ type: 'codeSubmitted' });
    if (!after.isChecking) {
      focusLater('[data-code-slot="0"]');
      return;
    }
    const checked = reducer(after, { type: 'codeChecked' });
    const isIn = checked.step === 'workspace';
    schedule(() => {
      act({ type: 'codeChecked' });
      if (isIn) {
        focusLater(HEADING);
        return;
      }
      focusLater('[data-code-slot="0"]');
    }, CHECK_MS);
  }

  function resend() {
    act({ type: 'resendPressed' });
    schedule(() => act({ type: 'resendFaded' }), RESENT_MS);
  }

  function restartSignIn() {
    clearAll();
    actAndLand({ type: 'restarted' });
  }

  function openWhenReady() {
    schedule(() => actAndLand({ type: 'opened' }), OPEN_MS);
  }

  function pick(id: string) {
    actAndLand({ type: 'workspacePicked', id });
    openWhenReady();
  }

  function toggleCreate() {
    const wasOpen = state.isCreating;
    act({ type: 'createToggled' });
    if (wasOpen) {
      focusLater('[data-create-workspace]');
      return;
    }
    focusLater('[data-new-workspace]');
  }

  function create() {
    const after = reducer(state, { type: 'createSubmitted' });
    act({ type: 'createSubmitted' });
    if (after.step !== 'opening') {
      focusLater('[data-new-workspace]');
      return;
    }
    focusLater(HEADING);
    openWhenReady();
  }

  function switchWorkspace() {
    actAndLand({ type: 'switchPressed' });
  }

  /** A step on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <LayoutGroup id={groupId}>
        <AuthFrame
          ref={ref}
          aside={
            <ReplayButton
              isShown={canReplay}
              onReplay={replay}
              label='Replay'
            />
          }
          footer='Trouble signing in? A workspace admin can send you a new invitation.'
          announcer={<LiveRegion message={message} />}
        >
          <StepSwap stepKey={state.step}>
            {state.step === 'start' && (
              <StartStep
                state={state}
                pressed={pressed}
                onAction={act}
                onRequest={requestCode}
                onProvider={pressProvider}
              />
            )}
            {state.step === 'code' && (
              <CodeStep
                state={state}
                pressed={pressed}
                onAction={act}
                onSubmit={submitCode}
                onResend={resend}
                onRestart={restartSignIn}
              />
            )}
            {state.step === 'workspace' && (
              <WorkspaceStep
                state={state}
                pressed={pressed}
                onAction={act}
                onPick={pick}
                onToggleCreate={toggleCreate}
                onCreate={create}
                onRestart={restartSignIn}
              />
            )}
            {opening && <OpeningStep workspace={opening} />}
            {entered && (
              <DoneStep
                workspace={entered}
                account={state.account}
                onSwitch={switchWorkspace}
                onRestart={restartSignIn}
              />
            )}
          </StepSwap>
        </AuthFrame>
      </LayoutGroup>
    </ClockGate>
  );
}
