export type BillingPeriod = 'monthly' | 'yearly';

export type Plan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  action: string;
  isFeatured: boolean;
  tag?: string;
};

export const DEFAULT_PERIOD: BillingPeriod = 'monthly';

export const SECTION = {
  title: 'Two plans, both with every editor feature',
  description:
    'Start alone and move to Studio when other people write with you. Your subscribers and archive come along.',
  yearlyNote: 'Two months free',
  footnote:
    'Example prices in a placeholder currency (¤), taxes added at checkout',
};

export const PLANS: Plan[] = [
  {
    id: 'writer',
    name: 'Writer',
    description: 'For one person and one newsletter',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: [
      'One newsletter',
      'Up to 2,000 subscribers',
      'Scheduled sends',
      'Your own domain',
    ],
    action: 'Start with Writer',
    isFeatured: false,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For a small team with several publications',
    monthlyPrice: 30,
    yearlyPrice: 300,
    features: [
      'Everything in Writer',
      'Up to five newsletters',
      'Up to 20,000 subscribers',
      'Three editor seats',
      'Paid subscriptions',
    ],
    action: 'Start with Studio',
    isFeatured: true,
    tag: 'For teams',
  },
];
