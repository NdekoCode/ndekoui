import type { SeriesSlot } from '@/registry/ndeko/lib/agent-run';

export type LabId = 'lumen' | 'quarry' | 'halden';

export type Lab = {
  id: LabId;
  name: string;
  initial: string;
  series: SeriesSlot;
};

export type Capability = 'vision' | 'tools' | 'reasoning' | 'long-context';

export type Tier = 1 | 2 | 3;

export type ModelOption = {
  id: string;
  name: string;
  lab: LabId;
  /** How many tokens the model reads at once. */
  contextTokens: number;
  /** 1 is the slowest, 3 the fastest. */
  speed: Tier;
  /** 1 is the cheapest, 3 the dearest. */
  price: Tier;
  capabilities: Capability[];
  hint: string;
};

export const LABS: Lab[] = [
  { id: 'lumen', name: 'Lumen', initial: 'L', series: 1 },
  { id: 'quarry', name: 'Quarry', initial: 'Q', series: 2 },
  { id: 'halden', name: 'Halden', initial: 'H', series: 3 },
];

export const MODELS: ModelOption[] = [
  {
    id: 'lumen-swift',
    name: 'Lumen Swift',
    lab: 'lumen',
    contextTokens: 128_000,
    speed: 3,
    price: 1,
    capabilities: ['tools'],
    hint: 'Quick replies and small edits',
  },
  {
    id: 'lumen',
    name: 'Lumen',
    lab: 'lumen',
    contextTokens: 200_000,
    speed: 2,
    price: 2,
    capabilities: ['vision', 'tools', 'long-context'],
    hint: 'Everyday work across long files',
  },
  {
    id: 'lumen-max',
    name: 'Lumen Max',
    lab: 'lumen',
    contextTokens: 200_000,
    speed: 1,
    price: 3,
    capabilities: ['vision', 'tools', 'reasoning', 'long-context'],
    hint: 'Hard problems that need a plan',
  },
  {
    id: 'quarry-mini',
    name: 'Quarry Mini',
    lab: 'quarry',
    contextTokens: 64_000,
    speed: 3,
    price: 1,
    capabilities: ['tools'],
    hint: 'Cheap bulk tasks',
  },
  {
    id: 'quarry-large',
    name: 'Quarry Large',
    lab: 'quarry',
    contextTokens: 1_000_000,
    speed: 1,
    price: 3,
    capabilities: ['tools', 'reasoning', 'long-context'],
    hint: 'Whole repositories at once',
  },
  {
    id: 'halden-vision',
    name: 'Halden Vision',
    lab: 'halden',
    contextTokens: 32_000,
    speed: 2,
    price: 2,
    capabilities: ['vision'],
    hint: 'Screenshots, scans and charts',
  },
];

export const CAPABILITIES: Capability[] = [
  'vision',
  'tools',
  'reasoning',
  'long-context',
];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  vision: 'Vision',
  tools: 'Tools',
  reasoning: 'Reasoning',
  'long-context': 'Long context',
};

export const SPEED_WORD: Record<Tier, string> = {
  1: 'Slow',
  2: 'Medium speed',
  3: 'Fast',
};

export const PRICE_WORD: Record<Tier, string> = {
  1: 'Low price',
  2: 'Medium price',
  3: 'High price',
};

const FALLBACK_LAB = LABS[0];

const FALLBACK_MODEL = MODELS[0];

export function labOf(id: LabId) {
  const lab = LABS.find((candidate) => candidate.id === id);
  return lab ?? FALLBACK_LAB;
}

export function modelOf(id: string) {
  const model = MODELS.find((candidate) => candidate.id === id);
  return model ?? FALLBACK_MODEL;
}

/** 32k, 200k, 1M. */
export function contextLabelOf(tokens: number) {
  const isMillion = tokens >= 1_000_000;
  if (isMillion) {
    const millions = Math.round(tokens / 1_000_000);
    return `${millions}M`;
  }
  const thousands = Math.round(tokens / 1000);
  return `${thousands}k`;
}
