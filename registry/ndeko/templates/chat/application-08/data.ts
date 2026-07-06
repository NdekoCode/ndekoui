import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { wordsOf } from '@/registry/ndeko/lib/words';

export const BRAND = { name: 'Quenby' };

export type Agent = {
  name: string;
  series: SeriesSlot;
};

export const ASSISTANT: Agent = { name: 'Quenby', series: 1 };

export type ModelId =
  'claude-sonnet' | 'claude-opus' | 'gpt-mini' | 'gemini-pro';

export type ModelOption = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
  usdPerThousandTokens: number;
};

/** Coarse price tiers, not the price list of any maker. The figures are illustrative. */
export const MODELS: ModelOption[] = [
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    brand: 'claude',
    usdPerThousandTokens: 0.006,
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    brand: 'claude',
    usdPerThousandTokens: 0.03,
  },
  {
    id: 'gpt-mini',
    name: 'GPT mini',
    brand: 'openai',
    usdPerThousandTokens: 0.002,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    brand: 'gemini',
    usdPerThousandTokens: 0.008,
  },
];

export const STARTING_MODEL: ModelId = 'claude-sonnet';

export const DEMO_MODEL: ModelId = 'claude-opus';

const FALLBACK_MODEL = MODELS[0];

export function modelOf(id: ModelId) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? FALLBACK_MODEL;
}

export type Day = 'Today' | 'Yesterday' | 'Previous 7 days';

export const DAYS: Day[] = ['Today', 'Yesterday', 'Previous 7 days'];

export type ChatLine = {
  from: 'person' | 'assistant';
  text: string;
};

export type Chat = {
  id: string;
  day: Day;
  title: string;
  lines: ChatLine[];
};

export const LIVE_ID = 'live';

export const NEW_ID = 'new';

export const NEW_CHAT_TITLE = 'New chat';

export const LIVE_TITLE = 'Goma lot to Antwerp';

/** Invented chats about an invented exporter. They only open as read-only transcripts. */
export const CHATS: Chat[] = [
  {
    id: 'stock',
    day: 'Today',
    title: 'Weekly stock count',
    lines: [
      {
        from: 'person',
        text: 'Which depots have not sent their stock count this week?',
      },
      {
        from: 'assistant',
        text: 'Kinshasa and Goma have. Lubumbashi is the only depot still missing, and its count is due today.',
      },
    ],
  },
  {
    id: 'numbering',
    day: 'Today',
    title: 'Invoice numbering rules',
    lines: [
      { from: 'person', text: 'What numbering do we use for credit notes?' },
      {
        from: 'assistant',
        text: 'Credit notes carry the prefix CN and the year, then a four digit counter, for example CN-2026-0042.',
      },
    ],
  },
  {
    id: 'insurance',
    day: 'Yesterday',
    title: 'Carrier insurance clauses',
    lines: [
      {
        from: 'person',
        text: 'Summarise the insurance clause in the carrier contract.',
      },
      {
        from: 'assistant',
        text: 'Cargo is covered up to 80,000 USD per shipment. Anything above needs a rider, which the carrier prices on request.',
      },
    ],
  },
  {
    id: 'hiring',
    day: 'Yesterday',
    title: 'Lubumbashi depot hiring plan',
    lines: [
      {
        from: 'person',
        text: 'Draft a hiring plan for two loaders at the Lubumbashi depot.',
      },
      {
        from: 'assistant',
        text: 'Post the role on 12 November, interview the week of 17 November and confirm both offers by 25 November, so they start on 1 December.',
      },
    ],
  },
  {
    id: 'customs',
    day: 'Previous 7 days',
    title: 'Customs checklist for coffee',
    lines: [
      {
        from: 'person',
        text: 'List the documents for a coffee export from Goma.',
      },
      {
        from: 'assistant',
        text: 'The certificate of origin, the phytosanitary certificate, the packing list, the commercial invoice and the export declaration, all filed before loading.',
      },
    ],
  },
  {
    id: 'brief',
    day: 'Previous 7 days',
    title: 'Supplier brief in French',
    lines: [
      { from: 'person', text: 'Translate the supplier brief into French.' },
      {
        from: 'assistant',
        text: 'Done. I kept the product names in English and used the formal vous throughout.',
      },
    ],
  },
  {
    id: 'fuel',
    day: 'Previous 7 days',
    title: 'Kinshasa fuel price sheet',
    lines: [
      { from: 'person', text: 'Update the fuel price sheet for Kinshasa.' },
      {
        from: 'assistant',
        text: 'The sheet lists the three stations you track. Prices stay marked as estimates until you confirm them.',
      },
    ],
  },
];

const FALLBACK_CHAT = CHATS[0];

export function chatOf(id: string) {
  const chat = CHATS.find((candidate) => candidate.id === id);
  return chat ?? FALLBACK_CHAT;
}

export const QUESTION =
  'Can the Goma coffee lot reach Antwerp before 28 November, and what will it cost?';

/** The live chat suggests the question its run answers. A new chat suggests others, which only get the stock reply. */
export const LIVE_SUGGESTIONS: string[] = [QUESTION];

export const NEW_SUGGESTIONS: string[] = [
  'Summarise the carrier contract for the Lubumbashi depot',
  'Draft a reminder for the unpaid invoices from Kinshasa',
  'List what a new depot in Goma needs before it opens',
];

export const THOUGHT =
  'The question has two parts, a date and a cost. I need the booking notes, the sailing dates and the forwarder rates for the route that fits the date. The rate sheet belongs to the forwarder, so I will ask before I open it.';

export const THOUGHT_WORDS = wordsOf(THOUGHT);

export type StepId = 'booking' | 'sailings' | 'rates' | 'customs' | 'answer';

export type CallId = 'notes' | 'sailings' | 'rates' | 'customs';

export type PlanSeed = {
  id: StepId;
  title: string;
  callId?: CallId;
};

export const PLAN: PlanSeed[] = [
  { id: 'booking', title: 'Read the booking notes', callId: 'notes' },
  { id: 'sailings', title: 'Check the sailing dates', callId: 'sailings' },
  { id: 'rates', title: 'Read the forwarder rates', callId: 'rates' },
  { id: 'customs', title: 'Check the customs deadline', callId: 'customs' },
  { id: 'answer', title: 'Write the answer' },
];

const FALLBACK_STEP = PLAN[0];

export function planSeedOf(id: StepId) {
  const seed = PLAN.find((candidate) => candidate.id === id);
  return seed ?? FALLBACK_STEP;
}

export type CallSeed = {
  id: CallId;
  title: string;
  brand: BrandSlug;
  product: string;
  inputTokens: number;
  outputTokens: number;
};

export const CALLS: CallSeed[] = [
  {
    id: 'notes',
    title: 'Goma lot 14, booking notes',
    brand: 'notion',
    product: 'Notion',
    inputTokens: 1420,
    outputTokens: 180,
  },
  {
    id: 'sailings',
    title: 'Sailing calendar, November',
    brand: 'googlecalendar',
    product: 'Google Calendar',
    inputTokens: 960,
    outputTokens: 120,
  },
  {
    id: 'rates',
    title: 'Forwarder rate sheet, November',
    brand: 'googledrive',
    product: 'Google Drive',
    inputTokens: 2310,
    outputTokens: 260,
  },
  {
    id: 'customs',
    title: 'SHIP-31 Certificate of origin',
    brand: 'linear',
    product: 'Linear',
    inputTokens: 840,
    outputTokens: 110,
  },
];

const FALLBACK_CALL = CALLS[0];

export function callSeedOf(id: CallId) {
  const seed = CALLS.find((candidate) => candidate.id === id);
  return seed ?? FALLBACK_CALL;
}

export const THOUGHT_USAGE = { input: 640, output: 210 };

export const ANSWER_USAGE = { input: 0, output: 310 };

export const CONTEXT_LIMIT = 200_000;

export type Source = {
  number: number;
  callId: CallId;
  title: string;
  excerpt: string;
  brand: BrandSlug;
  product: string;
};

export const SOURCES: Source[] = [
  {
    number: 1,
    callId: 'notes',
    title: 'Goma lot 14, booking notes',
    excerpt: '14 pallets, ready to load on 12 November',
    brand: 'notion',
    product: 'Notion',
  },
  {
    number: 2,
    callId: 'sailings',
    title: 'Sailing calendar, November',
    excerpt: 'Mombasa to Antwerp, leaves 15 November',
    brand: 'googlecalendar',
    product: 'Google Calendar',
  },
  {
    number: 3,
    callId: 'rates',
    title: 'Forwarder rate sheet, November',
    excerpt: 'Mombasa 2,140 USD, Dar es Salaam 2,450 USD',
    brand: 'googledrive',
    product: 'Google Drive',
  },
  {
    number: 4,
    callId: 'customs',
    title: 'SHIP-31 Certificate of origin',
    excerpt: 'To be filed by 20 November, still open',
    brand: 'linear',
    product: 'Linear',
  },
];

const FALLBACK_SOURCE = SOURCES[0];

export function sourceOf(number: number) {
  const source = SOURCES.find((candidate) => candidate.number === number);
  return source ?? FALLBACK_SOURCE;
}

const ANSWER =
  'Yes, through Mombasa. The lot is 14 pallets and ready to load on 12 November. [1] The only sailing that lands in Antwerp before 28 November leaves Mombasa on 15 November. [2] The forwarder quotes 2,140 USD for the lot on that route, 310 USD less than through Dar es Salaam. [3] The certificate of origin has to be filed by 20 November, and its issue is still open. [4]';

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
  name: string;
  role: string;
};

export const FORWARDER_CONTACT: Person = {
  name: 'Jean-Pierre Kasongo',
  role: 'Forwarder, Mombasa desk',
};

export const REQUEST = {
  file: 'Forwarder rate sheet, November',
  access: 'Read only, for this run',
  reason: 'The Mombasa and Dar es Salaam quotes are only in this sheet',
};

export const DECLINED_LINE =
  'Not read. The run stopped before the rates, so there is no cost to give yet';

export const STOPPED_LINE =
  'Stopped by you. The steps that were left did not run';

export const FOLLOW_UP_REPLY =
  'This demonstration plays one scripted run. Replay it to watch it again.';
