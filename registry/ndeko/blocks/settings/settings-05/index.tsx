'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import type { ProviderId, SignedInDevice } from './data';
import { DeviceList } from './devices';
import {
  CONNECT_MS,
  connectedCountOf,
  INITIAL,
  LOOP_AFTER_MS,
  otherDevicesOf,
  reducer,
  RESTING,
  SCRIPT,
  VERIFY_MS,
  type SecurityState,
} from './session';
import { SettingsFrame, SettingsSection } from './settings-frame';
import { SignInWays } from './sign-in-ways';
import { TwoStepCard } from './two-step';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function waysLineOf(state: SecurityState) {
  const count = connectedCountOf(state);
  if (count === 0) {
    return 'No account signs you in: you sign in with a link sent by email';
  }
  if (count > 1) {
    return `${count} accounts can sign you in`;
  }
  const only = state.providers.find(
    (provider) => provider.status === 'connected'
  );
  return `Only ${only?.name} signs you in. Connect a second account so losing one never locks you out`;
}

/** A device signed out takes its button with it: the focus goes to the next device, or to the list. */
function focusAfterSignOutOf(devices: SignedInDevice[], id: string) {
  const others = devices.filter((device) => !device.isThisDevice);
  const index = others.findIndex((device) => device.id === id);
  const neighbour = others[index + 1] ?? others[index - 1];
  if (neighbour) {
    return `[data-sign-out="${neighbour.id}"]`;
  }
  return '[data-devices]';
}

export default function Settings05() {
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
  const otherCount = otherDevicesOf(state).length;
  const hasOthers = otherCount > 0;
  const showsSignOutAll = hasOthers && !state.isConfirmingAll;
  const waysLine = waysLineOf(state);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function connect(id: ProviderId) {
    act({ type: 'connectStarted', id });
    schedule(() => act({ type: 'connected', id }), CONNECT_MS);
  }

  function disconnect(id: ProviderId) {
    const after = reducer(state, { type: 'disconnectAsked', id });
    act({ type: 'disconnectAsked', id });
    if (after.confirmingId === id) {
      focusLater(`[data-keep="${id}"]`);
    }
  }

  function confirmDisconnect(id: ProviderId) {
    act({ type: 'disconnectConfirmed', id });
    focusLater(`[data-provider-action="${id}"]`);
  }

  function keep() {
    const id = state.confirmingId;
    act({ type: 'disconnectCancelled' });
    if (id) {
      focusLater(`[data-provider-action="${id}"]`);
    }
  }

  function signOut(id: string) {
    const target = focusAfterSignOutOf(state.devices, id);
    act({ type: 'signedOut', id });
    focusLater(target);
  }

  function askSignOutAll() {
    act({ type: 'signOutAllAsked' });
    focusLater('[data-sign-out-cancel]');
  }

  function cancelSignOutAll() {
    act({ type: 'signOutAllCancelled' });
    focusLater('[data-sign-out-all]');
  }

  function confirmSignOutAll() {
    act({ type: 'signOutAllConfirmed' });
    focusLater('[data-devices]');
  }

  function switchTwoStep(isOn: boolean) {
    const wasAsking = state.twoStep === 'confirmingOff';
    act({ type: 'twoStepSwitched', isOn });
    if (wasAsking) {
      focusLater('[data-two-step]');
    }
  }

  function changeCode(code: string) {
    act({ type: 'codeTyped', value: code });
  }

  function finishVerify() {
    act({ type: 'verified' });
    focusLater('[data-two-step]');
  }

  function verify() {
    const after = reducer(state, { type: 'verifyPressed' });
    act({ type: 'verifyPressed' });
    if (after.twoStep === 'verifying') {
      schedule(finishVerify, VERIFY_MS);
    }
  }

  function turnOff() {
    act({ type: 'turnOffConfirmed' });
    focusLater('[data-two-step]');
  }

  /** A link or a check on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  const signOutAllButton = showsSignOutAll && (
    <Button
      type='button'
      variant='outline'
      size='sm'
      data-sign-out-all
      onClick={askSignOutAll}
      className={pressedQuietOf(pressed === 'sign-out-all')}
    >
      Sign out all others
    </Button>
  );

  return (
    <ClockGate isActive={isInView}>
      <SettingsFrame
        ref={ref}
        title='Security'
        line='How you sign in to Tidewell Studio, where you are signed in, and the second step that guards your account.'
        aside={
          <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
        }
      >
        <SettingsSection
          title='Ways to sign in'
          line={<Swap swapKey={waysLine}>{waysLine}</Swap>}
        >
          <SignInWays
            state={state}
            pressed={pressed}
            onConnect={connect}
            onDisconnect={disconnect}
            onConfirmDisconnect={confirmDisconnect}
            onKeep={keep}
          />
        </SettingsSection>
        <SettingsSection
          title='Signed-in devices'
          line='Sign out of any device you do not recognise. Places are approximate'
          action={signOutAllButton}
        >
          <DeviceList
            devices={state.devices}
            otherCount={otherCount}
            isConfirmingAll={state.isConfirmingAll}
            pressed={pressed}
            onSignOut={signOut}
            onCancelAll={cancelSignOutAll}
            onConfirmAll={confirmSignOutAll}
          />
        </SettingsSection>
        <SettingsSection
          title='Two-step verification'
          line='A code from your phone on top of your sign-in'
        >
          <TwoStepCard
            state={state}
            pressed={pressed}
            onSwitch={switchTwoStep}
            onCodeChange={changeCode}
            onVerify={verify}
            onTurnOff={turnOff}
          />
        </SettingsSection>
        <LiveRegion message={message} />
      </SettingsFrame>
    </ClockGate>
  );
}
