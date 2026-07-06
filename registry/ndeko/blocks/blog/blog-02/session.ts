import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

export type PostState = {
  /** The heading the demonstration scrolls the frame to, or the top of the post. */
  readTo: string;
  /** Counts the requests, so asking twice for the same place still scrolls. */
  readRequest: number;
  isLinkCopied: boolean;
  spoken: string;
};

export type PostAction =
  | { type: 'readTo'; heading: string }
  | { type: 'linkCopied' }
  | { type: 'copyReset' };

type Step = SessionStep<PostState, PostAction>;

export const TOP = 'top';

export const INITIAL: PostState = {
  readTo: TOP,
  readRequest: 0,
  isLinkCopied: false,
  spoken: '',
};

export function reducer(state: PostState, action: PostAction): PostState {
  switch (action.type) {
    case 'readTo':
      return {
        ...state,
        readTo: action.heading,
        readRequest: state.readRequest + 1,
      };
    case 'linkCopied':
      return {
        ...state,
        isLinkCopied: true,
        spoken: 'Link to the post copied',
      };
    case 'copyReset':
      return { ...state, isLinkCopied: false };
  }
}

function readTo(after: number, heading: string): Step {
  return { after, by: 'demo', action: { type: 'readTo', heading } };
}

/**
 * A reader goes down the post one section at a time, jumps to the last one from the table of
 * contents, copies the link and goes back to the top: the round ends where it began.
 */
export const SCRIPT: Step[] = [
  readTo(1500, 'small-changes'),
  readTo(2300, 'merging'),
  readTo(2300, 'replayed'),
  {
    after: 2000,
    by: 'demo',
    press: 'toc-rollout',
    action: { type: 'readTo', heading: 'rollout' },
  },
  {
    after: 1900,
    by: 'demo',
    press: 'copy-link',
    action: { type: 'linkCopied' },
  },
  readTo(2200, TOP),
];

export const RESTING: PostState = INITIAL;

export const LOOP_AFTER_MS = 2200;
