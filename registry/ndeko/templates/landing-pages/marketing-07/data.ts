import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import {
  GlobeIcon,
  HeadphonesIcon,
  type Icon,
  ShieldCheckIcon,
  WalletIcon,
} from '@/registry/ndeko/lib/icons';

export const CARDS_ANCHOR = 'cards';

export const FEED_ANCHOR = 'feed';

export const PERKS_ANCHOR = 'perks';

export const LAUNCH_ANCHOR = 'launch';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'cards', label: 'Cards', href: `#${CARDS_ANCHOR}` },
  { id: 'feed', label: 'Live feed', href: `#${FEED_ANCHOR}` },
  { id: 'perks', label: 'Perks', href: `#${PERKS_ANCHOR}` },
  { id: 'launch', label: 'Launch', href: `#${LAUNCH_ANCHOR}` },
];

export const BRAND = {
  name: 'Tallypot',
  tagline: 'A payment card a group shares',
  copyright: '© 2026 Tallypot',
};

export const HEADER = {
  action: 'Reserve a card',
  shortAction: 'Reserve',
  actionHref: `#${LAUNCH_ANCHOR}`,
};

export const HERO = {
  eyebrow: 'Launching soon',
  title: 'One card for the whole group',
  description:
    'Tallypot is a payment card a group shares. Everyone pays with it, everyone sees who paid what, and the split is settled before the receipt is printed.',
  primaryAction: 'Reserve a card',
  secondaryAction: 'Watch a split happen',
};

export type GroupCard = {
  id: string;
  name: string;
  series: SeriesSlot;
  network: BrandSlug;
  networkName: string;
  last4: string;
  members: string[];
  spentCents: number;
};

export const CARDS_SECTION = {
  note: 'Illustrative groups and balances',
  hint: 'Drag the cards, use the arrow keys or pick a dot',
};

export const START_INDEX = 2;

export const GROUP_CARDS: GroupCard[] = [
  {
    id: 'lisbon',
    name: 'Lisbon trip',
    series: 1,
    network: 'visa',
    networkName: 'Visa',
    last4: '4821',
    members: ['Amani Kasongo', 'Inès Duarte', 'Kofi Asante', 'Mira Holm'],
    spentCents: 128450,
  },
  {
    id: 'flat',
    name: 'Flat 4B',
    series: 2,
    network: 'mastercard',
    networkName: 'Mastercard',
    last4: '9034',
    members: ['Esther Mbuyi', 'Peter Otieno', 'Marta Silva'],
    spentCents: 64210,
  },
  {
    id: 'lunch',
    name: 'Team lunches',
    series: 3,
    network: 'visa',
    networkName: 'Visa',
    last4: '7716',
    members: [
      'Samuel Mukendi',
      'Naomi Lutumba',
      'Daniel Okafor',
      'Camille Ndala',
      'Aline Kabongo',
    ],
    spentCents: 31890,
  },
  {
    id: 'wedding',
    name: 'Lubumbashi wedding',
    series: 4,
    network: 'mastercard',
    networkName: 'Mastercard',
    last4: '2250',
    members: [
      'Aline Kabongo',
      'Samuel Mukendi',
      'Esther Mbuyi',
      'Amani Kasongo',
    ],
    spentCents: 482000,
  },
  {
    id: 'climbing',
    name: 'Climbing club',
    series: 5,
    network: 'visa',
    networkName: 'Visa',
    last4: '6602',
    members: ['Peter Otieno', 'Mira Holm', 'Kofi Asante'],
    spentCents: 18775,
  },
];

export const GOAL = {
  title: 'A pot that reaches its goal',
  description:
    'Set a goal for the group and every payment moves the pot closer. When it is reached, everyone sees it at once.',
  caption: 'Lubumbashi wedding fund, pooled by 4 people',
  figure: 4820,
  note: 'Illustrative figure',
  replay: 'Drop it again',
};

export type FeedEvent = {
  id: string;
  payer: string;
  place: string;
  amountCents: number;
  ways: number;
  owing: string[];
};

export const FEED_SECTION = {
  title: 'See who paid what as it happens',
  description:
    'Each payment shows up with its split. Open a row to see who owes their share.',
  totalLabel: 'Spent this month',
  yourShareLabel: 'Your share',
  note: 'Illustrative group, names and amounts',
};

export const FEED_START_CENTS = 128450;

export const YOUR_SHARE = 0.25;

export const FEED_EVENTS: FeedEvent[] = [
  {
    id: 'market',
    payer: 'Amani Kasongo',
    place: 'Fish market, Marché Central',
    amountCents: 4200,
    ways: 4,
    owing: ['Inès Duarte', 'Kofi Asante', 'Mira Holm'],
  },
  {
    id: 'taxi',
    payer: 'Inès Duarte',
    place: 'Taxi to the airport',
    amountCents: 1840,
    ways: 4,
    owing: ['Amani Kasongo', 'Kofi Asante', 'Mira Holm'],
  },
  {
    id: 'dinner',
    payer: 'Kofi Asante',
    place: 'Dinner by the river',
    amountCents: 9600,
    ways: 4,
    owing: ['Amani Kasongo', 'Inès Duarte', 'Mira Holm'],
  },
  {
    id: 'coffee',
    payer: 'Mira Holm',
    place: 'Coffee, morning',
    amountCents: 720,
    ways: 2,
    owing: ['Kofi Asante'],
  },
  {
    id: 'apartment',
    payer: 'Amani Kasongo',
    place: 'Apartment, two nights',
    amountCents: 21000,
    ways: 4,
    owing: ['Inès Duarte', 'Kofi Asante', 'Mira Holm'],
  },
  {
    id: 'groceries',
    payer: 'Inès Duarte',
    place: 'Groceries',
    amountCents: 3360,
    ways: 4,
    owing: ['Amani Kasongo', 'Kofi Asante', 'Mira Holm'],
  },
  {
    id: 'metro',
    payer: 'Kofi Asante',
    place: 'Metro tickets',
    amountCents: 1400,
    ways: 4,
    owing: ['Amani Kasongo', 'Inès Duarte', 'Mira Holm'],
  },
  {
    id: 'boat',
    payer: 'Mira Holm',
    place: 'Boat tour',
    amountCents: 6400,
    ways: 4,
    owing: ['Amani Kasongo', 'Inès Duarte', 'Kofi Asante'],
  },
];

export const FEED_VISIBLE = 4;

export type Perk = {
  id: string;
  icon: Icon;
  title: string;
  description: string;
  threshold: number;
};

export const PERKS_SECTION = {
  title: 'Perks the group earns together',
  description:
    'Move the slider to the group spend of a month. Each perk fills as the group gets closer to it and ticks when it is reached.',
  spendLabel: 'Group spend in a month',
  note: 'Illustrative perks and thresholds, in US dollars',
};

export const SPEND_RANGE = { min: 0, max: 2400, step: 50 };

export const DEFAULT_SPEND = 1900;

export const PERKS: Perk[] = [
  {
    id: 'fx',
    icon: GlobeIcon,
    title: 'No foreign fee',
    description: 'Pay abroad at the rate of the day with nothing added',
    threshold: 300,
  },
  {
    id: 'cashback',
    icon: WalletIcon,
    title: 'Group cashback',
    description: 'A share of the monthly spend returns to the pot',
    threshold: 800,
  },
  {
    id: 'cover',
    icon: ShieldCheckIcon,
    title: 'Trip cover',
    description: 'Delays and lost bags are covered for the whole group',
    threshold: 1500,
  },
  {
    id: 'support',
    icon: HeadphonesIcon,
    title: 'Priority support',
    description: 'A person answers within the hour',
    threshold: 2200,
  },
];

export const LAUNCH = {
  title: 'Cards ship on 1 February 2027',
  description:
    'Reserve a card now and the first group on the list gets it first. Reserving costs nothing and can be cancelled.',
  at: Date.UTC(2027, 1, 1, 8, 0, 0),
  units: ['Days', 'Hours', 'Minutes', 'Seconds'],
  launched: 'Cards are shipping',
  action: 'Reserve a card',
};

export const SHARE = {
  title: 'Invite the group before the card arrives',
  description:
    'Send the link to the people who will pay with the card. They join the group, and their share is ready on day one.',
  link: 'tallypot.example/join/lisbon-4821',
  shareTitle: 'Join our Tallypot group',
  shareText: 'Join the Lisbon trip group on Tallypot',
  copyLabel: 'Copy link',
  shareLabel: 'Share',
  members: ['Amani Kasongo', 'Inès Duarte', 'Kofi Asante'],
  invited: 'Mira Holm',
  networksTitle: 'Pays where you already pay',
};

export type NetworkMark = {
  id: BrandSlug;
  name: string;
};

export const NETWORKS: NetworkMark[] = [
  { id: 'applepay', name: 'Apple Pay' },
  { id: 'googlepay', name: 'Google Pay' },
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'Mastercard' },
];

export type FooterLink = {
  label: string;
  href: string;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Cards', href: `#${CARDS_ANCHOR}` },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];
