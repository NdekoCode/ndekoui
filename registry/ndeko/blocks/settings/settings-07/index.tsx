'use client';

import { useSession } from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { Badge } from '@/registry/ndeko/ui/badge';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import {
  USAGE_RESETS_ON,
  WORKSPACE_NAME,
  type Invoice,
  type PlanId,
} from './data';
import { DOLLARS, Invoices } from './invoices';
import { PaymentMethod } from './payment-method';
import { PlanCard } from './plan-card';
import {
  DOWNLOAD_MS,
  DOWNLOADED_MS,
  firstCardErrorOf,
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SAVE_CARD_MS,
  SCRIPT,
  SWITCH_MS,
} from './session';
import { SettingsFrame, SettingsSection } from './settings-frame';
import { UsageMeters } from './usage-meters';

/** The address of a saved file lives long enough for the browser to start the download. */
const RELEASE_FILE_AFTER_MS = 1000;

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

/** The file a person saves: the invoice in words, marked as a sample. */
function invoiceTextOf(invoice: Invoice) {
  const total = DOLLARS.format(invoice.amount);
  const lines = [
    WORKSPACE_NAME,
    `Invoice ${invoice.id}, ${invoice.date}`,
    '',
    ...invoice.lines,
    '',
    `Total: ${total}`,
    `Status: ${invoice.status}`,
    '',
    'A sample invoice from a component preview. Illustrative figures.',
  ];
  return lines.join('\n');
}

export default function Settings07() {
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

  function toggleChooser() {
    const wasOpen = state.isChoosingPlan;
    act({ type: 'chooserToggled' });
    if (wasOpen) {
      focusLater('[data-change-plan]');
      return;
    }
    focusLater(`[data-plan="${state.planId}"]`);
  }

  function pickPlan(planId: PlanId) {
    act({ type: 'planPicked', planId });
  }

  function finishSwitch() {
    act({ type: 'planSwitched' });
    focusLater('[data-change-plan]');
  }

  function switchPlan() {
    const after = reducer(state, { type: 'switchPressed' });
    act({ type: 'switchPressed' });
    if (after.isSwitchingPlan) {
      schedule(finishSwitch, SWITCH_MS);
    }
  }

  function askCancel() {
    act({ type: 'cancelAsked' });
    focusLater('[data-keep-plan]');
  }

  function keepPlan() {
    act({ type: 'cancelKept' });
    focusLater('[data-plan-end]');
  }

  function confirmCancel() {
    act({ type: 'cancelConfirmed' });
    focusLater('[data-plan-end]');
  }

  function resume() {
    act({ type: 'resumed' });
  }

  function toggleCard() {
    const wasOpen = state.isEditingCard;
    act({ type: 'cardEditToggled' });
    if (wasOpen) {
      focusLater('[data-update-card]');
      return;
    }
    focusLater('[data-card-field="number"]');
  }

  function finishCardSave() {
    act({ type: 'cardSaved' });
    focusLater('[data-update-card]');
  }

  function saveCard() {
    const after = reducer(state, { type: 'cardSavePressed' });
    act({ type: 'cardSavePressed' });
    if (after.isSavingCard) {
      schedule(finishCardSave, SAVE_CARD_MS);
      return;
    }
    const field = firstCardErrorOf(after.cardErrors);
    if (field) {
      focusLater(`[data-card-field="${field}"]`);
    }
  }

  /** Nothing calls a network: the invoice is written in the page and handed to the browser. */
  function saveFile(invoice: Invoice) {
    const text = invoiceTextOf(invoice);
    const blob = new Blob([text], { type: 'text/plain' });
    const address = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = address;
    link.download = `${invoice.id}.txt`;
    link.click();
    schedule(() => URL.revokeObjectURL(address), RELEASE_FILE_AFTER_MS);
  }

  function download(invoice: Invoice) {
    const id = invoice.id;
    const readyAgainAfter = DOWNLOAD_MS + DOWNLOADED_MS;
    act({ type: 'downloadStarted', id });
    schedule(() => {
      act({ type: 'downloadDone', id });
      saveFile(invoice);
    }, DOWNLOAD_MS);
    schedule(() => act({ type: 'downloadFaded', id }), readyAgainAfter);
  }

  /** A change on its way belongs to the round it was asked for in. */
  function replay() {
    clearAll();
    restart();
  }

  return (
    <ClockGate isActive={isInView}>
      <SettingsFrame
        ref={ref}
        title='Billing'
        line={`The plan of ${WORKSPACE_NAME}, what it used this month, its invoices and the card that pays them.`}
        aside={
          <ReplayButton isShown={canReplay} onReplay={replay} label='Replay' />
        }
      >
        <SettingsSection title='Plan'>
          <PlanCard
            state={state}
            pressed={pressed}
            onToggleChooser={toggleChooser}
            onPick={pickPlan}
            onSwitch={switchPlan}
            onAskCancel={askCancel}
            onKeep={keepPlan}
            onConfirmCancel={confirmCancel}
            onResume={resume}
          />
        </SettingsSection>
        <SettingsSection
          title='Usage this month'
          line={
            <span className='flex flex-wrap items-center gap-x-1.5 gap-y-1'>
              {`Resets on ${USAGE_RESETS_ON}`}
              <Badge variant='secondary'>Illustrative</Badge>
            </span>
          }
        >
          <UsageMeters planId={state.planId} used={state.used} />
        </SettingsSection>
        <SettingsSection
          title='Invoices'
          line='Sent to billing@tidewell.example'
        >
          <Invoices
            downloads={state.downloads}
            pressed={pressed}
            onDownload={download}
          />
        </SettingsSection>
        <SettingsSection title='Payment method'>
          <PaymentMethod
            state={state}
            onAction={act}
            onToggle={toggleCard}
            onSave={saveCard}
          />
        </SettingsSection>
        <LiveRegion message={message} />
      </SettingsFrame>
    </ClockGate>
  );
}
