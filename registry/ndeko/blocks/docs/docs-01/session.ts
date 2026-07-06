import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import type { Manager } from './data';
import type { TextFormat } from './page-text';

export type InstallTab = 'cli' | 'manual';

export type DocsState = {
  manager: Manager;
  installTab: InstallTab;
  isCommandCopied: boolean;
  isPageCopied: boolean;
  navQuery: string;
  /** The heading the demonstration scrolls the frame to, or the top of the page. */
  readTo: string;
  /** Counts the requests, so asking twice for the same place still scrolls. */
  readRequest: number;
  spoken: string;
};

export type DocsAction =
  | { type: 'managerPicked'; manager: Manager }
  | { type: 'tabPicked'; tab: InstallTab }
  | { type: 'commandCopied' }
  | { type: 'commandReset' }
  | { type: 'pageCopied'; format: TextFormat }
  | { type: 'pageReset' }
  | { type: 'navSearched'; query: string }
  | { type: 'readTo'; heading: string };

type Step = SessionStep<DocsState, DocsAction>;

export const TOP = 'top';

export const INITIAL: DocsState = {
  manager: 'pnpm',
  installTab: 'cli',
  isCommandCopied: false,
  isPageCopied: false,
  navQuery: '',
  readTo: TOP,
  readRequest: 0,
  spoken: '',
};

function copiedLineOf(format: TextFormat) {
  if (format === 'markdown') {
    return 'Page copied as Markdown';
  }
  return 'Page copied';
}

export function reducer(state: DocsState, action: DocsAction): DocsState {
  switch (action.type) {
    case 'managerPicked':
      return { ...state, manager: action.manager, isCommandCopied: false };
    case 'tabPicked':
      return { ...state, installTab: action.tab };
    case 'commandCopied':
      return { ...state, isCommandCopied: true, spoken: 'Command copied' };
    case 'commandReset':
      return { ...state, isCommandCopied: false };
    case 'pageCopied':
      return {
        ...state,
        isPageCopied: true,
        spoken: copiedLineOf(action.format),
      };
    case 'pageReset':
      return { ...state, isPageCopied: false };
    case 'navSearched':
      return { ...state, navQuery: action.query };
    case 'readTo':
      return {
        ...state,
        readTo: action.heading,
        readRequest: state.readRequest + 1,
      };
  }
}

const KEY_MS = 110;

function navTyping(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'navSearched', query: value },
  }));
}

function manager(after: number, value: Manager): Step {
  return {
    after,
    by: 'demo',
    press: `pm-${value}`,
    action: { type: 'managerPicked', manager: value },
  };
}

function tab(after: number, value: InstallTab): Step {
  return {
    after,
    by: 'demo',
    press: `tab-${value}`,
    action: { type: 'tabPicked', tab: value },
  };
}

function readTo(after: number, heading: string): Step {
  return { after, by: 'demo', action: { type: 'readTo', heading } };
}

/**
 * A developer switches the command to their package manager, copies it, reads the manual steps
 * further down, looks for the flag pages in the sidebar, and puts everything back as it was.
 */
export const SCRIPT: Step[] = [
  manager(1500, 'npm'),
  manager(1300, 'bun'),
  {
    after: 1200,
    by: 'demo',
    press: 'copy-command',
    action: { type: 'commandCopied' },
  },
  tab(1800, 'manual'),
  readTo(1800, 'keys'),
  readTo(1700, 'check'),
  ...navTyping('flag', 1400),
  {
    after: 2400,
    by: 'demo',
    press: 'nav-clear',
    action: { type: 'navSearched', query: '' },
  },
  readTo(1300, TOP),
  tab(1100, 'cli'),
  manager(1000, 'pnpm'),
];

export const RESTING: DocsState = INITIAL;

export const LOOP_AFTER_MS = 2200;
