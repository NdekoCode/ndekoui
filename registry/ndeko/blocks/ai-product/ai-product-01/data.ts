import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type PeriodId = 'today' | 'week' | 'month';

export type Period = {
  id: PeriodId;
  label: string;
  spoken: string;
  chartTitle: string;
  chartLabels: [string, string, string];
};

export const PERIODS: Period[] = [
  {
    id: 'today',
    label: 'Today',
    spoken: 'today',
    chartTitle: 'Credits by hour',
    chartLabels: ['00:00', '09:00', '17:00'],
  },
  {
    id: 'week',
    label: 'This week',
    spoken: 'this week',
    chartTitle: 'Credits by day',
    chartLabels: ['Mon', 'Wed', 'Fri'],
  },
  {
    id: 'month',
    label: 'This month',
    spoken: 'this month',
    chartTitle: 'Credits by day',
    chartLabels: ['Day 1', 'Day 7', 'Day 13'],
  },
];

export const WORKSPACE = { name: 'Kasai Freight', plan: 'Team plan' };

export type ModelId = 'claude' | 'gemini' | 'chatgpt' | 'mistral';

export type Model = {
  id: ModelId;
  name: string;
  brand: BrandSlug;
  series: SeriesSlot;
};

export const MODELS: Model[] = [
  { id: 'claude', name: 'Claude', brand: 'claude', series: 1 },
  { id: 'gemini', name: 'Gemini', brand: 'gemini', series: 2 },
  { id: 'chatgpt', name: 'ChatGPT', brand: 'openai', series: 3 },
  { id: 'mistral', name: 'Mistral', brand: 'mistral', series: 4 },
];

export type Usage = {
  limit: number;
  byModel: Record<ModelId, number>;
  chart: number[];
  upgrade: string | null;
};

/** Every figure is invented. For each period the credits by model and the bars add up to the same total. */
export const USAGE: Record<PeriodId, Usage> = {
  today: {
    limit: 250,
    byModel: { claude: 84, gemini: 46, chatgpt: 38, mistral: 12 },
    chart: [0, 0, 0, 0, 0, 0, 2, 6, 14, 22, 26, 20, 12, 18, 24, 20, 10, 6],
    upgrade: null,
  },
  week: {
    limit: 1400,
    byModel: { claude: 520, gemini: 290, chatgpt: 250, mistral: 90 },
    chart: [230, 260, 240, 240, 180],
    upgrade:
      'Four fifths of this week is used. Scale adds 10,000 credits a month',
  },
  month: {
    limit: 5000,
    byModel: { claude: 1980, gemini: 1150, chatgpt: 900, mistral: 320 },
    chart: [150, 470, 500, 480, 460, 420, 330, 390, 230, 260, 240, 240, 180],
    upgrade:
      'At this pace the credits run out in two days. Scale adds 10,000 credits a month',
  },
};

export const NEAR_LIMIT_SHARE = 0.8;

export type Limit = {
  id: string;
  label: string;
  used: number;
  max: number;
  unit: string;
};

export const LIMITS: Limit[] = [
  { id: 'agents', label: 'Agents', used: 4, max: 5, unit: '' },
  { id: 'seats', label: 'Seats', used: 9, max: 10, unit: '' },
  { id: 'apps', label: 'Connected apps', used: 7, max: 12, unit: '' },
  { id: 'files', label: 'Stored files', used: 3.2, max: 5, unit: ' GB' },
];

const FALLBACK_PERIOD = PERIODS[0];

export function periodOf(id: PeriodId) {
  const period = PERIODS.find((candidate) => candidate.id === id);
  return period ?? FALLBACK_PERIOD;
}

export function usedOf(usage: Usage) {
  let total = 0;
  for (const model of MODELS) {
    total += usage.byModel[model.id];
  }
  return total;
}

export function shareOf(used: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }
  const share = used / limit;
  return Math.min(1, share);
}

export function isNearLimit(share: number) {
  return share >= NEAR_LIMIT_SHARE;
}

export function percentOf(share: number) {
  return Math.round(share * 100);
}
