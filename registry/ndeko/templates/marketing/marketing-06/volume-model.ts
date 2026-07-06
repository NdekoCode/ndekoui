import { MAX_VOLUME, type Plan, PLANS, STOPS } from './pricing-data';

/** A place on the track where another plan becomes the cheapest. */
export type Notch = {
  volume: number;
  position: number;
  plan: Plan;
};

/** The stretch of the track where one plan is the cheapest. */
export type Zone = {
  plan: Plan;
  from: number;
  to: number;
};

export const LAST_POSITION = STOPS.length - 1;

const FIRST_STOP = STOPS[0];

export const PRICE_FORMAT: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', PRICE_FORMAT);

const RATE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const VOLUME_FORMATTER = new Intl.NumberFormat('en-US');

const NOT_DIGITS = /\D/g;

export function formatPrice(amount: number) {
  return PRICE_FORMATTER.format(amount);
}

export function formatRate(amount: number) {
  return RATE_FORMATTER.format(amount);
}

export function formatVolume(volume: number) {
  return VOLUME_FORMATTER.format(volume);
}

/** The number in a typed text, whatever separators came with it; null while nothing is typed. */
export function volumeOfText(text: string) {
  const digits = text.replace(NOT_DIGITS, '');
  if (digits === '') {
    return null;
  }
  return Number(digits);
}

export function clampVolume(volume: number) {
  const atLeastZero = Math.max(volume, 0);
  return Math.min(atLeastZero, MAX_VOLUME);
}

export function costOf(plan: Plan, volume: number) {
  const over = volume - plan.includedLines;
  const billable = Math.max(0, over);
  const thousands = billable / 1_000;
  const overage = thousands * plan.pricePerThousand;
  return plan.basePrice + overage;
}

/** The plan that costs the least for this volume. A tie goes to the smaller plan. */
export function cheapestPlanAt(volume: number) {
  let cheapest = PLANS[0];
  let lowest = costOf(cheapest, volume);
  for (const plan of PLANS) {
    const cost = costOf(plan, volume);
    if (cost < lowest) {
      cheapest = plan;
      lowest = cost;
    }
  }
  return cheapest;
}

/** Where a volume sits on the track: on a stop, or between two stops on a log scale. */
export function positionOf(volume: number) {
  if (volume <= FIRST_STOP) {
    return 0;
  }
  for (let index = 0; index < LAST_POSITION; index += 1) {
    const low = STOPS[index];
    const high = STOPS[index + 1];
    if (volume <= high) {
      const covered = Math.log(volume / low);
      const span = Math.log(high / low);
      const along = covered / span;
      return index + along;
    }
  }
  return LAST_POSITION;
}

export function volumeAt(position: number) {
  const index = Math.round(position);
  const atLeastFirst = Math.max(index, 0);
  const bounded = Math.min(atLeastFirst, LAST_POSITION);
  return STOPS[bounded];
}

export function shareOf(position: number) {
  return position / LAST_POSITION;
}

/** The arrow keys go from stop to stop, starting from any typed volume. */
export function stopAbove(volume: number) {
  const stop = STOPS.find((candidate) => candidate > volume);
  if (stop === undefined) {
    return MAX_VOLUME;
  }
  return stop;
}

/** Under the first stop there is nowhere lower to go, so a typed 300 stays 300 instead of rising to it. */
export function stopBelow(volume: number) {
  const lower = STOPS.filter((candidate) => candidate < volume);
  const stop = lower.at(-1);
  if (stop === undefined) {
    return volume;
  }
  return stop;
}

/** The smallest volume past `low` where the cheapest plan is no longer the one at `low`. */
function firstVolumeOfChange(low: number, high: number) {
  const before = cheapestPlanAt(low);
  let below = low;
  let above = high;
  while (above - below > 1) {
    const sum = below + above;
    const middle = Math.floor(sum / 2);
    const plan = cheapestPlanAt(middle);
    if (plan === before) {
      below = middle;
    } else {
      above = middle;
    }
  }
  return above;
}

function notchesOf() {
  const notches: Notch[] = [];
  for (let index = 0; index < LAST_POSITION; index += 1) {
    const low = STOPS[index];
    const high = STOPS[index + 1];
    const lowPlan = cheapestPlanAt(low);
    const highPlan = cheapestPlanAt(high);
    if (lowPlan === highPlan) {
      continue;
    }
    const volume = firstVolumeOfChange(low, high);
    const position = positionOf(volume);
    notches.push({ volume, position, plan: highPlan });
  }
  return notches;
}

function zonesOf(notches: readonly Notch[]) {
  const zones: Zone[] = [];
  let from = 0;
  let plan = cheapestPlanAt(FIRST_STOP);
  for (const notch of notches) {
    zones.push({ plan, from, to: notch.position });
    from = notch.position;
    plan = notch.plan;
  }
  zones.push({ plan, from, to: LAST_POSITION });
  return zones;
}

/** The prices are fixed, so the places where the cheapest plan changes are worked out once. */
export const NOTCHES = notchesOf();

export const ZONES = zonesOf(NOTCHES);
