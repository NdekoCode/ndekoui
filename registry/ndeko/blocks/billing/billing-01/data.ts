export type Meter = {
  id: string;
  label: string;
  used: number;
  included: number;
  unit: string;
  /** Price of each unit beyond the plan, or null when the plan stops at its limit. */
  overagePrice: number | null;
  /** How many decimals the figures of this meter keep. */
  decimals: number;
};

export const PLAN = {
  name: 'Growth plan',
  workspace: 'Fernhollow Studio',
  monthlyPrice: 99,
  renewsOn: 'Nov 30',
  resetsInDays: 12,
};

export const CAP_BOUNDS = {
  min: 0,
  max: 500,
  step: 10,
};

export const INITIAL_CAP = { amount: 100, isCapped: true };

export const METERS: Meter[] = [
  {
    id: 'seats',
    label: 'Seats',
    used: 18,
    included: 25,
    unit: 'seats',
    overagePrice: null,
    decimals: 0,
  },
  {
    id: 'storage',
    label: 'File storage',
    used: 61.4,
    included: 100,
    unit: 'GB',
    overagePrice: null,
    decimals: 1,
  },
  {
    id: 'runs',
    label: 'Automation runs',
    used: 13450,
    included: 10000,
    unit: 'runs',
    overagePrice: 0.01,
    decimals: 0,
  },
  {
    id: 'guests',
    label: 'Guest viewers',
    used: 54,
    included: 50,
    unit: 'guests',
    overagePrice: 3.5,
    decimals: 0,
  },
];
