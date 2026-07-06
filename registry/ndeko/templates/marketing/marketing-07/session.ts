import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';
import { countOf } from '@/registry/ndeko/lib/words';

import type { InstallTab, Manager } from './data';
import { pageOf, type PageId } from './pages';
import { searchOf } from './search';

export type Route = 'home' | PageId;

export type DocsState = {
  route: Route;
  query: string;
  manager: Manager;
  installTab: InstallTab;
  isCommandCopied: boolean;
  /** The heading the frame scrolls to, or the top of the page. */
  readTo: string;
  /** Counts the requests, so asking twice for the same place still scrolls. */
  readRequest: number;
  isNavOpen: boolean;
  spoken: string;
};

export type DocsAction =
  | { type: 'searched'; query: string }
  | { type: 'opened'; route: Route; heading?: string }
  | { type: 'managerPicked'; manager: Manager }
  | { type: 'tabPicked'; tab: InstallTab }
  | { type: 'commandCopied' }
  | { type: 'commandReset' }
  | { type: 'readTo'; heading: string }
  | { type: 'nav'; isOpen: boolean };

type Step = SessionStep<DocsState, DocsAction>;

export const TOP = 'top';

export const INITIAL: DocsState = {
  route: 'home',
  query: '',
  manager: 'pnpm',
  installTab: 'cli',
  isCommandCopied: false,
  readTo: TOP,
  readRequest: 0,
  isNavOpen: false,
  spoken: '',
};

function resultsLineOf(query: string) {
  const results = searchOf(query);
  if (query.trim() === '') {
    return '';
  }
  if (results.length === 0) {
    return 'No page matches';
  }
  return countOf(results.length, 'result');
}

function openedLineOf(route: Route) {
  if (route === 'home') {
    return 'Docs home';
  }
  return pageOf(route).title;
}

function opened(
  state: DocsState,
  route: Route,
  heading: string | undefined
): DocsState {
  const readTo = heading ?? TOP;
  return {
    ...state,
    route,
    query: '',
    readTo,
    readRequest: state.readRequest + 1,
    isNavOpen: false,
    spoken: openedLineOf(route),
  };
}

export function reducer(state: DocsState, action: DocsAction): DocsState {
  switch (action.type) {
    case 'searched':
      return {
        ...state,
        query: action.query,
        spoken: resultsLineOf(action.query),
      };
    case 'opened':
      return opened(state, action.route, action.heading);
    case 'managerPicked':
      return { ...state, manager: action.manager, isCommandCopied: false };
    case 'tabPicked':
      return { ...state, installTab: action.tab };
    case 'commandCopied':
      return { ...state, isCommandCopied: true, spoken: 'Command copied' };
    case 'commandReset':
      return { ...state, isCommandCopied: false };
    case 'readTo':
      return {
        ...state,
        readTo: action.heading,
        readRequest: state.readRequest + 1,
      };
    case 'nav':
      return { ...state, isNavOpen: action.isOpen };
  }
}

const KEY_MS = 110;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((query, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'searched', query },
  }));
}

function open(
  after: number,
  press: string,
  route: Route,
  heading?: string
): Step {
  return {
    after,
    by: 'demo',
    press,
    action: { type: 'opened', route, heading },
  };
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

function nav(after: number, isOpen: boolean): Step {
  return { after, by: 'demo', action: { type: 'nav', isOpen } };
}

/**
 * A developer searches the home page for install, opens the page, switches to bun and copies the
 * command, reads the manual steps, goes on to the next page, finds the timeout of an approval in
 * the sidebar and goes back home. On a phone the sidebar is the sheet the demonstration opens.
 */
export const SCRIPT: Step[] = [
  ...typing('install', 1500),
  open(1700, 'result-0', 'installation'),
  manager(1700, 'bun'),
  {
    after: 1200,
    by: 'demo',
    press: 'copy-command',
    action: { type: 'commandCopied' },
  },
  tab(1700, 'manual'),
  readTo(1600, 'key'),
  open(1800, 'next-page', 'approvals'),
  nav(1400, true),
  ...typing('timeout', 600),
  open(1700, 'result-0', 'approvals', 'timeout'),
  open(3000, 'brand', 'home'),
];

/** Under reduced motion the docs rest on the installation page, with every part of a page in view. */
export const RESTING: DocsState = { ...INITIAL, route: 'installation' };

export const LOOP_AFTER_MS = 2400;
