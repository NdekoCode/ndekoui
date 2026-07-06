import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { wordsOf } from '@/registry/ndeko/lib/words';

export const BRAND = { name: 'Ferrowick' };

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const OPERATOR: Agent = { name: 'Operator', series: 4 };

export const LIVE_ID = 'live';

export const LIVE_TITLE = 'Unpaid invoices, March';

export const NEW_SESSION_TITLE = 'New session';

export type Day = 'Today' | 'Yesterday' | 'Earlier this week';

export const DAYS: Day[] = ['Today', 'Yesterday', 'Earlier this week'];

export type PastSession = {
  id: string;
  day: Day;
  title: string;
  prompt: string;
  summary: string;
};

/** Invented sessions of an invented company. They open as read-only summaries. */
export const PAST_SESSIONS: PastSession[] = [
  {
    id: 'stock',
    day: 'Today',
    title: 'Stock count, Kinshasa depot',
    prompt:
      'Compare this week stock count with last week for the Kinshasa depot.',
    summary:
      'Eleven items moved by more than 5%. Cooking oil and rice account for most of it, and both match a delivery on Tuesday.',
  },
  {
    id: 'drafts',
    day: 'Today',
    title: 'Reminder drafts',
    prompt: 'Draft a polite reminder for a customer who is 10 days late.',
    summary:
      'The draft is short, names the invoice and offers two ways to pay. It is saved in Notion under Templates.',
  },
  {
    id: 'goma',
    day: 'Yesterday',
    title: 'Goma supplier call notes',
    prompt: 'Turn my notes from the Goma supplier call into three actions.',
    summary:
      'Confirm the November price, ask for the delivery calendar and send the signed order by Friday.',
  },
  {
    id: 'prices',
    day: 'Yesterday',
    title: 'Price list for Lubumbashi',
    prompt: 'Update the Lubumbashi price list with the new rice price.',
    summary:
      'Rice is now 38 USD for a 25 kg bag. The sheet marks the change and keeps the old price in a note.',
  },
  {
    id: 'close',
    day: 'Earlier this week',
    title: 'Quarter close checklist',
    prompt: 'Build a checklist for closing the quarter in all three depots.',
    summary:
      'Nine steps, grouped by depot. Each has an owner and a date, and the last one is the review on 30 November.',
  },
  {
    id: 'onboarding',
    day: 'Earlier this week',
    title: 'Onboarding emails',
    prompt: 'Rewrite the three onboarding emails so each asks for one thing.',
    summary:
      'Each email now asks for one action: confirm the account, add a depot, invite a colleague.',
  },
  {
    id: 'trucks',
    day: 'Earlier this week',
    title: 'Truck maintenance schedule',
    prompt: 'List which trucks are due for maintenance this month.',
    summary:
      'Four of the nine trucks are due. Two are at the Lubumbashi depot, and the oldest is 6,000 km past its service.',
  },
];

const FALLBACK_SESSION = PAST_SESSIONS[0];

export function pastSessionOf(id: string) {
  const session = PAST_SESSIONS.find((candidate) => candidate.id === id);
  return session ?? FALLBACK_SESSION;
}

export type Effort = 1 | 2 | 3 | 4 | 5;

export const EFFORTS: Effort[] = [1, 2, 3, 4, 5];

export const EFFORT_WORD: Record<Effort, string> = {
  1: 'Minimal',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Maximum',
};

export const EFFORT_WORDS = EFFORTS.map((level) => EFFORT_WORD[level]);

export const STARTING_EFFORT: Effort = 3;

export type ToolId = 'googledrive' | 'notion' | 'whatsapp' | 'gmail' | 'linear';

export type ToolOption = {
  id: ToolId;
  name: string;
  brand: BrandSlug;
};

export const TOOLS: ToolOption[] = [
  { id: 'googledrive', name: 'Google Drive', brand: 'googledrive' },
  { id: 'notion', name: 'Notion', brand: 'notion' },
  { id: 'whatsapp', name: 'WhatsApp', brand: 'whatsapp' },
  { id: 'gmail', name: 'Gmail', brand: 'gmail' },
  { id: 'linear', name: 'Linear', brand: 'linear' },
];

const FALLBACK_TOOL = TOOLS[0];

export function toolOf(id: ToolId) {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  return tool ?? FALLBACK_TOOL;
}

export type SkillId = 'reconcile' | 'polite' | 'summarise';

export type SkillOption = {
  id: SkillId;
  name: string;
  hint: string;
};

export const SKILLS: SkillOption[] = [
  {
    id: 'reconcile',
    name: 'Reconcile payments',
    hint: 'Match payments to invoices',
  },
  { id: 'polite', name: 'Polite tone', hint: 'Short, warm, no pressure' },
  { id: 'summarise', name: 'Summarise a thread', hint: 'Keep decisions only' },
];

const FALLBACK_SKILL = SKILLS[0];

export function skillOf(id: SkillId) {
  const skill = SKILLS.find((candidate) => candidate.id === id);
  return skill ?? FALLBACK_SKILL;
}

export const DEMO_TOOLS: ToolId[] = ['googledrive', 'notion', 'whatsapp'];

export const DEMO_SKILL: SkillId = 'reconcile';

export const DEMO_EFFORT: Effort = 4;

export type AttachmentKind = 'photo' | 'file';

export type Attachment = {
  id: string;
  kind: AttachmentKind;
  name: string;
  bytes: number;
};

export const DEMO_PHOTO: Attachment = {
  id: 'demo-photo',
  kind: 'photo',
  name: 'depot-whiteboard.jpg',
  bytes: 1_800_000,
};

export const DEMO_FILE: Attachment = {
  id: 'demo-file',
  kind: 'file',
  name: 'invoices-march.csv',
  bytes: 48_200,
};

export const MAX_ATTACHMENTS = 4;

export const MAX_QUEUED = 3;

export const FULL_HINT = `${MAX_ATTACHMENTS} files fit in one message. Remove one to add another`;

export const QUEUE_FULL_HINT = `${MAX_QUEUED} messages are already waiting. Remove one to queue another`;

export const QUESTION =
  'Which invoices from the Kinshasa and Goma depots are still unpaid? Draft a reminder for each customer.';

export const FOLLOW_UP = 'Share the list with the finance team';

export const FOLLOW_UP_REPLY =
  'This demonstration plays one scripted session. Replay it to watch it again.';

export const THOUGHT =
  'I need the March invoices, the payments that came in and a contact for each customer. A reminder is a message to a customer, so I will ask before anything is sent.';

export const THOUGHT_WORDS = wordsOf(THOUGHT);

export type SeedId = 'unpaid' | 'share' | 'canned';

export type StepId = 'invoices' | 'match' | 'contacts' | 'reminders' | 'share';

export type StepKind = 'tool' | 'skill';

export type ResultKind = 'invoices' | 'shared';

export type StepSeed = {
  id: StepId;
  kind: StepKind;
  title: string;
  detail: string;
  doneSummary: string;
  brand?: BrandSlug;
  product?: string;
  input: string;
  output: string;
  usd: number;
  result?: ResultKind;
  needsApproval?: boolean;
};

export type TurnSeed = {
  id: SeedId;
  thought?: string;
  steps: StepSeed[];
  answer: string;
};

const UNPAID_STEPS: StepSeed[] = [
  {
    id: 'invoices',
    kind: 'tool',
    title: 'Read invoices-march.csv',
    detail: 'Three depots, one row per invoice',
    doneSummary: '212 invoices read',
    brand: 'googledrive',
    product: 'Google Drive',
    input: 'file: invoices-march.csv',
    output: '212 rows, 3 depots, 5 columns',
    usd: 0.011,
  },
  {
    id: 'match',
    kind: 'skill',
    title: 'Match payments to invoices',
    detail: 'Reconcile payments skill',
    doneSummary: '7 invoices have no payment',
    input: 'skill: Reconcile payments',
    output: '205 matched, 7 unpaid, 4,310 USD',
    usd: 0.016,
    result: 'invoices',
  },
  {
    id: 'contacts',
    kind: 'tool',
    title: 'Look up the customers',
    detail: 'The customer contacts page',
    doneSummary: '7 contacts found',
    brand: 'notion',
    product: 'Notion',
    input: 'page: Customer contacts',
    output: '7 numbers, 7 preferred names',
    usd: 0.009,
  },
  {
    id: 'reminders',
    kind: 'tool',
    title: 'Send the reminders',
    detail: 'Seven messages, one per customer',
    doneSummary: '7 reminders sent',
    brand: 'whatsapp',
    product: 'WhatsApp',
    input: 'messages: 7',
    output: '7 delivered',
    usd: 0.007,
    needsApproval: true,
  },
];

const SHARE_STEPS: StepSeed[] = [
  {
    id: 'share',
    kind: 'tool',
    title: 'Share unpaid-march.xlsx',
    detail: 'With the finance team',
    doneSummary: 'Shared with 3 people',
    brand: 'googledrive',
    product: 'Google Drive',
    input: 'file: unpaid-march.xlsx, people: 3',
    output: '3 invitations sent, comment access',
    usd: 0.006,
    result: 'shared',
  },
];

const UNPAID_ANSWER =
  '7 invoices from Kinshasa and Goma are still unpaid, 4,310 USD in total. I sent each customer a reminder on WhatsApp and kept the list in the card above.';

const SHARE_ANSWER =
  'The list is shared with the finance team. They can comment on it, and the reminders stay with you.';

const UNPAID_SEED: TurnSeed = {
  id: 'unpaid',
  thought: THOUGHT,
  steps: UNPAID_STEPS,
  answer: UNPAID_ANSWER,
};

const SHARE_SEED: TurnSeed = {
  id: 'share',
  steps: SHARE_STEPS,
  answer: SHARE_ANSWER,
};

const CANNED_SEED: TurnSeed = {
  id: 'canned',
  steps: [],
  answer: FOLLOW_UP_REPLY,
};

const SEEDS: TurnSeed[] = [UNPAID_SEED, SHARE_SEED, CANNED_SEED];

export function seedOf(id: SeedId) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  return seed ?? CANNED_SEED;
}

const FALLBACK_STEP = UNPAID_STEPS[0];

export function stepSeedOf(id: StepId) {
  for (const seed of SEEDS) {
    const step = seed.steps.find((candidate) => candidate.id === id);
    if (step) {
      return step;
    }
  }
  return FALLBACK_STEP;
}

export const THOUGHT_USD = 0.004;

export const ANSWER_USD = 0.005;

/** Thinking harder costs more: the price of a step follows the effort it was asked at. */
export const EFFORT_RATE: Record<Effort, number> = {
  1: 0.5,
  2: 0.75,
  3: 1,
  4: 1.4,
  5: 1.9,
};

export const NEW_ID = 'new';

export type Person = {
  name: string;
  role: string;
};

export type Invoice = {
  id: string;
  customer: string;
  depot: string;
  amountUsd: number;
  daysLate: number;
};

/** Invented customers and amounts. The figures are illustrative. */
export const UNPAID: Invoice[] = [
  {
    id: 'inv-2041',
    customer: 'Patrick Mbuyi',
    depot: 'Kinshasa',
    amountUsd: 640,
    daysLate: 12,
  },
  {
    id: 'inv-2057',
    customer: 'Chantal Kabeya',
    depot: 'Goma',
    amountUsd: 415,
    daysLate: 9,
  },
  {
    id: 'inv-2063',
    customer: 'Joël Mukendi',
    depot: 'Kinshasa',
    amountUsd: 1280,
    daysLate: 21,
  },
];

export const UNPAID_TOTAL = { count: 7, usd: 4310 };

export const FINANCE_TEAM: Person[] = [
  { name: 'Amani Tshibola', role: 'Finance lead, Kinshasa' },
  { name: 'Odette Banza', role: 'Accounts, Lubumbashi' },
  { name: 'Reuben Kalala', role: 'Accounts, Goma' },
];

export const REMINDER_PREVIEW =
  'Hello Patrick, invoice 2041 for 640 USD is 12 days past its date. You can settle it by mobile money or at the depot. Thank you.';

export const REQUEST_RECIPIENTS: Person[] = [
  { name: 'Patrick Mbuyi', role: 'Kinshasa' },
  { name: 'Chantal Kabeya', role: 'Goma' },
];

export const DECLINED_LINE =
  'Nothing was sent. The list of unpaid invoices stays above';

export const SENT_LINE = '7 reminders sent on WhatsApp';
