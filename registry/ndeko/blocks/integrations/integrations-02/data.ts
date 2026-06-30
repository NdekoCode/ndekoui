import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type LogoRow = {
  id: string;
  /** Pixels per second. */
  speed: number;
  reverse: boolean;
  brands: BrandSlug[];
};

export const SECTION = {
  title: 'Connect Fernhollow to the tools your studio already uses',
  description:
    'Mail, calls, files, invoices and pull requests land on the task they belong to, so nobody copies links between tabs.',
  action: 'Browse integrations',
};

export const ROWS: LogoRow[] = [
  {
    id: 'top',
    speed: 22,
    reverse: false,
    brands: [
      'gmail',
      'github',
      'googledrive',
      'stripe',
      'zoom',
      'figma',
      'linear',
      'xero',
      'telegram',
      'notion',
    ],
  },
  {
    id: 'middle',
    speed: 15,
    reverse: true,
    brands: [
      'element',
      'quickbooks',
      'gitlab',
      'dropbox',
      'googlemeet',
      'sentry',
      'paypal',
      'confluence',
      'zapier',
    ],
  },
  {
    id: 'bottom',
    speed: 29,
    reverse: false,
    brands: [
      'jira',
      'loom',
      'googledocs',
      'square',
      'bitbucket',
      'mattermost',
      'box',
      'gusto',
      'revolut',
    ],
  },
];
