export type PlanId = 'starter' | 'team' | 'business';

export type Plan = {
  id: PlanId;
  name: string;
  /** Dollars a month. */
  price: number;
  seats: number;
  line: string;
};

export type MeterId = 'seats' | 'storage' | 'runs';

export type Meter = {
  id: MeterId;
  label: string;
  used: number;
  /** What the plan includes, so the meters follow a change of plan. */
  included: Record<PlanId, number>;
  unit: string;
  decimals: number;
};

export type CardBrand = 'visa' | 'mastercard' | 'americanexpress';

export type Card = {
  brand: CardBrand;
  last4: string;
  expiry: string;
  holder: string;
};

export type InvoiceStatus = 'paid' | 'refunded';

export type Invoice = {
  id: string;
  date: string;
  /** Dollars. */
  amount: number;
  status: InvoiceStatus;
  lines: string[];
};

export const WORKSPACE_NAME = 'Tidewell Studio';

export const RENEWAL_DATE = '30 Nov 2026';

export const RENEWAL_DAY = '30 Nov';

export const USAGE_RESETS_ON = '1 Dec';

/** From this share of what the plan includes, a meter turns to the warning pair. */
export const NEAR_LIMIT_SHARE = 0.8;

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    seats: 5,
    line: 'For a small team trying things out',
  },
  {
    id: 'team',
    name: 'Team',
    price: 96,
    seats: 20,
    line: 'Reports, automations and the desktop app',
  },
  {
    id: 'business',
    name: 'Business',
    price: 240,
    seats: 60,
    line: 'Everything in Team, with sign-in rules and audit logs',
  },
];

export const METERS: Meter[] = [
  {
    id: 'seats',
    label: 'Seats',
    used: 18,
    included: { starter: 5, team: 20, business: 60 },
    unit: 'seats',
    decimals: 0,
  },
  {
    id: 'storage',
    label: 'File storage',
    used: 61.4,
    included: { starter: 10, team: 100, business: 500 },
    unit: 'GB',
    decimals: 1,
  },
  {
    id: 'runs',
    label: 'Automation runs',
    used: 7860,
    included: { starter: 500, team: 10000, business: 50000 },
    unit: 'runs',
    decimals: 0,
  },
];

export const CARD: Card = {
  brand: 'visa',
  last4: '1881',
  expiry: '08/28',
  holder: 'Dana Whitfield',
};

export const CARD_BRAND_NAME: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  americanexpress: 'American Express',
};

export const INVOICES: Invoice[] = [
  {
    id: 'TW-2611',
    date: '1 Nov 2026',
    amount: 96,
    status: 'paid',
    lines: ['Team plan, November 2026: $96.00'],
  },
  {
    id: 'TW-2610',
    date: '1 Oct 2026',
    amount: 96,
    status: 'paid',
    lines: ['Team plan, October 2026: $96.00'],
  },
  {
    id: 'TW-2609',
    date: '1 Sep 2026',
    amount: 105.6,
    status: 'paid',
    lines: [
      'Team plan, September 2026: $96.00',
      'Automation runs over the plan: $9.60',
    ],
  },
  {
    id: 'TW-2608',
    date: '1 Aug 2026',
    amount: 96,
    status: 'refunded',
    lines: ['Team plan, August 2026: $96.00', 'Refunded on 4 Aug 2026'],
  },
];
