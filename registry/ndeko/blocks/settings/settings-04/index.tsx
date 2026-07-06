'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedSolidOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { KeyIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { CreateSlot } from './create-key';
import { IDLE_AFTER_DAYS, WORKSPACE_NAME, type ApiKey } from './data';
import { KeyList, MONEY_FORMAT } from './key-rows';
import {
  CREATE_MS,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
} from './session';
import { SettingsFrame, SettingsSection, SURFACE } from './settings-frame';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function totalSpendOf(keys: ApiKey[]) {
  let cents = 0;
  for (const key of keys) {
    cents += key.spendCents;
  }
  return cents / 100;
}

function keysWordOf(count: number) {
  if (count === 1) {
    return 'key';
  }
  return 'keys';
}

/** The fill of a held Revoke belongs to the demonstration only while it plays. */
function demoHoldOf(isAutoplaying: boolean, holdingId: string | null) {
  if (isAutoplaying) {
    return holdingId;
  }
  return null;
}

/** A revoked row takes its button with it: the focus goes to the row after it, or before it. */
function focusAfterRevokeOf(keys: ApiKey[], id: string) {
  const index = keys.findIndex((key) => key.id === id);
  const neighbour = keys[index + 1] ?? keys[index - 1];
  if (neighbour) {
    return `[data-row-toggle="${neighbour.id}"]`;
  }
  return '[data-create-key]';
}

function EmptyKeys() {
  return (
    <div className='flex flex-col items-center gap-2 px-4 py-10 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-10 items-center justify-center rounded-lg'>
        <KeyIcon className='size-5' />
      </span>
      <p className='text-[13px] font-medium'>No API keys</p>
      <p className='text-muted-foreground max-w-xs text-xs text-pretty'>
        Create a key to call the Tidewell API from your own servers
      </p>
    </div>
  );
}

export default function Settings04() {
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
  const count = state.keys.length;
  const isEmpty = count === 0;
  const isSlotClosed = state.status === 'closed';
  const showsEmpty = isEmpty && isSlotClosed;
  const totalSpend = totalSpendOf(state.keys);
  const demoHoldingId = demoHoldOf(isAutoplaying, state.holdingId);
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function openCreate() {
    act({ type: 'createOpened' });
    focusLater('[data-key-name]');
  }

  function closeCreate() {
    const isEditing = state.status === 'editing';
    if (!isEditing) {
      return;
    }
    act({ type: 'createClosed' });
    focusLater('[data-create-key]');
  }

  function revealCreated() {
    act({ type: 'keyCreated' });
    focusLater('[data-secret-copy]');
  }

  function submit() {
    const after = reducer(state, { type: 'createSubmitted' });
    act({ type: 'createSubmitted' });
    if (after.status !== 'creating') {
      focusLater('[data-key-name]');
      return;
    }
    schedule(revealCreated, CREATE_MS);
  }

  async function copy() {
    const value = state.secret?.value;
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      act({ type: 'copyFailed' });
      return;
    }
    act({ type: 'secretCopied' });
  }

  function hide() {
    const keyId = state.secret?.keyId;
    act({ type: 'secretHidden' });
    if (keyId) {
      focusLater(`[data-row-toggle="${keyId}"]`);
    }
  }

  function toggle(id: string) {
    act({ type: 'rowToggled', id });
  }

  function revoke(id: string) {
    const target = focusAfterRevokeOf(state.keys, id);
    act({ type: 'revoked', id });
    focusLater(target);
  }

  /** A key on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  const createButton = (
    <Button
      type='button'
      data-create-key
      disabled={!isSlotClosed}
      focusableWhenDisabled
      onClick={openCreate}
      className={pressedSolidOf(pressed === 'create')}
    >
      <PlusIcon />
      Create key
    </Button>
  );

  const replayButton = (
    <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
  );

  return (
    <ClockGate isActive={isInView}>
      <SettingsFrame
        ref={ref}
        title='API keys'
        line={`Keys let your own servers call the Tidewell API for ${WORKSPACE_NAME}. Each one reaches only what its access allows.`}
        aside={replayButton}
      >
        <SettingsSection
          title='Keys'
          line={
            <span className='flex flex-wrap items-center gap-x-1.5 gap-y-1 tabular-nums'>
              <span>
                <MotionNumber value={count} /> {keysWordOf(count)}
              </span>
              <span aria-hidden='true'>·</span>
              <span>
                <MotionNumber value={totalSpend} format={MONEY_FORMAT} /> this
                month
              </span>
              <Badge variant='secondary'>Illustrative</Badge>
            </span>
          }
          action={createButton}
        >
          <div className={cn(SURFACE, 'overflow-hidden')}>
            <CreateSlot
              state={state}
              pressed={pressed}
              onAction={act}
              onSubmit={submit}
              onClose={closeCreate}
              onCopy={copy}
              onHide={hide}
            />
            <KeyList
              keys={state.keys}
              openId={state.openId}
              pressed={pressed}
              demoHoldingId={demoHoldingId}
              onToggle={toggle}
              onRevoke={revoke}
            />
            {showsEmpty && <EmptyKeys />}
          </div>
        </SettingsSection>
        <p className='text-muted-foreground text-xs text-pretty'>
          {`Keys that make no request for ${IDLE_AFTER_DAYS} days are flagged as idle. Revoking asks for a two-second hold, so it never happens by accident.`}
        </p>
        <LiveRegion message={message} />
      </SettingsFrame>
    </ClockGate>
  );
}
