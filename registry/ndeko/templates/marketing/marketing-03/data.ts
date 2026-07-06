import {
  GithubIcon,
  type Icon,
  LinkedinBrandIcon,
  YoutubeBrandIcon,
} from '@/registry/ndeko/lib/icons';

export const PRICING_ANCHOR = 'pricing';

export const FAQ_ANCHOR = 'faq';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'features', label: 'Features', href: '#' },
  { id: 'pricing', label: 'Pricing', href: `#${PRICING_ANCHOR}` },
  { id: 'changelog', label: 'Changelog', href: '#' },
  { id: 'contact', label: 'Contact', href: '#' },
];

export const CURRENT_LINK_ID: string | null = 'pricing';

export const HEADER = {
  tagline: 'Invoices that match the hours your studio worked',
  action: 'Start a free month',
  actionHref: '#',
};

export const PLAN = {
  name: 'Studio plan',
  description:
    'One plan with every feature. You pay for each person who sends invoices.',
  pricePerSeat: 18,
  minSeats: 1,
  maxSeats: 50,
  defaultSeats: 3,
  action: 'Start a free month',
  footnote: 'Example prices in US dollars, taxes added at checkout',
};

export const PRICING = {
  title: 'One price per person who sends invoices, every feature included',
  description:
    'No feature is held back for a bigger tier. Add a seat when someone new starts sending invoices, remove it when they stop.',
};

export type FeatureRow = {
  feature: string;
  value: string;
};

export type FeatureGroup = {
  title: string;
  rows: FeatureRow[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Invoicing',
    rows: [
      { feature: 'Invoices per month', value: 'Unlimited' },
      { feature: 'Recurring invoices', value: 'Included' },
      { feature: 'Currencies', value: 'Any your client pays in' },
    ],
  },
  {
    title: 'Time',
    rows: [
      { feature: 'Timers and timesheets', value: 'Included' },
      { feature: 'Rates per person or per task', value: 'Included' },
    ],
  },
  {
    title: 'Getting paid',
    rows: [
      { feature: 'Payment links by card or transfer', value: 'Included' },
      { feature: 'Automatic reminders', value: 'Up to three per invoice' },
    ],
  },
  {
    title: 'Workspace',
    rows: [
      { feature: 'Clients', value: 'Unlimited' },
      { feature: 'Exports', value: 'CSV and PDF' },
      { feature: 'Support', value: 'Email, answered by a person' },
    ],
  },
];

export type Question = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ = {
  title: 'Questions about the Studio plan',
  description: 'What studios ask before picking a number of seats',
};

export const QUESTIONS: Question[] = [
  {
    id: 'seat',
    question: 'Who needs a seat?',
    answer:
      'Each person who sends invoices. Add a seat when someone new starts sending invoices, and remove it when they stop.',
  },
  {
    id: 'reminders',
    question: 'How many reminders go out for a late invoice?',
    answer:
      'Up to three per invoice, in the tone and rhythm you choose. They stop the moment a payment arrives.',
  },
  {
    id: 'trial',
    question: 'Do I need a card for the free month?',
    answer:
      'No. The first month starts without a card, and you can cancel from the billing page at any time.',
  },
  {
    id: 'currency',
    question: 'Can clients pay in their own currency?',
    answer:
      'Yes. Each invoice goes out in the currency your client pays in, with a link to pay by card or bank transfer.',
  },
  {
    id: 'taxes',
    question: 'Are taxes part of the price per seat?',
    answer: 'No. Taxes are added at checkout, on top of the price per seat.',
  },
];

export const CONTACT = {
  person: { name: 'Dev Raman' },
  lead: 'Still wondering about something?',
  linkLabel: 'Write to billing@tallyfold.example',
  href: 'mailto:billing@tallyfold.example',
  tail: 'and a person from the team answers.',
};

export type FooterLink = {
  label: string;
  href: string;
  isCurrent?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: Icon;
};

export const BRAND = {
  name: 'Tallyfold',
  copyright: '© 2026 Tallyfold',
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Pricing', href: `#${PRICING_ANCHOR}`, isCurrent: true },
  { label: 'Changelog', href: '#' },
  { label: 'Status', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Tallyfold on GitHub', href: '#', icon: GithubIcon },
  { label: 'Tallyfold on LinkedIn', href: '#', icon: LinkedinBrandIcon },
  { label: 'Tallyfold on YouTube', href: '#', icon: YoutubeBrandIcon },
];
