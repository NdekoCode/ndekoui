import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

import { wordsOf } from './words';

export const BRAND = { name: 'Oatfield', initial: 'O', desk: 'Support' };

export const ME = { name: 'Noor Haddad', initials: 'NH' };

export type Agent = {
  name: string;
  initial: string;
  series: SeriesSlot;
};

export const WRITER: Agent = { name: 'Writer', initial: 'W', series: 3 };

export type Model = {
  name: string;
  brand: BrandSlug;
};

export const MODEL: Model = { name: 'Claude Haiku', brand: 'claude' };

export type TicketStatus = 'open' | 'pending' | 'solved';

export type Priority = 'high' | 'normal' | 'low';

export type Customer = {
  name: string;
  initials: string;
  email: string;
  plan: string;
  orders: string;
  lastContact: string;
};

export type Ticket = {
  id: string;
  subject: string;
  receivedAgo: string;
  status: TicketStatus;
  priority: Priority;
  isUnread: boolean;
  customer: Customer;
  message: string;
  attachment?: string;
};

export const SCRIPTED_TICKET = 'torn-bag';

/** Invented customers, orders and amounts. The figures are illustrative. */
export const TICKETS: Ticket[] = [
  {
    id: SCRIPTED_TICKET,
    subject: 'One bag arrived torn',
    receivedAgo: '12 min',
    status: 'open',
    priority: 'high',
    isUnread: true,
    customer: {
      name: 'Ines Marchetti',
      initials: 'IM',
      email: 'ines@marchetti.example',
      plan: 'Monthly, 2 bags',
      orders: '14 since March 2023',
      lastContact: 'None before today',
    },
    message:
      'Hi, my order OF-20418 came today and one of the two bags is torn open, there is coffee all over the box. Can I get a refund for that bag?',
    attachment: 'torn-bag.jpg',
  },
  {
    id: 'grind',
    subject: 'Change my grind to espresso',
    receivedAgo: '38 min',
    status: 'open',
    priority: 'normal',
    isUnread: true,
    customer: {
      name: 'Tomas Brandt',
      initials: 'TB',
      email: 'tomas@brandt.example',
      plan: 'Every two weeks, 1 bag',
      orders: '6 since January',
      lastContact: '3 weeks ago',
    },
    message:
      'I bought an espresso machine. Could my next bags be ground for espresso instead of filter?',
  },
  {
    id: 'pause',
    subject: 'Pause my plan for August',
    receivedAgo: '2 h',
    status: 'pending',
    priority: 'low',
    isUnread: false,
    customer: {
      name: 'Aiko Tanaka',
      initials: 'AT',
      email: 'aiko@tanaka.example',
      plan: 'Monthly, 2 bags',
      orders: '9 since last June',
      lastContact: 'Yesterday',
    },
    message:
      'I am away all of August. Can you pause my plan and start it again in September?',
  },
  {
    id: 'address',
    subject: 'New delivery address',
    receivedAgo: '3 h',
    status: 'open',
    priority: 'normal',
    isUnread: false,
    customer: {
      name: 'Samuel Okoye',
      initials: 'SO',
      email: 'samuel@okoye.example',
      plan: 'Monthly, 1 bag',
      orders: '22 since 2022',
      lastContact: '5 months ago',
    },
    message:
      'We move on the 1st. Please send the next delivery to the new address, it is saved in my account.',
  },
  {
    id: 'gift',
    subject: 'Gift card not applied',
    receivedAgo: 'Yesterday',
    status: 'solved',
    priority: 'normal',
    isUnread: false,
    customer: {
      name: 'Clara Jensen',
      initials: 'CJ',
      email: 'clara@jensen.example',
      plan: 'One order',
      orders: '1 this month',
      lastContact: 'Yesterday',
    },
    message:
      'I entered my gift card at checkout and still paid the full price.',
  },
];

const FALLBACK_TICKET = TICKETS[0];

export function ticketOf(id: string) {
  const ticket = TICKETS.find((candidate) => candidate.id === id);
  return ticket ?? FALLBACK_TICKET;
}

export const EARLIER_REPLIES: Partial<Record<string, string>> = {
  gift: 'Hi Clara, the card is now applied and the difference is back on your payment method. Noor, Oatfield support',
};

export const CUSTOMER_FIELDS: { key: keyof Customer; label: string }[] = [
  { key: 'plan', label: 'Plan' },
  { key: 'orders', label: 'Orders' },
  { key: 'lastContact', label: 'Last contact' },
];

export type StepId = 'read' | 'lookup' | 'search' | 'draft';

export type CopilotStep = {
  id: StepId;
  title: string;
  detail: string;
  doneSummary: string;
};

export const STEPS: CopilotStep[] = [
  {
    id: 'read',
    title: 'Read the ticket',
    detail: 'One message and one photo',
    doneSummary: 'A torn bag, asks for a refund',
  },
  {
    id: 'lookup',
    title: 'Look up the customer',
    detail: 'Plan, orders and earlier tickets',
    doneSummary: 'On a monthly plan, never wrote before',
  },
  {
    id: 'search',
    title: 'Search the help center',
    detail: 'damaged bag refund',
    doneSummary: '2 articles apply',
  },
  {
    id: 'draft',
    title: 'Draft a reply',
    detail: 'From the two articles',
    doneSummary: 'Ready in the reply box',
  },
];

const FALLBACK_STEP = STEPS[0];

export function stepOf(id: StepId) {
  const step = STEPS.find((candidate) => candidate.id === id);
  return step ?? FALLBACK_STEP;
}

export type Article = {
  number: number;
  title: string;
  excerpt: string;
};

export const ARTICLES: Article[] = [
  {
    number: 1,
    title: 'Damaged or missing items',
    excerpt: 'A bag that arrives damaged is refunded in full.',
  },
  {
    number: 2,
    title: 'When a refund reaches your card',
    excerpt: 'Refunds reach the card in 3 to 5 working days.',
  },
];

const FALLBACK_ARTICLE = ARTICLES[0];

export function articleOf(number: number) {
  const article = ARTICLES.find((candidate) => candidate.number === number);
  return article ?? FALLBACK_ARTICLE;
}

export type Refund = {
  amount: string;
  card: string;
  cardBrand: BrandSlug;
  order: string;
  reason: string;
};

export const REFUND: Refund = {
  amount: '$19.00',
  card: 'Visa ending 4417',
  cardBrand: 'visa',
  order: 'OF-20418',
  reason: 'One of two bags arrived torn, with a photo',
};

/** True whether the refund is allowed or denied: the reply only says it was asked for. */
const DRAFT =
  'Hi Ines, I am sorry one of your bags arrived torn. Damaged bags are refunded in full, [1] so I have asked for a refund of $19.00 on order OF-20418. You will get an email as soon as it is confirmed, and the money reaches your card within 3 to 5 working days. [2] Your next delivery is not affected. Noor, Oatfield support';

export type DraftToken =
  { kind: 'word'; text: string } | { kind: 'cite'; article: number };

const CITE = /^\[(\d+)\]$/;

function tokenOf(piece: string): DraftToken {
  const match = CITE.exec(piece);
  if (match) {
    const article = Number(match[1]);
    return { kind: 'cite', article };
  }
  return { kind: 'word', text: piece };
}

const DRAFT_PIECES = wordsOf(DRAFT);

export const DRAFT_TOKENS = DRAFT_PIECES.map(tokenOf);

function isWordPiece(piece: string) {
  return !CITE.test(piece);
}

const DRAFT_WORDS = DRAFT_PIECES.filter(isWordPiece);

/** What Insert puts in the reply box: the draft without its marks. */
export const DRAFT_TEXT = DRAFT_WORDS.join(' ');

export const EMPTY_SEND_HINT =
  'Write a reply or insert the draft before you send';
