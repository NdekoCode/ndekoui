export type BillingPeriod = 'monthly' | 'yearly';

export type PlanId = 'starter' | 'team' | 'scale';

export type Plan = {
  id: PlanId;
  name: string;
  /** Per seat and per month, billed every month. */
  monthlySeatPrice: number;
  /** Per seat and per month, billed once a year. */
  yearlySeatPrice: number;
  maxSeats: number;
  includedHoursPerSeat: number;
  /** For each hour recorded past what the seats include. */
  pricePerExtraHour: number;
};

export type Range = {
  min: number;
  max: number;
  step: number;
};

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlySeatPrice: 10,
    yearlySeatPrice: 8,
    maxSeats: 10,
    includedHoursPerSeat: 10,
    pricePerExtraHour: 0.8,
  },
  {
    id: 'team',
    name: 'Team',
    monthlySeatPrice: 18,
    yearlySeatPrice: 15,
    maxSeats: 40,
    includedHoursPerSeat: 25,
    pricePerExtraHour: 0.6,
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlySeatPrice: 30,
    yearlySeatPrice: 25,
    maxSeats: 100,
    includedHoursPerSeat: 60,
    pricePerExtraHour: 0.4,
  },
];

export const SEAT_RANGE: Range = { min: 1, max: 100, step: 1 };

export const HOUR_RANGE: Range = { min: 0, max: 80, step: 1 };

export type Start = {
  seats: number;
  hoursPerPerson: number;
  period: BillingPeriod;
};

export const START: Start = {
  seats: 6,
  hoursPerPerson: 12,
  period: 'monthly',
};

export const SECTION = {
  title: 'One seat per person, with recording hours in every seat',
  description:
    'Echoleaf records and transcribes your meetings. Set how many people use it and how long each one records, and the plan that fits moves under your numbers.',
  footnote:
    'Illustrative prices in US dollars for an example app, taxes added at checkout',
};
