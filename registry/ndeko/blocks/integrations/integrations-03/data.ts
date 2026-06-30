import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type ToolArea = {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  brands: BrandSlug[];
};

export const SECTION = {
  title: 'Integrations by what they help with',
  description:
    'Each tool adds what it knows to the task it is about, and disconnects from the same page in Fernhollow.',
};

export const AREAS: ToolArea[] = [
  {
    id: 'communication',
    title: 'Communication',
    description:
      'Calls, chats and mail that point back to the task they are about.',
    linkLabel: 'See communication tools',
    brands: [
      'gmail',
      'element',
      'zoom',
      'googlemeet',
      'telegram',
      'loom',
      'mattermost',
    ],
  },
  {
    id: 'files',
    title: 'Files and docs',
    description:
      'Attach files and pages without copying them, and keep their titles current.',
    linkLabel: 'See file and doc tools',
    brands: [
      'notion',
      'googledrive',
      'dropbox',
      'figma',
      'googledocs',
      'confluence',
      'box',
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    description:
      'Approved hours and expenses go to invoices, payroll and your books.',
    linkLabel: 'See finance tools',
    brands: [
      'stripe',
      'quickbooks',
      'xero',
      'paypal',
      'gusto',
      'square',
      'revolut',
    ],
  },
  {
    id: 'developer',
    title: 'Developer',
    description:
      'Pull requests, issues, errors and deploys update the tasks they mention.',
    linkLabel: 'See developer tools',
    brands: [
      'github',
      'linear',
      'gitlab',
      'jira',
      'sentry',
      'bitbucket',
      'zapier',
    ],
  },
];
