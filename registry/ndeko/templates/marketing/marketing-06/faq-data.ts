export type TopicId = 'start' | 'control' | 'data' | 'billing';

export type Topic = {
  id: TopicId;
  label: string;
};

export type Question = {
  id: string;
  topic: TopicId;
  question: string;
  answer: string;
};

export const SECTION = {
  label: 'Questions',
  title: 'What people ask before the first close',
  lead: 'Search the questions, pick a topic, or copy the link of one to send it to a colleague.',
  contactLine: 'Not on the list? A person from the team answers, not an agent.',
};

export const TOPICS: Topic[] = [
  { id: 'start', label: 'Getting started' },
  { id: 'control', label: 'Control' },
  { id: 'data', label: 'Your data' },
  { id: 'billing', label: 'Billing' },
];

export const QUESTIONS: Question[] = [
  {
    id: 'setup',
    topic: 'start',
    question: 'How long does the first close take to set up?',
    answer:
      'Connect your ledger and your bank, and Tallyhand reads three months of history. Most teams run a first close, in review mode, the same day.',
  },
  {
    id: 'tools',
    topic: 'start',
    question: 'Which accounting tools does it work with?',
    answer:
      'QuickBooks, Xero, Stripe and Gusto today. Each connection is read-only until you allow writing, one tool at a time.',
  },
  {
    id: 'companies',
    topic: 'start',
    question: 'Can it close the books of more than one company?',
    answer:
      'Yes. Each company has its own connections and its own approvals, and a bookkeeper switches between them from one list.',
  },
  {
    id: 'approval',
    topic: 'control',
    question: 'Can an agent post an entry without my approval?',
    answer:
      'No. Every journal entry waits for Allow or Deny. You can allow one kind of entry in advance, such as a recurring rent entry, and take it back at any time.',
  },
  {
    id: 'unsure',
    topic: 'control',
    question: 'What happens when an agent is not sure?',
    answer:
      'It stops and asks. A line it cannot match goes to your list with the reason, the invoices it considered and the one it would pick.',
  },
  {
    id: 'trail',
    topic: 'control',
    question: 'Can I see what the agents did?',
    answer:
      'Every close keeps a timeline of plans, calls and answers. It replays step by step and exports as a file for your auditor.',
  },
  {
    id: 'region',
    topic: 'data',
    question: 'Where is my data stored?',
    answer:
      'In the region you pick when you create the company, and the backups stay in that region too.',
  },
  {
    id: 'training',
    topic: 'data',
    question: 'Are models trained on my books?',
    answer:
      'No. Your books are used to close your books, and for nothing else.',
  },
  {
    id: 'pricing',
    topic: 'billing',
    question: 'How is a month priced?',
    answer:
      'By the bank lines matched in the month, with a base price for each plan. The calculator above prices any volume.',
  },
  {
    id: 'cancel',
    topic: 'billing',
    question: 'Can I stop at any time?',
    answer:
      'Yes. A plan ends with its month, and your closes stay readable and exportable for a year.',
  },
];

/** The question the demonstration finds by searching, opens and copies the link of. */
export const DEMO_QUERY = 'approv';

export const DEMO_QUESTION_ID = 'approval';

/** The topic it then picks, and the question it opens there. */
export const DEMO_TOPIC: TopicId = 'data';

export const DEMO_TOPIC_QUESTION_ID = 'region';
