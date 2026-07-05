import type { BrandSlug } from '@/registry/ndeko/lib/brand-logos';

export type DimensionId = 'agent' | 'model' | 'day' | 'status' | 'tool';

export type MeasureId = 'runs' | 'cost' | 'tokens' | 'duration';

export type FieldId = DimensionId | MeasureId;

export type RunRecord = Record<DimensionId, string> & Record<MeasureId, number>;

export type Field = {
  id: FieldId;
  label: string;
  kind: 'dimension' | 'measure';
};

export const DIMENSIONS: DimensionId[] = [
  'agent',
  'model',
  'day',
  'status',
  'tool',
];

export const MEASURES: MeasureId[] = ['runs', 'cost', 'tokens', 'duration'];

export const FIELDS: Field[] = [
  { id: 'agent', label: 'Agent', kind: 'dimension' },
  { id: 'model', label: 'Model', kind: 'dimension' },
  { id: 'day', label: 'Day', kind: 'dimension' },
  { id: 'status', label: 'Status', kind: 'dimension' },
  { id: 'tool', label: 'Tool', kind: 'dimension' },
  { id: 'runs', label: 'Runs', kind: 'measure' },
  { id: 'cost', label: 'Cost', kind: 'measure' },
  { id: 'tokens', label: 'Tokens', kind: 'measure' },
  { id: 'duration', label: 'Duration', kind: 'measure' },
];

export function fieldOf(id: FieldId) {
  const field = FIELDS.find((candidate) => candidate.id === id);
  return field ?? FIELDS[0];
}

export function isDimension(id: FieldId): id is DimensionId {
  return fieldOf(id).kind === 'dimension';
}

export function isMeasure(id: FieldId): id is MeasureId {
  return fieldOf(id).kind === 'measure';
}

/** The values of each dimension, in the order the table lists them. */
export const DIMENSION_VALUES: Record<DimensionId, string[]> = {
  agent: ['Planner', 'Researcher', 'Writer', 'Reviewer', 'Coder'],
  model: ['Claude Sonnet', 'Claude Haiku', 'GPT mini', 'Gemini Pro'],
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  status: ['Done', 'Failed'],
  tool: ['GitHub', 'Linear', 'Notion', 'Web search'],
};

/** The marks of the model makers and of the tools, shown beside their name. */
export const VALUE_BRAND: Record<string, BrandSlug> = {
  'Claude Sonnet': 'claude',
  'Claude Haiku': 'claude',
  'GPT mini': 'openai',
  'Gemini Pro': 'gemini',
  GitHub: 'github',
  Linear: 'linear',
  Notion: 'notion',
};

type AgentProfile = {
  agent: string;
  models: string[];
  tools: string[];
  /** Runs on a working day. */
  runsPerDay: number;
  costUsd: number;
  tokens: number;
  durationMs: number;
};

const PROFILES: AgentProfile[] = [
  {
    agent: 'Planner',
    models: ['Gemini Pro'],
    tools: ['Linear', 'Notion'],
    runsPerDay: 2,
    costUsd: 0.62,
    tokens: 48_000,
    durationMs: 94_000,
  },
  {
    agent: 'Researcher',
    models: ['Claude Sonnet', 'Claude Haiku'],
    tools: ['Web search', 'Notion'],
    runsPerDay: 4,
    costUsd: 0.31,
    tokens: 36_000,
    durationMs: 141_000,
  },
  {
    agent: 'Writer',
    models: ['GPT mini'],
    tools: ['Notion'],
    runsPerDay: 3,
    costUsd: 0.12,
    tokens: 22_000,
    durationMs: 52_000,
  },
  {
    agent: 'Reviewer',
    models: ['Claude Sonnet'],
    tools: ['GitHub', 'Linear'],
    runsPerDay: 3,
    costUsd: 0.27,
    tokens: 31_000,
    durationMs: 77_000,
  },
  {
    agent: 'Coder',
    models: ['Claude Sonnet', 'Claude Haiku'],
    tools: ['GitHub'],
    runsPerDay: 5,
    costUsd: 0.84,
    tokens: 91_000,
    durationMs: 228_000,
  },
];

/** Fewer runs at the weekend. */
const DAY_LOAD = [1, 1, 1, 1, 1, 0.4, 0.3];

/** One run in this many fails. */
const FAILURE_EVERY = 9;

/** A fixed seed, so the page reads the same on the server and in the browser. */
const SEED = 20261112;

const MODULUS = 4_294_967_296;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % MODULUS;
    return state / MODULUS;
  };
}

function pick(values: string[], roll: number) {
  const index = Math.floor(roll * values.length);
  return values[index];
}

/** Between 0.6 and 1.4 times the usual figure. */
function swingOf(roll: number) {
  return 0.6 + roll * 0.8;
}

function statusOf(runNumber: number) {
  if (runNumber % FAILURE_EVERY === 0) {
    return 'Failed';
  }
  return 'Done';
}

function recordsOf() {
  const random = createRandom(SEED);
  const records: RunRecord[] = [];
  const days = DIMENSION_VALUES.day;
  days.forEach((day, dayIndex) => {
    for (const profile of PROFILES) {
      const load = profile.runsPerDay * DAY_LOAD[dayIndex];
      const runCount = Math.max(1, Math.round(load));
      for (let run = 0; run < runCount; run += 1) {
        const swing = swingOf(random());
        const runNumber = records.length + 1;
        records.push({
          agent: profile.agent,
          model: pick(profile.models, random()),
          day,
          status: statusOf(runNumber),
          tool: pick(profile.tools, random()),
          runs: 1,
          cost: Number((profile.costUsd * swing).toFixed(3)),
          tokens: Math.round(profile.tokens * swing),
          duration: Math.round(profile.durationMs * swing),
        });
      }
    }
  });
  return records;
}

/** One record per run of last week. Invented and illustrative. */
export const RECORDS = recordsOf();
