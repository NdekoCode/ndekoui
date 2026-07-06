import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import type { CookieConsent, OptionalCategoryId } from './data';

export type ConsentDraft = Record<OptionalCategoryId, boolean>;

export type ConsentState = {
  /** The saved choice, or null while the visitor has not answered. */
  consent: CookieConsent | null;
  draft: ConsentDraft;
  isDialogOpen: boolean;
  spoken: string;
};

export type ConsentAction =
  | { type: 'dialogOpened' }
  | { type: 'dialogClosed' }
  | { type: 'categorySwitched'; id: OptionalCategoryId; isOn: boolean }
  | { type: 'acceptedAll' }
  | { type: 'rejectedAll' }
  | { type: 'choicesSaved' }
  | { type: 'restored'; consent: CookieConsent };

type Step = SessionStep<ConsentState, ConsentAction>;

const NOTHING_OPTIONAL: ConsentDraft = {
  preferences: false,
  analytics: false,
  marketing: false,
};

const EVERYTHING: ConsentDraft = {
  preferences: true,
  analytics: true,
  marketing: true,
};

export const INITIAL: ConsentState = {
  consent: null,
  draft: NOTHING_OPTIONAL,
  isDialogOpen: false,
  spoken: '',
};

function consentOf(draft: ConsentDraft): CookieConsent {
  return { necessary: true, ...draft };
}

function draftOf(consent: CookieConsent | null): ConsentDraft {
  if (!consent) {
    return NOTHING_OPTIONAL;
  }
  return {
    preferences: consent.preferences,
    analytics: consent.analytics,
    marketing: consent.marketing,
  };
}

function allowedCountOf(draft: ConsentDraft) {
  const allowed = Object.values(draft).filter(Boolean);
  return allowed.length;
}

function savedLineOf(draft: ConsentDraft) {
  const count = allowedCountOf(draft);
  if (count === 0) {
    return 'Saved: only necessary cookies';
  }
  if (count === 1) {
    return 'Saved: necessary cookies and 1 more kind';
  }
  return `Saved: necessary cookies and ${count} more kinds`;
}

/** The dialog opens on the choice already saved, or on nothing but the necessary ones. */
function dialogOpened(state: ConsentState): ConsentState {
  return {
    ...state,
    isDialogOpen: true,
    draft: draftOf(state.consent),
    spoken: 'Cookie preferences opened',
  };
}

function decided(
  state: ConsentState,
  draft: ConsentDraft,
  spoken: string
): ConsentState {
  return {
    ...state,
    consent: consentOf(draft),
    draft,
    isDialogOpen: false,
    spoken,
  };
}

export function reducer(
  state: ConsentState,
  action: ConsentAction
): ConsentState {
  switch (action.type) {
    case 'dialogOpened':
      return dialogOpened(state);
    case 'dialogClosed':
      return { ...state, isDialogOpen: false, spoken: '' };
    case 'categorySwitched': {
      const draft = { ...state.draft, [action.id]: action.isOn };
      return { ...state, draft };
    }
    case 'acceptedAll':
      return decided(state, EVERYTHING, 'Saved: all cookies');
    case 'rejectedAll':
      return decided(state, NOTHING_OPTIONAL, 'Saved: only necessary cookies');
    case 'choicesSaved':
      return decided(state, state.draft, savedLineOf(state.draft));
    case 'restored':
      return {
        ...state,
        consent: action.consent,
        draft: draftOf(action.consent),
      };
  }
}

/**
 * A visitor opens Customize, allows two kinds and saves, then comes back from Cookie settings and
 * refuses everything with one press: rejecting takes no more than accepting.
 */
export const SCRIPT: Step[] = [
  {
    after: 1600,
    by: 'demo',
    press: 'customize',
    action: { type: 'dialogOpened' },
  },
  {
    after: 1300,
    by: 'demo',
    press: 'switch-analytics',
    action: { type: 'categorySwitched', id: 'analytics', isOn: true },
  },
  {
    after: 900,
    by: 'demo',
    press: 'switch-preferences',
    action: { type: 'categorySwitched', id: 'preferences', isOn: true },
  },
  {
    after: 1300,
    by: 'demo',
    press: 'save',
    action: { type: 'choicesSaved' },
  },
  {
    after: 2600,
    by: 'demo',
    press: 'settings',
    action: { type: 'dialogOpened' },
  },
  {
    after: 1700,
    by: 'demo',
    press: 'reject-in-dialog',
    action: { type: 'rejectedAll' },
  },
];

/** Under reduced motion the banner waits with its three answers, as a visitor first sees it. */
export const RESTING = INITIAL;

export const LOOP_AFTER_MS = 3000;
