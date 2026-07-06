import type { SessionStep } from '@/registry/ndeko/hooks/use-session';

import { POSTS, topicOf, type Post, type TopicId } from './data';

export type TopicFilter = TopicId | 'all';

export type BlogState = {
  topic: TopicFilter;
  query: string;
  visible: number;
  spoken: string;
};

export type BlogAction =
  | { type: 'topicPicked'; topic: TopicFilter }
  | { type: 'searched'; query: string }
  | { type: 'loadedMore' }
  | { type: 'cleared' };

type Step = SessionStep<BlogState, BlogAction>;

export const PAGE_SIZE = 6;

/** One more row of the widest grid. */
const LOAD_STEP = 3;

export const FEATURED = POSTS[0];

export const INITIAL: BlogState = {
  topic: 'all',
  query: '',
  visible: PAGE_SIZE,
  spoken: '',
};

function wordsOf(query: string) {
  const trimmed = query.trim();
  const lowered = trimmed.toLowerCase();
  const pieces = lowered.split(/\s+/);
  return pieces.filter((piece) => piece !== '');
}

function matchesQuery(post: Post, words: string[]) {
  const text = `${post.title} ${post.excerpt}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

function matchesTopic(post: Post, topic: TopicFilter) {
  if (topic === 'all') {
    return true;
  }
  return post.topic === topic;
}

/** With no topic and no search, the newest post sits apart as the featured one. */
export function isBrowsing(state: BlogState) {
  const hasQuery = wordsOf(state.query).length > 0;
  return state.topic === 'all' && !hasQuery;
}

export function postsIn(state: BlogState) {
  const words = wordsOf(state.query);
  const matching = POSTS.filter((post) => {
    const isInTopic = matchesTopic(post, state.topic);
    return isInTopic && matchesQuery(post, words);
  });
  if (isBrowsing(state)) {
    return matching.filter((post) => post.id !== FEATURED.id);
  }
  return matching;
}

export function countOfTopic(topic: TopicFilter) {
  const inTopic = POSTS.filter((post) => matchesTopic(post, topic));
  return inTopic.length;
}

function postsWordOf(count: number) {
  if (count === 1) {
    return '1 post';
  }
  return `${count} posts`;
}

function topicNameOf(topic: TopicFilter) {
  if (topic === 'all') {
    return 'all topics';
  }
  return topicOf(topic).label;
}

function foundLineOf(state: BlogState) {
  const count = postsIn(state).length;
  if (count === 0) {
    return 'No posts match';
  }
  return `${postsWordOf(count)} in ${topicNameOf(state.topic)}`;
}

function filtered(state: BlogState, change: Partial<BlogState>): BlogState {
  const next = { ...state, ...change, visible: PAGE_SIZE };
  return { ...next, spoken: foundLineOf(next) };
}

function loadedMore(state: BlogState): BlogState {
  const total = postsIn(state).length;
  const visible = Math.min(state.visible + LOAD_STEP, total);
  const added = visible - state.visible;
  if (added <= 0) {
    return state;
  }
  return { ...state, visible, spoken: `${postsWordOf(added)} more` };
}

export function reducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'topicPicked':
      return filtered(state, { topic: action.topic });
    case 'searched':
      return filtered(state, { query: action.query });
    case 'loadedMore':
      return loadedMore(state);
    case 'cleared':
      return filtered(state, { topic: 'all', query: '' });
  }
}

/**
 * A reader loads another row, narrows to Design and comes back to every topic. Picking a topic
 * starts the list from its first page, so the round ends on the page it began with.
 */
export const SCRIPT: Step[] = [
  {
    after: 1700,
    by: 'demo',
    press: 'load-more',
    action: { type: 'loadedMore' },
  },
  {
    after: 2600,
    by: 'demo',
    press: 'topic-design',
    action: { type: 'topicPicked', topic: 'design' },
  },
  {
    after: 2800,
    by: 'demo',
    press: 'topic-all',
    action: { type: 'topicPicked', topic: 'all' },
  },
];

export const RESTING: BlogState = INITIAL;

export const LOOP_AFTER_MS = 2600;
