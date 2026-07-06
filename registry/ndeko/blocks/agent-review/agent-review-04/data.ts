import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export const TASK = 'Renew tallis.example for one year';

export const OPERATOR = {
  name: 'Operator',
  series: 2 as SeriesSlot,
};

export const PERSON = {
  name: 'Lena Brandt',
};

/** An invented registrar: it has no mark, so it wears a drawn initial. */
export const SITE = { name: 'Northgate Domains' };

export type PageId = 'blank' | 'list' | 'domain' | 'renew' | 'done';

export type PointerTarget = 'row' | 'renew' | 'period' | 'pay';

export type Period = 1 | 2;

export const PAGE_URL: Record<PageId, string> = {
  blank: 'about:blank',
  list: 'northgate.example/domains',
  domain: 'northgate.example/domains/tallis.example',
  renew: 'northgate.example/domains/tallis.example/renew',
  done: 'northgate.example/orders/confirmed',
};

export const DOMAINS = [
  { name: 'tallis.example', note: 'Expires in 12 days', isDue: true },
  { name: 'okapi.example', note: 'Renews by itself', isDue: false },
  { name: 'harbourline.example', note: 'Renews by itself', isDue: false },
];

export const YEAR_PRICE = 14;

export const ADDON_PRICE = 9;

export function totalOf(period: Period, hasAddon: boolean) {
  const addon = addonOf(hasAddon);
  const perYear = YEAR_PRICE + addon;
  return perYear * period;
}

function addonOf(hasAddon: boolean) {
  if (hasAddon) {
    return ADDON_PRICE;
  }
  return 0;
}

export const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
};

const PRICE = new Intl.NumberFormat('en-IE', PRICE_FORMAT);

export function formatPrice(amount: number) {
  return PRICE.format(amount);
}

export type AgentMove = {
  text: string;
  page: PageId;
  pointer: PointerTarget | null;
};

/** What the agent does, in order. Each move becomes a frame the scrubber can go back to. */
export const AGENT_MOVES: AgentMove[] = [
  { text: 'Found tallis.example in the list', page: 'list', pointer: 'row' },
  { text: 'Opened the domain', page: 'domain', pointer: 'renew' },
  {
    text: 'Opened the renewal form and kept 1 year',
    page: 'renew',
    pointer: 'period',
  },
  { text: 'Moved to Pay and asked you first', page: 'renew', pointer: 'pay' },
  { text: 'Paid. Renewed until 12 November 2027', page: 'done', pointer: null },
];

/** The move that spends money: it waits for a person before the next one runs. */
export const PAY_MOVE = 3;
