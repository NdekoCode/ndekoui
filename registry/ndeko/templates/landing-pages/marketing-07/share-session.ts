import type {
  SessionConfig,
  SessionStep,
} from '@/registry/ndeko/hooks/use-session';

import { SHARE } from './data';

export type ShareState = {
  isCopied: boolean;
  joined: number;
};

export type ShareAction =
  { type: 'copied' } | { type: 'copyEnded' } | { type: 'joined' };

type Step = SessionStep<ShareState, ShareAction>;

export const COPY_PRESS_KEY = 'copy';

export const MEMBER_TOTAL = SHARE.members.length + 1;

export const INITIAL: ShareState = {
  isCopied: false,
  joined: SHARE.members.length,
};

export const RESTING: ShareState = {
  isCopied: false,
  joined: MEMBER_TOTAL,
};

export function reducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'copied':
      return { ...state, isCopied: true };
    case 'copyEnded':
      return { ...state, isCopied: false };
    case 'joined':
      return { ...state, joined: Math.min(state.joined + 1, MEMBER_TOTAL) };
  }
}

const SCRIPT: Step[] = [
  {
    after: 2200,
    by: 'demo',
    press: COPY_PRESS_KEY,
    action: { type: 'copied' },
  },
  { after: 1500, by: 'demo', action: { type: 'joined' } },
  { after: 1800, by: 'demo', action: { type: 'copyEnded' } },
];

export const SESSION: SessionConfig<ShareState, ShareAction> = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 2600,
};
