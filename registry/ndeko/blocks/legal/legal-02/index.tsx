'use client';

import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { ConsentBanner, SettingsLink } from './consent-banner';
import {
  SITE_NAME,
  STORAGE_KEY,
  type CookieConsent,
  type OptionalCategoryId,
} from './data';
import { PreferencesDialog } from './preferences-dialog';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  type ConsentAction,
} from './session';
import { SitePage } from './site-page';

export type { CookieConsent } from './data';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

function isConsent(value: unknown): value is CookieConsent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const hasNecessary = 'necessary' in value && value.necessary === true;
  const hasPreferences =
    'preferences' in value && typeof value.preferences === 'boolean';
  const hasAnalytics =
    'analytics' in value && typeof value.analytics === 'boolean';
  const hasMarketing =
    'marketing' in value && typeof value.marketing === 'boolean';
  const hasOptional = hasPreferences && hasAnalytics;
  return hasNecessary && hasOptional && hasMarketing;
}

/** Storage can be refused (private windows, blocked site data): the choice then lives in memory only. */
function readConsent(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (isConsent(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeConsent(key: string, consent: CookieConsent) {
  try {
    const raw = JSON.stringify(consent);
    window.localStorage.setItem(key, raw);
  } catch {
    return;
  }
}

/** Once a choice exists the banner is gone, so the focus goes back to the way to it. */
function returnFocusOf(consent: CookieConsent | null) {
  if (consent) {
    return '[data-cookie-settings]';
  }
  return '[data-customize]';
}

export type Legal02Props = {
  /** Called with every choice a person saves. The demonstration never calls it. */
  onChange?: (consent: CookieConsent) => void;
  /** Keeps the choice in this browser and starts from it on the next visit. */
  persist?: boolean;
  storageKey?: string;
};

export default function Legal02({
  onChange,
  persist = false,
  storageKey = STORAGE_KEY,
}: Legal02Props) {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
    takeOver,
  } = useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const [hasReadStorage, setHasReadStorage] = useState(!persist);
  const hasNoChoice = state.consent === null;
  const isBannerShown = hasNoChoice && hasReadStorage;
  const isLinkShown = state.consent !== null;
  const message = spokenUnless(isAutoplaying, state.spoken);
  const canReplay = isFinished && !isAutoplaying;

  /**
   * Under reduced motion the session puts its resting state in place on the next task, which
   * would hide a stored choice: the choice is read and put back after it, whenever that setting
   * changes. Until it is read the banner waits, so a returning visitor never sees it flash.
   */
  useEffect(() => {
    if (!persist) {
      return;
    }
    const timer = setTimeout(() => {
      setHasReadStorage(true);
      const stored = readConsent(storageKey);
      if (!stored) {
        return;
      }
      act({ type: 'restored', consent: stored });
      takeOver();
    }, 0);
    return () => clearTimeout(timer);
  }, [persist, storageKey, act, takeOver, shouldReduceMotion]);

  function focusLater(selector: string) {
    requestAnimationFrame(() => {
      const target = ref.current?.querySelector<HTMLElement>(selector);
      target?.focus();
    });
  }

  function decide(action: ConsentAction) {
    const after = reducer(state, action);
    act(action);
    const consent = after.consent;
    if (!consent) {
      return;
    }
    onChange?.(consent);
    if (persist) {
      writeConsent(storageKey, consent);
    }
    focusLater('[data-cookie-settings]');
  }

  function openDialog() {
    act({ type: 'dialogOpened' });
    focusLater('[data-dialog-title]');
  }

  function closeDialog() {
    act({ type: 'dialogClosed' });
    focusLater(returnFocusOf(state.consent));
  }

  function switchCategory(id: OptionalCategoryId, isOn: boolean) {
    act({ type: 'categorySwitched', id, isOn });
  }

  return (
    <ClockGate isActive={isInView}>
      <div
        ref={ref}
        className='bg-background text-foreground @container relative isolate flex h-dvh min-h-[34rem] w-full flex-col overflow-hidden'
      >
        <div
          inert={state.isDialogOpen}
          className='flex min-h-0 flex-1 flex-col'
        >
          <div
            role='region'
            aria-label={`${SITE_NAME} guide`}
            tabIndex={0}
            className='focus-visible:ring-ring/25 min-h-0 flex-1 overflow-y-auto outline-none focus-visible:ring-[3px] focus-visible:ring-inset'
          >
            <SitePage
              aside={
                <ReplayButton
                  isShown={canReplay}
                  onReplay={restart}
                  label='Replay'
                />
              }
            />
          </div>
          <div className='pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4'>
            <ConsentBanner
              isShown={isBannerShown}
              pressed={pressed}
              onRejectAll={() => decide({ type: 'rejectedAll' })}
              onAcceptAll={() => decide({ type: 'acceptedAll' })}
              onCustomize={openDialog}
            />
          </div>
          <div className='pointer-events-none absolute start-0 bottom-0 z-20 p-3'>
            <SettingsLink
              isShown={isLinkShown}
              isPressed={pressed === 'settings'}
              onOpen={openDialog}
            />
          </div>
        </div>
        <PreferencesDialog
          isOpen={state.isDialogOpen}
          draft={state.draft}
          pressed={pressed}
          onSwitch={switchCategory}
          onAcceptAll={() => decide({ type: 'acceptedAll' })}
          onRejectAll={() => decide({ type: 'rejectedAll' })}
          onSave={() => decide({ type: 'choicesSaved' })}
          onClose={closeDialog}
        />
        <LiveRegion message={message} />
      </div>
    </ClockGate>
  );
}
