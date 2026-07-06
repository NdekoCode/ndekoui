import {
  CAMPAIGNS,
  CHANNELS,
  GOALS,
  periodOf,
  STAGES,
  type Campaign,
  type ChannelId,
  type GoalId,
  type PeriodId,
} from './data';
import { changeWordsOf, percentChangeOf } from './format';

/** Twenty-four whole months, November 2024 to October 2026, drawn from fixed seeds: nothing is random between two renders. */
const HISTORY_MONTHS = 24;

/** The bar chart always holds twelve month slots; a shorter period fills the last ones. */
export const BAR_SLOTS = 12;

export const TRAFFIC_POINTS = 90;

const DAY_MS = 86_400_000;

const HISTORY_START = Date.UTC(2024, 10, 1);

/** 1 November 2024 is a Friday, the fifth day of a week that starts on Monday. */
const FIRST_WEEKDAY = 4;

function seededRandom(seed: number) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function monthStartDayOf(month: number) {
  const start = Date.UTC(2024, 10 + month, 1);
  return Math.round((start - HISTORY_START) / DAY_MS);
}

const MONTH_STARTS = Array.from({ length: HISTORY_MONTHS + 1 }, (_, month) =>
  monthStartDayOf(month)
);

const TOTAL_DAYS = MONTH_STARTS[HISTORY_MONTHS];

const SHORT_MONTH = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
});

const SHORT_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const YEAR = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: 'UTC',
});

function monthDate(month: number) {
  return new Date(Date.UTC(2024, 10 + month, 1));
}

function monthLabelOf(month: number) {
  return SHORT_MONTH.format(monthDate(month));
}

function dayDate(day: number) {
  return new Date(HISTORY_START + day * DAY_MS);
}

function dayLabelOf(day: number) {
  return SHORT_DAY.format(dayDate(day));
}

/** Saturday and Sunday bring about a quarter fewer visits. */
function rhythmOf(weekday: number) {
  if (weekday >= 5) {
    return 0.74;
  }
  return 1;
}

function visitsOfDay(day: number, next: () => number) {
  const trend = 1380 + day * 1.15;
  const yearTurn = (day / 365) * Math.PI * 2;
  const season = 1 + 0.08 * Math.sin(yearTurn - 0.6);
  const weekday = (day + FIRST_WEEKDAY) % 7;
  const rhythm = rhythmOf(weekday);
  const noise = 0.9 + next() * 0.2;
  return Math.round(trend * season * rhythm * noise);
}

function dailyVisits() {
  const next = seededRandom(7);
  return Array.from({ length: TOTAL_DAYS }, (_, day) => visitsOfDay(day, next));
}

const DAILY_VISITS = dailyVisits();

type Growth = {
  base: number;
  growth: number;
  swing: number;
  seed: number;
};

const CHANNEL_GROWTH: Record<ChannelId, Growth> = {
  search: { base: 9200, growth: 0.021, swing: 0.07, seed: 11 },
  social: { base: 5400, growth: 0.03, swing: 0.12, seed: 23 },
  email: { base: 3900, growth: 0.014, swing: 0.06, seed: 37 },
};

function monthlySeries(growth: Growth, phase: number) {
  const next = seededRandom(growth.seed);
  return Array.from({ length: HISTORY_MONTHS }, (_, month) => {
    const trend = growth.base * (1 + growth.growth) ** month;
    const yearTurn = (month / 12) * Math.PI * 2;
    const season = 1 + 0.06 * Math.sin(yearTurn - phase);
    const noise = 1 + (next() - 0.5) * 2 * growth.swing;
    return Math.round(trend * season * noise);
  });
}

const CLICKS: Record<ChannelId, number[]> = {
  search: monthlySeries(CHANNEL_GROWTH.search, 0.8),
  social: monthlySeries(CHANNEL_GROWTH.social, 1.6),
  email: monthlySeries(CHANNEL_GROWTH.email, 0.2),
};

const ORIGIN_GROWTH: Growth[] = [
  { base: 230, growth: 0.006, swing: 0.08, seed: 41 },
  { base: 64, growth: 0.045, swing: 0.12, seed: 43 },
  { base: 98, growth: 0.004, swing: 0.07, seed: 47 },
  { base: 38, growth: 0.034, swing: 0.1, seed: 53 },
  { base: 52, growth: 0, swing: 0.4, seed: 59 },
];

const LEADS_BY_ORIGIN = ORIGIN_GROWTH.map((growth) =>
  monthlySeries(growth, 0.4)
);

type CampaignMonths = {
  spend: number[];
  clicks: number[];
  leads: number[];
};

/** A campaign that has not started contributes nothing; one that has just started ramps up. */
function scaleOf(isRunning: boolean, ramp: number, noise: number) {
  if (!isRunning) {
    return 0;
  }
  return ramp * noise;
}

function campaignMonthsOf(campaign: Campaign, index: number): CampaignMonths {
  const next = seededRandom(101 + index * 7);
  const firstMonth = HISTORY_MONTHS - campaign.ageMonths;
  const spend: number[] = [];
  const clicks: number[] = [];
  const leads: number[] = [];
  for (let month = 0; month < HISTORY_MONTHS; month += 1) {
    const isRunning = month >= firstMonth;
    const age = month - firstMonth;
    const ramp = Math.min(0.55 + age * 0.15, 1);
    const maturity = Math.max(age, 0);
    const noise = 0.9 + next() * 0.2;
    const scale = scaleOf(isRunning, ramp, noise);
    const spendGrowth = 1 + maturity * 0.006;
    const clickGrowth = 1 + maturity * 0.014;
    const leadGrowth = 1 + maturity * 0.022;
    spend.push(Math.round(campaign.monthlySpend * scale * spendGrowth));
    clicks.push(Math.round(campaign.monthlyClicks * scale * clickGrowth));
    leads.push(Math.round(campaign.monthlyLeads * scale * leadGrowth));
  }
  return { spend, clicks, leads };
}

const CAMPAIGN_MONTHS = new Map(
  CAMPAIGNS.map((campaign, index) => [
    campaign.id,
    campaignMonthsOf(campaign, index),
  ])
);

function sumOf(values: readonly number[]) {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

/** The months a period holds, counted back from the last one: [first, end). */
function windowOf(months: number, shift = 0) {
  const end = HISTORY_MONTHS - shift;
  return { first: end - months, end };
}

function monthsSumOf(series: readonly number[], months: number, shift = 0) {
  const { first, end } = windowOf(months, shift);
  return sumOf(series.slice(first, end));
}

function dayRangeOf(months: number, shift = 0) {
  const { first, end } = windowOf(months, shift);
  return { from: MONTH_STARTS[first], to: MONTH_STARTS[end] };
}

/** The average of the days that fall in each of `count` equal parts of a span, so any period gives the same number of points. */
function bucketsOf(days: readonly number[], count: number) {
  return Array.from({ length: count }, (_, bucket) => {
    const start = Math.floor((bucket * days.length) / count);
    const rawEnd = Math.floor(((bucket + 1) * days.length) / count);
    const end = Math.max(rawEnd, start + 1);
    const part = days.slice(start, end);
    return sumOf(part) / part.length;
  });
}

export type BarSlot = {
  label: string;
  isPresent: boolean;
  values: number[];
};

export type GoalResult = {
  id: GoalId;
  actual: number;
  target: number;
  share: number;
};

export type CampaignTotals = {
  spend: number;
  clicks: number;
  leads: number;
  costPerLead: number;
};

function costPerLeadOf(spend: number, leads: number) {
  if (leads === 0) {
    return 0;
  }
  return spend / leads;
}

function totalsOf(
  spend: number,
  clicks: number,
  leads: number
): CampaignTotals {
  const costPerLead = costPerLeadOf(spend, leads);
  return { spend, clicks, leads, costPerLead };
}

export type PeriodData = {
  id: PeriodId;
  months: number;
  rangeLabel: string;
  totalVisits: number;
  visitsChange: string;
  traffic: number[];
  previousTraffic: number[];
  bucketLabels: string[];
  bars: BarSlot[];
  largestBar: number;
  leads: number[];
  totalLeads: number;
  leadsChange: string;
  goals: GoalResult[];
  funnel: number[];
  campaigns: Record<string, CampaignTotals>;
  groups: Record<ChannelId, CampaignTotals>;
};

const FUNNEL_RATES: Record<PeriodId, number[]> = {
  '3m': [0.49, 0.38, 0.34],
  '6m': [0.45, 0.35, 0.31],
  '12m': [0.41, 0.32, 0.28],
};

function barsOf(months: number): BarSlot[] {
  const firstSlotMonth = HISTORY_MONTHS - BAR_SLOTS;
  return Array.from({ length: BAR_SLOTS }, (_, slot) => {
    const month = firstSlotMonth + slot;
    const isPresent = slot >= BAR_SLOTS - months;
    const values = CHANNELS.map((channel) => CLICKS[channel.id][month]);
    return { label: monthLabelOf(month), isPresent, values };
  });
}

function largestOf(values: readonly number[]) {
  let largest = 0;
  for (const value of values) {
    largest = Math.max(largest, value);
  }
  return largest;
}

function rangeLabelOf(months: number) {
  const first = monthDate(HISTORY_MONTHS - months);
  const last = monthDate(HISTORY_MONTHS - 1);
  const firstMonth = SHORT_MONTH.format(first);
  const lastMonth = SHORT_MONTH.format(last);
  const lastYear = YEAR.format(last);
  const firstYear = YEAR.format(first);
  if (firstYear === lastYear) {
    return `${firstMonth} to ${lastMonth} ${lastYear}`;
  }
  return `${firstMonth} ${firstYear} to ${lastMonth} ${lastYear}`;
}

function goalResultsOf(
  id: PeriodId,
  months: number,
  totalLeads: number,
  demoShare: number,
  signupShare: number
): GoalResult[] {
  const emailClicks = monthsSumOf(CLICKS.email, months);
  const actuals: Record<GoalId, number> = {
    leads: totalLeads,
    demos: Math.round(totalLeads * demoShare),
    signups: Math.round(emailClicks * signupShare),
  };
  return GOALS.map((goal) => {
    const target = goal.targets[id];
    const actual = actuals[goal.id];
    return { id: goal.id, actual, target, share: actual / target };
  });
}

const DEMO_SHARE: Record<PeriodId, number> = {
  '3m': 0.2,
  '6m': 0.18,
  '12m': 0.16,
};

const SIGNUP_SHARE: Record<PeriodId, number> = {
  '3m': 0.074,
  '6m': 0.068,
  '12m': 0.06,
};

function campaignTotalsOf(months: number) {
  const campaigns: Record<string, CampaignTotals> = {};
  for (const campaign of CAMPAIGNS) {
    const series = CAMPAIGN_MONTHS.get(campaign.id);
    const spend = monthsSumOf(series?.spend ?? [], months);
    const clicks = monthsSumOf(series?.clicks ?? [], months);
    const leads = monthsSumOf(series?.leads ?? [], months);
    campaigns[campaign.id] = totalsOf(spend, clicks, leads);
  }
  return campaigns;
}

function groupTotalsOf(campaigns: Record<string, CampaignTotals>) {
  const groups: Record<ChannelId, CampaignTotals> = {
    search: totalsOf(0, 0, 0),
    social: totalsOf(0, 0, 0),
    email: totalsOf(0, 0, 0),
  };
  for (const channel of CHANNELS) {
    const members = CAMPAIGNS.filter(
      (campaign) => campaign.channel === channel.id
    );
    const spend = sumOf(members.map((member) => campaigns[member.id].spend));
    const clicks = sumOf(members.map((member) => campaigns[member.id].clicks));
    const leads = sumOf(members.map((member) => campaigns[member.id].leads));
    groups[channel.id] = totalsOf(spend, clicks, leads);
  }
  return groups;
}

function funnelOf(totalLeads: number, rates: number[]) {
  const counts = [totalLeads];
  for (const rate of rates) {
    const before = counts[counts.length - 1];
    counts.push(Math.round(before * rate));
  }
  return counts.slice(0, STAGES.length);
}

function buildPeriodData(id: PeriodId): PeriodData {
  const { months } = periodOf(id);
  const current = dayRangeOf(months);
  const before = dayRangeOf(months, months);
  const currentDays = DAILY_VISITS.slice(current.from, current.to);
  const previousDays = DAILY_VISITS.slice(before.from, before.to);
  const totalVisits = sumOf(currentDays);
  const previousVisits = sumOf(previousDays);
  const visitsPercent = percentChangeOf(totalVisits, previousVisits);
  const reference = `the ${months} months before`;
  const bucketLabels = Array.from({ length: TRAFFIC_POINTS }, (_, bucket) => {
    const offset = Math.floor((bucket * currentDays.length) / TRAFFIC_POINTS);
    return dayLabelOf(current.from + offset);
  });
  const leads = LEADS_BY_ORIGIN.map((series) => monthsSumOf(series, months));
  const previousLeads = sumOf(
    LEADS_BY_ORIGIN.map((series) => monthsSumOf(series, months, months))
  );
  const totalLeads = sumOf(leads);
  const leadsPercent = percentChangeOf(totalLeads, previousLeads);
  const bars = barsOf(months);
  const presentValues = bars.flatMap((slot) => {
    if (slot.isPresent) {
      return slot.values;
    }
    return [];
  });
  const campaigns = campaignTotalsOf(months);
  return {
    id,
    months,
    rangeLabel: rangeLabelOf(months),
    totalVisits,
    visitsChange: changeWordsOf(visitsPercent, reference),
    traffic: bucketsOf(currentDays, TRAFFIC_POINTS),
    previousTraffic: bucketsOf(previousDays, TRAFFIC_POINTS),
    bucketLabels,
    bars,
    largestBar: largestOf(presentValues),
    leads,
    totalLeads,
    leadsChange: changeWordsOf(leadsPercent, reference),
    goals: goalResultsOf(
      id,
      months,
      totalLeads,
      DEMO_SHARE[id],
      SIGNUP_SHARE[id]
    ),
    funnel: funnelOf(totalLeads, FUNNEL_RATES[id]),
    campaigns,
    groups: groupTotalsOf(campaigns),
  };
}

const CACHE = new Map<PeriodId, PeriodData>();

export function dataOf(id: PeriodId) {
  const cached = CACHE.get(id);
  if (cached) {
    return cached;
  }
  const built = buildPeriodData(id);
  CACHE.set(id, built);
  return built;
}
