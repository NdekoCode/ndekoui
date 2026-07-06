import {
  type BillingPeriod,
  HOUR_RANGE,
  type Plan,
  PLANS,
  type Range,
  SEAT_RANGE,
} from './data';

export type Usage = {
  seats: number;
  hoursPerPerson: number;
  period: BillingPeriod;
};

export type Estimate = {
  plan: Plan;
  seats: number;
  seatPrice: number;
  seatCost: number;
  recordedHours: number;
  includedHours: number;
  extraHours: number;
  extraCost: number;
  total: number;
};

/** A place on a slider where the plan that fits changes. */
export type Tick = {
  /** The plan it leads to, counted, so a tick glides when the other number moves instead of being born again. */
  key: string;
  value: number;
  plan: Plan;
};

export type CapNotice = {
  plan: Plan;
  seats: number;
  total: number;
};

const MONTHS_PER_YEAR = 12;

/** The seat range ends at its cap, so this plan only answers for a number no slider can reach. */
const LARGEST_PLAN: Plan = PLANS.at(-1) ?? PLANS[0];

/** Monthly comes first, so a phrase that changes with the period rolls up to yearly and down back. */
export const PERIOD_ORDER: Record<BillingPeriod, number> = {
  monthly: 0,
  yearly: 1,
};

export const MONEY_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const RATE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const MONEY_FORMATTER = new Intl.NumberFormat('en-US', MONEY_FORMAT);

const RATE_FORMATTER = new Intl.NumberFormat('en-US', RATE_FORMAT);

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');

export function formatMoney(amount: number) {
  return MONEY_FORMATTER.format(amount);
}

export function formatRate(amount: number) {
  return RATE_FORMATTER.format(amount);
}

export function formatCount(count: number) {
  return COUNT_FORMATTER.format(count);
}

export function seatPriceOf(plan: Plan, period: BillingPeriod) {
  if (period === 'yearly') {
    return plan.yearlySeatPrice;
  }
  return plan.monthlySeatPrice;
}

/** Extra hours are rounded to whole dollars once, so the lines of an estimate always add up to its total. */
export function estimateOf(plan: Plan, usage: Usage): Estimate {
  const seatPrice = seatPriceOf(plan, usage.period);
  const seatCost = seatPrice * usage.seats;
  const recordedHours = usage.seats * usage.hoursPerPerson;
  const includedHours = usage.seats * plan.includedHoursPerSeat;
  const hoursOver = recordedHours - includedHours;
  const extraHours = Math.max(0, hoursOver);
  const exactExtraCost = extraHours * plan.pricePerExtraHour;
  const extraCost = Math.round(exactExtraCost);
  const total = seatCost + extraCost;
  return {
    plan,
    seats: usage.seats,
    seatPrice,
    seatCost,
    recordedHours,
    includedHours,
    extraHours,
    extraCost,
    total,
  };
}

function holdsSeats(plan: Plan, seats: number) {
  return seats <= plan.maxSeats;
}

function cheaperOf(current: Estimate | null, candidate: Estimate) {
  if (current === null) {
    return candidate;
  }
  if (candidate.total < current.total) {
    return candidate;
  }
  return current;
}

/** The cheapest plan that holds every seat. A tie goes to the smaller plan. */
export function fittingPlanOf(usage: Usage) {
  let best: Estimate | null = null;
  for (const plan of PLANS) {
    if (!holdsSeats(plan, usage.seats)) {
      continue;
    }
    const estimate = estimateOf(plan, usage);
    best = cheaperOf(best, estimate);
  }
  if (best === null) {
    return LARGEST_PLAN;
  }
  return best.plan;
}

/**
 * The plan one step down would cost less for these numbers but holds fewer seats than the team
 * has: the notice offers to stay on it with as many seats as it holds.
 */
export function capNoticeOf(usage: Usage, fit: Plan): CapNotice | null {
  const fitIndex = PLANS.indexOf(fit);
  const smaller: Plan | undefined = PLANS[fitIndex - 1];
  if (smaller === undefined) {
    return null;
  }
  if (holdsSeats(smaller, usage.seats)) {
    return null;
  }
  const smallerTotal = estimateOf(smaller, usage).total;
  const fitTotal = estimateOf(fit, usage).total;
  if (smallerTotal >= fitTotal) {
    return null;
  }
  const seats = smaller.maxSeats;
  const cappedUsage: Usage = { ...usage, seats };
  const total = estimateOf(smaller, cappedUsage).total;
  return { plan: smaller, seats, total };
}

function valuesOf(range: Range) {
  const values: number[] = [];
  for (let value = range.min; value <= range.max; value += range.step) {
    values.push(value);
  }
  return values;
}

const SEAT_VALUES = valuesOf(SEAT_RANGE);

const HOUR_VALUES = valuesOf(HOUR_RANGE);

function keyOfTick(ticks: Tick[], plan: Plan) {
  const earlier = ticks.filter((tick) => tick.plan === plan);
  return `${plan.id}-${earlier.length}`;
}

function ticksAlong(
  values: readonly number[],
  usageAt: (value: number) => Usage
) {
  const ticks: Tick[] = [];
  let previous: Plan | null = null;
  for (const value of values) {
    const usage = usageAt(value);
    const plan = fittingPlanOf(usage);
    const hasPrevious = previous !== null;
    const isChange = hasPrevious && plan !== previous;
    if (isChange) {
      const key = keyOfTick(ticks, plan);
      ticks.push({ key, value, plan });
    }
    previous = plan;
  }
  return ticks;
}

export function seatTicksOf(usage: Usage) {
  return ticksAlong(SEAT_VALUES, (seats) => ({ ...usage, seats }));
}

export function hourTicksOf(usage: Usage) {
  return ticksAlong(HOUR_VALUES, (hoursPerPerson) => ({
    ...usage,
    hoursPerPerson,
  }));
}

/** What yearly billing takes off the seats over twelve months. Extra hours are billed as they come. */
export function yearlySavingOf(plan: Plan, seats: number) {
  const perSeat = plan.monthlySeatPrice - plan.yearlySeatPrice;
  const perMonth = perSeat * seats;
  return perMonth * MONTHS_PER_YEAR;
}

export function yearlySeatBillOf(estimate: Estimate) {
  return estimate.seatCost * MONTHS_PER_YEAR;
}
