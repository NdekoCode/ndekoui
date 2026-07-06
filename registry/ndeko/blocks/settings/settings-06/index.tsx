'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { WORKSPACE_NAME, type License, type LicenseId } from './data';
import { LicenseCard } from './license-card';
import {
  COPIED_MS,
  INITIAL,
  keyTextOf,
  licenseOf,
  LOOP_AFTER_MS,
  reducer,
  REGENERATE_MS,
  RESTING,
  RETURN_GAPS_MS,
  returnsOf,
  SCRIPT,
} from './session';
import { SettingsFrame, SettingsSection } from './settings-frame';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

export default function Settings06() {
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
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function reveal(id: LicenseId) {
    act({ type: 'revealToggled', id });
  }

  async function copy(license: License) {
    try {
      await navigator.clipboard.writeText(keyTextOf(license.groups));
    } catch {
      act({ type: 'copyFailed' });
      return;
    }
    act({ type: 'copied', id: license.id });
    schedule(() => act({ type: 'copyFaded' }), COPIED_MS);
  }

  function toggleRegenerate(id: LicenseId) {
    const after = reducer(state, { type: 'regenerateToggled', id });
    act({ type: 'regenerateToggled', id });
    if (after.confirmingId === id) {
      focusLater(`[data-keep-key="${id}"]`);
    }
  }

  function keep() {
    const id = state.confirmingId;
    act({ type: 'regenerateCancelled' });
    if (id) {
      focusLater(`[data-regenerate="${id}"]`);
    }
  }

  /** The machines that held the old key come back one after another with the new one. */
  function bringMachinesBack(id: LicenseId, used: number, round: number) {
    const returns = returnsOf(used);
    let wait = 0;
    returns.forEach((count, index) => {
      wait += RETURN_GAPS_MS[index];
      schedule(() => act({ type: 'activated', id, used: count, round }), wait);
    });
  }

  function confirm(id: LicenseId) {
    const license = licenseOf(state, id);
    if (!license) {
      return;
    }
    const round = state.made[id] + 1;
    act({ type: 'regenerateConfirmed', id });
    focusLater(`[data-regenerate="${id}"]`);
    schedule(() => {
      act({ type: 'regenerated', id });
      bringMachinesBack(id, license.used, round);
    }, REGENERATE_MS);
  }

  /** A key on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <SettingsFrame
        ref={ref}
        title='License keys'
        line={`The keys that unlock the Tidewell apps ${WORKSPACE_NAME} pays for. Show one again whenever you need it.`}
        aside={
          <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
        }
      >
        <SettingsSection
          title='Your licenses'
          line={
            <span className='flex flex-wrap items-center gap-x-1.5 gap-y-1'>
              Sample keys with DEMO in them: they unlock nothing
              <Badge variant='secondary'>Illustrative</Badge>
            </span>
          }
        >
          <div className='grid items-start gap-4 @3xl:grid-cols-2'>
            {state.licenses.map((license) => (
              <LicenseCard
                key={license.id}
                license={license}
                state={state}
                pressed={pressed}
                onReveal={reveal}
                onCopy={copy}
                onRegenerate={toggleRegenerate}
                onKeep={keep}
                onConfirm={confirm}
              />
            ))}
          </div>
        </SettingsSection>
        <LiveRegion message={message} />
      </SettingsFrame>
    </ClockGate>
  );
}
