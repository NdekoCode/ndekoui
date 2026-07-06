export type PlanId = 'hobby' | 'growth' | 'scale';

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  basePrice: number;
  includedRequests: number;
  /** For each thousand requests past the included ones. */
  pricePerThousand: number;
  action: string;
};

export const PLANS: Plan[] = [
  {
    id: 'hobby',
    name: 'Hobby',
    summary: 'For a side project or a first prototype',
    basePrice: 0,
    includedRequests: 1_000,
    pricePerThousand: 4,
    action: 'Start for free',
  },
  {
    id: 'growth',
    name: 'Growth',
    summary: 'For an app with steady traffic',
    basePrice: 29,
    includedRequests: 25_000,
    pricePerThousand: 1.6,
    action: 'Start with Growth',
  },
  {
    id: 'scale',
    name: 'Scale',
    summary: 'For products that look up addresses all day',
    basePrice: 249,
    includedRequests: 250_000,
    pricePerThousand: 0.8,
    action: 'Start with Scale',
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

export const START_VOLUME = 12_000;

export const SECTION = {
  title: 'Pricing that follows your requests',
  description:
    'Waypost turns addresses into points on a map. Type or drag the volume you expect and every plan below is priced for it.',
  over: 'Prices here go up to 1,000,000 requests a month. Above that, we set a price with you.',
  footnote:
    'Illustrative prices in US dollars for an example API, taxes added at checkout',
};
