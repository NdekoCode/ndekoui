import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const CHAT_ANCHOR = 'chat';

export const ABILITIES_ANCHOR = 'abilities';

export const HERO = {
  eyebrow: 'An assistant for your day',
  title: 'Your day in one thread, handled by an assistant that asks first',
  description:
    'Tell Murmura what you need in plain words. It reads your calendar, mail and notes, does the small things, and waits for your yes before anything leaves your account.',
  primaryAction: 'Start free',
  primaryHref: `#${CHAT_ANCHOR}`,
  secondaryAction: 'Watch it work',
  secondaryHref: `#${ABILITIES_ANCHOR}`,
};

export const CHAT_SECTION = {
  title: 'Ask it the way you would ask a colleague',
  description:
    'Move a meeting, find a number, check what you promised. This sample plays on its own, and a click or a key hands it to you.',
};

export const PERSON = { name: 'Naomi Kabeya' };

export const ASSISTANT = { name: 'Murmura' };

export type ExchangeId = 'move' | 'friday' | 'promises' | 'fallback';

export type ToolLine = {
  brand: BrandSlug;
  label: string;
};

export type Exchange = {
  id: ExchangeId;
  prompt: string;
  tools: ToolLine[];
  answer: string;
};

export const EXCHANGES: Record<ExchangeId, Exchange> = {
  move: {
    id: 'move',
    prompt:
      'Move my Thursday call with Lisanga to Friday and let Dieudonné know',
    tools: [
      { brand: 'googlecalendar', label: 'Checked Thursday and Friday' },
      { brand: 'gmail', label: 'Wrote a note to Dieudonné' },
    ],
    answer:
      'Done. The call with Lisanga now starts Friday at 10:00, when you are both free. I wrote a short note to Dieudonné and left it in your drafts, so nothing has been sent.',
  },
  friday: {
    id: 'friday',
    prompt: 'What is on my plate on Friday?',
    tools: [
      { brand: 'googlecalendar', label: 'Read Friday' },
      { brand: 'notion', label: 'Opened your task list' },
    ],
    answer:
      'Three things. The call with Lisanga at 10:00, the quote for Ines Okafor due at noon, and the school pickup at 16:30. The quote fits between the call and lunch.',
  },
  promises: {
    id: 'promises',
    prompt: 'What did I promise this week?',
    tools: [
      { brand: 'gmail', label: 'Read your sent mail' },
      { brand: 'googledrive', label: 'Found the contract' },
    ],
    answer:
      'Four promises. The quote to Ines by Friday, a review of the contract for Dieudonné, a call to your sister on Sunday, and the weekly report on Wednesday. Two are done and two are still open.',
  },
  fallback: {
    id: 'fallback',
    prompt: '',
    tools: [],
    answer:
      'This is a sample conversation, so I only know the three questions on the chips below. Pick one and watch what I do.',
  },
};

export const DEMO_EXCHANGE_ID: ExchangeId = 'move';

export type Suggestion = {
  exchangeId: ExchangeId;
  label: string;
};

export const SUGGESTIONS: Suggestion[] = [
  { exchangeId: 'friday', label: 'What is on my plate on Friday?' },
  { exchangeId: 'promises', label: 'What did I promise this week?' },
  { exchangeId: 'move', label: 'Move my Thursday call to Friday' },
];

export const ABILITIES_SECTION = {
  title: 'Three things it does while you do something else',
  description:
    'Each one runs below on sample data, so you see what happens before you hand it anything real.',
};

export type AbilityId = 'plan' | 'draft' | 'promises';

export type Ability = {
  id: AbilityId;
  title: string;
  description: string;
  linkLabel: string;
};

export const ABILITIES: Ability[] = [
  {
    id: 'plan',
    title: 'Keeps the day from colliding',
    description:
      'When a new event lands on top of another one, Murmura looks for a free slot for the one that can move, checks the other person’s calendar, and tells you what it changed.',
    linkLabel: 'How planning works',
  },
  {
    id: 'draft',
    title: 'Drafts the reply, you press send',
    description:
      'It reads the message, writes an answer in your voice and leaves it for you. Nothing goes out of your outbox until you say so.',
    linkLabel: 'How drafts are kept',
  },
  {
    id: 'promises',
    title: 'Remembers what you promised',
    description:
      'Say you will send the quote by Friday anywhere in your day and it lands on one short list with a date. It ticks the promise off when it sees the work done.',
    linkLabel: 'How the list is built',
  },
];

export type DayEvent = {
  id: string;
  title: string;
  /** Hours after 9:00, so 1.5 is 10:30. */
  start: number;
  hours: number;
  timeLabel: string;
};

export const DAY_START_HOUR = 9;

export const DAY_HOURS = 7;

export const DAY_EVENTS: DayEvent[] = [
  {
    id: 'standup',
    title: 'Team standup',
    start: 0,
    hours: 0.5,
    timeLabel: '9:00',
  },
  {
    id: 'review',
    title: 'Design review',
    start: 1.5,
    hours: 1,
    timeLabel: '10:30',
  },
  {
    id: 'lunch',
    title: 'Lunch with Dieudonné',
    start: 3.5,
    hours: 1,
    timeLabel: '12:30',
  },
  {
    id: 'lisanga',
    title: 'Call with Lisanga',
    start: 6,
    hours: 1,
    timeLabel: '15:00',
  },
];

export const NEW_EVENT: DayEvent = {
  id: 'clinic',
  title: 'Clinic visit',
  start: 1.5,
  hours: 1,
  timeLabel: '10:30',
};

export const MOVED_REVIEW_START = 5;

export const PLAN_NOTES = {
  overlap: 'Clinic visit overlaps Design review',
  moved: 'Moved Design review to 14:00, when everyone invited is free',
  calm: 'Nothing overlaps today',
};

export const INCOMING = {
  from: 'Ines Okafor',
  time: '08:42',
  text: 'Can you send the quote before Friday? We would like to sign next week.',
};

export const DRAFT_REPLY =
  'Hello Ines, thank you for waiting. The quote covers the three phases we discussed and the price holds until the 28th. If it works for you, I can send the contract on Monday morning. Naomi';

export type Commitment = {
  id: string;
  text: string;
  due: string;
};

export const COMMITMENTS: Commitment[] = [
  { id: 'quote', text: 'Send the quote to Ines', due: 'Fri' },
  { id: 'contract', text: 'Review the contract for Dieudonné', due: 'Mon' },
  { id: 'sister', text: 'Call my sister', due: 'Sun' },
];

export const NEW_COMMITMENT: Commitment = {
  id: 'report',
  text: 'Ship the weekly report',
  due: 'Wed',
};
