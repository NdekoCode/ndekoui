import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { wordsOf } from '@/registry/ndeko/lib/words';

export const WORKSPACE = { name: 'Corvale', space: 'Growth' };

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const RESEARCHER: Agent = {
  name: 'Researcher',
  series: 2,
};

export type Model = {
  name: string;
  brand: BrandSlug;
};

export const MODEL: Model = { name: 'Claude Sonnet', brand: 'claude' };

export const QUESTION = 'Why did onboarding completion drop in March?';

export type StepId = 'plan' | 'search' | 'notes' | 'cohort' | 'issue' | 'check';

export type ActivityKind = 'think' | 'search' | 'read';

export type ActivitySeed = {
  id: StepId;
  kind: ActivityKind;
  title: string;
  detail: string;
  doneSummary: string;
  brand?: BrandSlug;
  product?: string;
  usd: number;
};

/** Invented documents and costs. The figures are illustrative. */
export const ACTIVITY: ActivitySeed[] = [
  {
    id: 'plan',
    kind: 'think',
    title: 'Plan the research',
    detail: 'Where the answer is likely to be written down',
    doneSummary: 'Product notes, the cohort review, the issue tracker',
    usd: 0.004,
  },
  {
    id: 'search',
    kind: 'search',
    title: 'Search the workspace',
    detail: 'onboarding completion March',
    doneSummary: '4 documents found, 3 worth reading',
    usd: 0.006,
  },
  {
    id: 'notes',
    kind: 'read',
    title: 'Read Onboarding redesign notes',
    detail: 'A page of the Product space',
    doneSummary: 'Verification moved to step two on 4 March',
    brand: 'notion',
    product: 'Notion',
    usd: 0.011,
  },
  {
    id: 'cohort',
    kind: 'read',
    title: 'Read March cohort review',
    detail: 'Six pages and one table',
    doneSummary: 'Completion went from 61% to 48%',
    brand: 'googledocs',
    product: 'Google Docs',
    usd: 0.014,
  },
  {
    id: 'issue',
    kind: 'read',
    title: 'Read ONB-142',
    detail: 'An issue with 12 comments',
    doneSummary: 'Our email takes up to nine minutes at peak hours',
    brand: 'linear',
    product: 'Linear',
    usd: 0.009,
  },
  {
    id: 'check',
    kind: 'think',
    title: 'Check the figures',
    detail: 'Each number against the cohort table',
    doneSummary: 'Every figure matches its source',
    usd: 0.007,
  },
];

const FALLBACK_SEED = ACTIVITY[0];

export function seedOf(id: StepId) {
  const seed = ACTIVITY.find((candidate) => candidate.id === id);
  return seed ?? FALLBACK_SEED;
}

export type Source = {
  number: number;
  stepId: StepId;
  title: string;
  brand: BrandSlug;
  product: string;
};

export const SOURCES: Source[] = [
  {
    number: 1,
    stepId: 'notes',
    title: 'Onboarding redesign notes',
    brand: 'notion',
    product: 'Notion',
  },
  {
    number: 2,
    stepId: 'cohort',
    title: 'March cohort review',
    brand: 'googledocs',
    product: 'Google Docs',
  },
  {
    number: 3,
    stepId: 'issue',
    title: 'ONB-142',
    brand: 'linear',
    product: 'Linear',
  },
];

export const MEMO_TITLE = 'Onboarding completion in March';

export type MemoSection = {
  id: string;
  heading: string;
  text: string;
};

export const MEMO: MemoSection[] = [
  {
    id: 'changed',
    heading: 'What changed',
    text: 'On 4 March the email verification step moved from the end of onboarding to step two. Nothing else in the flow changed that week.',
  },
  {
    id: 'evidence',
    heading: 'Evidence',
    text: 'Completion fell from 61% in the February cohort to 48% in March. Most of the loss sits at step two, where 22% of new accounts now leave, against 6% before.',
  },
  {
    id: 'cause',
    heading: 'Likely cause',
    text: 'The verification email takes up to nine minutes to arrive at peak hours. People who wait more than two minutes rarely come back to finish.',
  },
  {
    id: 'next',
    heading: 'Next steps',
    text: 'Let people continue while the email is on its way, or move verification back to the end. Measure again with the first April cohort.',
  },
];

function wordCountOf(section: MemoSection) {
  const words = wordsOf(section.text);
  return words.length;
}

export const SECTION_WORDS = MEMO.map(wordCountOf);

function sumOf(counts: number[]) {
  let total = 0;
  for (const count of counts) {
    total += count;
  }
  return total;
}

export const MEMO_WORDS = sumOf(SECTION_WORDS);

export const FOLDED_BY_DEMO = 'evidence';

const ANSWER =
  'Completion dropped because email verification moved to step two on 4 March. [1] The March cohort finished at 48%, down from 61%, [2] and most people leave while they wait for an email that takes up to nine minutes at peak hours. [3] The memo beside this thread has the detail and two ways to fix it.';

export type AnswerToken =
  { kind: 'word'; text: string } | { kind: 'cite'; source: number };

const CITE = /^\[(\d+)\]$/;

function tokenOf(piece: string): AnswerToken {
  const match = CITE.exec(piece);
  if (match) {
    const source = Number(match[1]);
    return { kind: 'cite', source };
  }
  return { kind: 'word', text: piece };
}

const ANSWER_PIECES = wordsOf(ANSWER);

export const ANSWER_TOKENS = ANSWER_PIECES.map(tokenOf);

export type Person = {
  id: string;
  name: string;
  role: string;
};

export const RECEIVERS: Person[] = [
  {
    id: 'mara',
    name: 'Mara Lindqvist',
    role: 'Head of growth',
  },
  {
    id: 'jonas',
    name: 'Jonas Weber',
    role: 'Onboarding lead',
  },
  {
    id: 'imani',
    name: 'Imani Okoro',
    role: 'Lifecycle marketing',
  },
];

export const SHARED_LINE =
  'Shared with Mara, Jonas and Imani. They can comment on the memo';

export const KEPT_LINE = 'Not shared. The memo stays private to you';

export const FOLLOW_UP_REPLY =
  'This demonstration plays one scripted run. Replay it to watch it again.';
