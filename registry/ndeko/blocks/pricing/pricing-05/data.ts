export type BillingPeriod = 'monthly' | 'yearly';

export const PLAN = {
  product: 'Inkpond',
  description: 'Everything Inkpond does, on every device you write on',
  monthlyPrice: 12,
  yearlyPrice: 120,
  yearlyNote: 'Two months free',
  features: [
    'Unlimited documents and notebooks',
    'Sync on Mac, Windows, iPhone and Android',
    'Every version kept for a year',
    'Export to PDF, EPUB and Markdown',
    'Shared notebooks with up to three people',
  ],
  action: 'Start writing',
  trial: '14 days free, cancel from your account at any time',
};

export const SECTION = {
  title: 'One plan with every part of Inkpond',
  description:
    'Write on any device, keep every version and export when the draft is done. Pay each month, or once a year for two months free.',
  footnote:
    'Illustrative prices in US dollars for an example app, taxes added at checkout',
};
