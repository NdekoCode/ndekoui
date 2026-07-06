import type { SessionStep } from '@/registry/ndeko/hooks/use-session';
import { keyDelayOf, prefixesOf } from '@/registry/ndeko/lib/demonstration';

import type { TopicFilter } from './data';

export type FaqState = {
  query: string;
  topic: TopicFilter;
  openIds: string[];
  copiedId: string | null;
  linkedId: string | null;
};

export type FaqAction =
  | { type: 'typed'; value: string }
  | { type: 'topicPicked'; topic: TopicFilter }
  | { type: 'opened'; ids: string[] }
  | { type: 'cleared' }
  | { type: 'copied'; id: string }
  | { type: 'copyCleared' }
  | { type: 'linked'; id: string };

type Step = SessionStep<FaqState, FaqAction>;

export const INITIAL: FaqState = {
  query: '',
  topic: 'all',
  openIds: [],
  copiedId: null,
  linkedId: null,
};

export function reducer(state: FaqState, action: FaqAction): FaqState {
  switch (action.type) {
    case 'typed':
      return { ...state, query: action.value };
    case 'topicPicked':
      return { ...state, topic: action.topic };
    case 'opened':
      return { ...state, openIds: action.ids };
    case 'cleared':
      return { ...state, query: '' };
    case 'copied':
      return { ...state, copiedId: action.id };
    case 'copyCleared':
      return { ...state, copiedId: null };
    case 'linked':
      return {
        ...state,
        query: '',
        topic: 'all',
        openIds: [action.id],
        linkedId: action.id,
      };
  }
}

export const COPIED_MS = 1600;

const KEY_MS = 260;

function typing(text: string, startAfter: number): Step[] {
  const prefixes = prefixesOf(text);
  return prefixes.map((value, index) => ({
    after: keyDelayOf(index, startAfter, KEY_MS),
    by: 'demo',
    action: { type: 'typed', value },
  }));
}

/**
 * Someone types "cafe" and finds the question with its accent, opens it and copies its link,
 * clears the search and filters by topic, then types a word nothing matches and meets the person
 * to ask.
 */
export const SCRIPT: Step[] = [
  ...typing('cafe', 1000),
  {
    after: 1500,
    by: 'demo',
    press: 'trigger-split',
    action: { type: 'opened', ids: ['split'] },
  },
  {
    after: 1700,
    by: 'demo',
    press: 'copy-split',
    action: { type: 'copied', id: 'split' },
  },
  {
    after: 2400,
    by: 'demo',
    press: 'clear',
    action: { type: 'cleared' },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'topic-payments',
    action: { type: 'topicPicked', topic: 'payments' },
  },
  {
    after: 1800,
    by: 'demo',
    press: 'topic-all',
    action: { type: 'topicPicked', topic: 'all' },
  },
  ...typing('zzq', 1400),
  {
    after: 2600,
    by: 'demo',
    press: 'clear-search',
    action: { type: 'cleared' },
  },
];

/** Under reduced motion the word is typed, the question with its accent is marked and open. */
export const RESTING: FaqState = {
  ...INITIAL,
  query: 'cafe',
  openIds: ['split'],
};

export const LOOP_AFTER_MS = 2600;
