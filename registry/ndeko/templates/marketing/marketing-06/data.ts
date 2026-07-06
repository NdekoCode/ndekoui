import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export const BRAND = {
  name: 'Tallyhand',
  tagline: 'Agents that close the books',
  email: 'help@tallyhand.example',
  copyright: '© 2026 Tallyhand',
};

export const ANCHORS = {
  features: 'features',
  pulse: 'how-it-works',
  figures: 'figures',
  pricing: 'pricing',
  customers: 'customers',
  faq: 'faq',
  start: 'start',
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { id: 'features', label: 'Features', href: `#${ANCHORS.features}` },
  { id: 'how', label: 'How it works', href: `#${ANCHORS.pulse}` },
  { id: 'pricing', label: 'Pricing', href: `#${ANCHORS.pricing}` },
  { id: 'customers', label: 'Customers', href: `#${ANCHORS.customers}` },
  { id: 'faq', label: 'FAQ', href: `#${ANCHORS.faq}` },
];

export const HEADER = {
  action: 'Start free',
  actionHref: `#${ANCHORS.start}`,
};

export const HERO = {
  announcement: {
    label: 'New',
    text: 'Every close now replays step by step',
    href: `#${ANCHORS.features}`,
  },
  titleStart: 'Let agents close your',
  titleWords: [
    'month-end',
    'bank reconciliations',
    'accruals',
    'payroll journals',
  ],
  titleSpoken: 'month-end, bank reconciliations, accruals and payroll journals',
  description:
    'Tallyhand matches your bank lines to your invoices, drafts the journal entries and flags what needs a person. Nothing posts without your approval.',
  primaryAction: 'Start your first close',
  primaryHref: `#${ANCHORS.start}`,
  secondaryAction: 'See how a close runs',
  secondaryHref: `#${ANCHORS.features}`,
};

export type WorksWith = {
  id: string;
  name: string;
  brand: BrandSlug;
};

export const WORKS_WITH: WorksWith[] = [
  { id: 'quickbooks', name: 'QuickBooks', brand: 'quickbooks' },
  { id: 'xero', name: 'Xero', brand: 'xero' },
  { id: 'stripe', name: 'Stripe', brand: 'stripe' },
  { id: 'gusto', name: 'Gusto', brand: 'gusto' },
];

export const WORKS_WITH_LABEL = 'Reads and writes to';

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Month-end close', href: `#${ANCHORS.features}` },
      { label: 'Approvals', href: `#${ANCHORS.features}` },
      { label: 'Integrations', href: `#${ANCHORS.pulse}` },
      { label: 'Pricing', href: `#${ANCHORS.pricing}` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: `#${ANCHORS.start}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Data processing', href: '#' },
    ],
  },
];
