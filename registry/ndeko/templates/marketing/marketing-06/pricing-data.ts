export type PlanId = 'starter' | 'practice' | 'firm';

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  basePrice: number;
  includedLines: number;
  /** For each thousand bank lines past the included ones. */
  pricePerThousand: number;
  action: string;
};

/** Invented plans and prices. The figures are illustrative. */
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    summary: 'For one business and its own books',
    basePrice: 0,
    includedLines: 500,
    pricePerThousand: 9,
    action: 'Start for free',
  },
  {
    id: 'practice',
    name: 'Practice',
    summary: 'For a bookkeeper with several clients',
    basePrice: 49,
    includedLines: 5_000,
    pricePerThousand: 4.5,
    action: 'Start with Practice',
  },
  {
    id: 'firm',
    name: 'Firm',
    summary: 'For a firm that closes for dozens of companies each month',
    basePrice: 399,
    includedLines: 100_000,
    pricePerThousand: 2,
    action: 'Start with Firm',
  },
];

/** The volumes the track and the drag stop at, about evenly spaced on a log scale. */
export const STOPS = [
  500, 600, 800, 1_000, 1_200, 1_500, 2_000, 2_500, 3_000, 4_000, 5_000, 6_000,
  8_000, 10_000, 12_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 60_000,
  80_000, 100_000, 120_000, 150_000, 200_000, 250_000, 300_000, 400_000,
  500_000, 600_000, 800_000, 1_000_000,
];

export const MAX_VOLUME = 1_000_000;

export const START_VOLUME = 4_000;

export const SECTION = {
  label: 'Pricing',
  title: 'A price that follows the lines you reconcile',
  lead: 'Tallyhand prices a month by the bank lines it matches. Type or drag the number you expect and every plan below is priced for it.',
  over: 'Prices here go up to 1,000,000 lines a month. Above that, we set a price with you.',
  footnote:
    'Illustrative prices in US dollars for an example product, taxes added at checkout',
};
