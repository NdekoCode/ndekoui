import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const WORKSPACE = { name: 'Nyota Studio' };

export const PERSON = { name: 'Grace Mbuyi' };

export const TODAY = {
  runs: 38,
  finished: 27,
  spentUsd: 14.2,
};

export type WaitingId = 'writer' | 'researcher' | 'coder' | 'planner';

export type Waiting = {
  id: WaitingId;
  agent: string;
  series: SeriesSlot;
  ask: string;
  waited: string;
  action: string;
  done: string;
};

export const WAITING: Waiting[] = [
  {
    id: 'writer',
    agent: 'Writer',
    series: 2,
    ask: 'Wants to send the Lubumbashi price update to 14 customers',
    waited: '6 min',
    action: 'Review draft',
    done: 'Draft approved',
  },
  {
    id: 'researcher',
    agent: 'Researcher',
    series: 3,
    ask: 'Two sources disagree on the Goma freight rate',
    waited: '12 min',
    action: 'Choose a source',
    done: 'Source chosen',
  },
  {
    id: 'coder',
    agent: 'Coder',
    series: 1,
    ask: 'Asks to merge the invoice export fix',
    waited: '21 min',
    action: 'Approve merge',
    done: 'Merge approved',
  },
  {
    id: 'planner',
    agent: 'Planner',
    series: 4,
    ask: 'Needs a start date for the Kinshasa launch plan',
    waited: '34 min',
    action: 'Pick a date',
    done: 'Date picked',
  },
];

export type SuggestionId = 'finished' | 'waiting' | 'spend';

export type Suggestion = {
  id: SuggestionId;
  label: string;
  question: string;
  answer: string;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'finished',
    label: 'Finished yesterday',
    question: 'What did the agents finish yesterday?',
    answer:
      '31 tasks finished yesterday: 12 customer updates drafted, 9 invoices matched, 7 fixes merged and 3 reports filed. Nothing failed.',
  },
  {
    id: 'waiting',
    label: 'Customers waiting',
    question: 'Which customers are waiting for a reply?',
    answer:
      'Four customers wrote in the last hour: two in Kinshasa, one in Goma and one in Lubumbashi. The Writer has a draft ready for each.',
  },
  {
    id: 'spend',
    label: 'Research spend',
    question: 'How much did research cost this week?',
    answer:
      'Research runs cost $64 this week, which is 30% of the $212 spent this month.',
  },
];

export const NO_ANSWER =
  'This sample answers the three suggested questions. Pick one to see how an answer lands.';

export type ActionId = 'task' | 'agent' | 'app' | 'invite';

export type QuickAction = {
  id: ActionId;
  label: string;
  hint: string;
};

export const ACTIONS: QuickAction[] = [
  { id: 'task', label: 'New task', hint: 'Give an agent a job' },
  { id: 'agent', label: 'Create an agent', hint: 'Name it, set its job' },
  { id: 'app', label: 'Connect an app', hint: 'Notion, Linear, Gmail' },
  { id: 'invite', label: 'Invite a teammate', hint: 'Share the reviews' },
];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const SPEND = {
  usedUsd: 212,
  budgetUsd: 400,
  byDay: [28, 36, 31, 40, 14.2],
};

export const TASKS_DONE = {
  total: 124,
  byDay: [22, 29, 26, 20, 27],
};

export function suggestionOf(question: string) {
  const wanted = question.trim().toLowerCase();
  return SUGGESTIONS.find(
    (suggestion) => suggestion.question.toLowerCase() === wanted
  );
}

export function answerTextOf(id: SuggestionId | 'none') {
  const suggestion = SUGGESTIONS.find((candidate) => candidate.id === id);
  return suggestion?.answer ?? NO_ANSWER;
}
