import { hatchOf } from '@/registry/ndeko/lib/hatch';

export type ContextPartId =
  'system' | 'tools' | 'files' | 'summary' | 'conversation';

/** A place in the window: one of its parts, the room left, or what is held back for the answer. */
export type ContextSlot = ContextPartId | 'free' | 'reserve';

export type ContextItem = {
  id: string;
  label: string;
  tokens: number;
};

export type ContextPart = {
  id: ContextPartId;
  label: string;
  tokens: number;
  items: ContextItem[];
};

export type ContextBudget = {
  limit: number;
  /** Held back for the model's answer: never filled by the context. */
  reserve: number;
  parts: ContextPart[];
};

export type ContextLevel = 'room' | 'filling' | 'compact';

export type Compaction = {
  foldedTurns: number;
  summaryTokens: number;
};

export const CONTEXT_LIMIT = 200_000;

export const CONTEXT_RESERVE = 16_000;

/** Parts are parts of one whole, not entities: they take the chart ramp and a muted fill, never the series. */
export const PART_FILL: Record<ContextPartId, string> = {
  system: 'color-mix(in oklab, var(--muted-foreground) 30%, transparent)',
  tools: 'var(--chart-3)',
  files: 'var(--chart-2)',
  summary: 'var(--chart-4)',
  conversation: 'var(--chart-1)',
};

export const RESERVE_STYLE = {
  backgroundColor:
    'color-mix(in oklab, var(--muted-foreground) 8%, transparent)',
  backgroundImage: hatchOf('var(--muted-foreground)', 40),
};

export const LEVEL_WORD: Record<ContextLevel, string> = {
  room: 'Plenty of room',
  filling: 'Filling up',
  compact: 'Compact soon',
};

export const LEVEL_LABELS = [
  LEVEL_WORD.room,
  LEVEL_WORD.filling,
  LEVEL_WORD.compact,
];

export const LEVEL_TONE: Record<ContextLevel, string> = {
  room: 'text-muted-foreground',
  filling: 'text-foreground',
  compact: 'text-warning-foreground',
};

const FILLING_FROM = 0.6;

const COMPACT_FROM = 0.85;

/** The newest turns stay word for word after a compaction. */
const KEPT_TURNS = 2;

const SUMMARY_SHARE = 0.08;

export const SYSTEM_ITEMS: ContextItem[] = [
  { id: 'system-prompt', label: 'System prompt', tokens: 4_100 },
  { id: 'system-notes', label: 'Saved notes', tokens: 2_100 },
];

export const TOOL_ITEMS: ContextItem[] = [
  { id: 'tool-search', label: 'web_search results', tokens: 1_900 },
  { id: 'tool-page', label: 'fetch_page result', tokens: 2_300 },
  { id: 'tool-sheet', label: 'read_sheet rows', tokens: 2_600 },
  { id: 'tool-script', label: 'run_script output', tokens: 1_800 },
];

export const FILE_ITEMS: ContextItem[] = [
  { id: 'file-invoices', label: 'q3-invoices.xlsx', tokens: 21_400 },
  { id: 'file-contract', label: 'brightmoor-contract.pdf', tokens: 18_600 },
  { id: 'file-pricing', label: 'pricing-page.html', tokens: 9_800 },
  { id: 'file-notes', label: 'vendor-notes.md', tokens: 3_100 },
];

const TURN_TOKENS = [
  5_200, 7_400, 9_800, 6_100, 12_400, 8_300, 10_900, 7_700, 13_600, 9_200,
  11_800, 8_600,
];

function turnOf(tokens: number, index: number): ContextItem {
  const number = index + 1;
  return { id: `turn-${number}`, label: `Turn ${number}`, tokens };
}

export const TURNS: ContextItem[] = TURN_TOKENS.map(turnOf);

export function sumTokens(items: readonly { tokens: number }[]) {
  let total = 0;
  for (const item of items) {
    total += item.tokens;
  }
  return total;
}

/** What the run holds before any conversation: system, tools and every file. */
const SYSTEM_TOKENS = sumTokens(SYSTEM_ITEMS);

const TOOL_TOKENS = sumTokens(TOOL_ITEMS);

const FILE_TOKENS = sumTokens(FILE_ITEMS);

export const BASE_TOKENS = SYSTEM_TOKENS + TOOL_TOKENS + FILE_TOKENS;

export function usedTokensOf(budget: ContextBudget) {
  return sumTokens(budget.parts);
}

export function freeTokensOf(budget: ContextBudget) {
  const used = usedTokensOf(budget);
  const free = budget.limit - budget.reserve - used;
  return Math.max(0, free);
}

export function shareOf(tokens: number, budget: ContextBudget) {
  return tokens / budget.limit;
}

export function percentOf(tokens: number, budget: ContextBudget) {
  const share = shareOf(tokens, budget);
  return share * 100;
}

export function levelOf(budget: ContextBudget): ContextLevel {
  const used = usedTokensOf(budget);
  const share = shareOf(used, budget);
  if (share < FILLING_FROM) {
    return 'room';
  }
  if (share <= COMPACT_FROM) {
    return 'filling';
  }
  return 'compact';
}

export function turnsWithin(conversationTokens: number) {
  const turns: ContextItem[] = [];
  let total = 0;
  for (const turn of TURNS) {
    const next = total + turn.tokens;
    if (next > conversationTokens) {
      break;
    }
    turns.push(turn);
    total = next;
  }
  return turns;
}

/** The tokens of the turns a compaction folds away: every turn of the conversation but the newest ones. */
export function foldableTokensOf(budget: ContextBudget) {
  const conversation = budget.parts.find((part) => part.id === 'conversation');
  if (!conversation) {
    return 0;
  }
  const foldedCount = conversation.items.length - KEPT_TURNS;
  if (foldedCount < 1) {
    return 0;
  }
  const folded = conversation.items.slice(0, foldedCount);
  return sumTokens(folded);
}

export function compactionOf(turns: ContextItem[]): Compaction | null {
  const foldedTurns = turns.length - KEPT_TURNS;
  if (foldedTurns < 2) {
    return null;
  }
  const folded = turns.slice(0, foldedTurns);
  const foldedTokens = sumTokens(folded);
  const rawSummary = foldedTokens * SUMMARY_SHARE;
  const summaryHundreds = Math.round(rawSummary / 100);
  const summaryTokens = summaryHundreds * 100;
  return { foldedTurns, summaryTokens };
}

function partOf(
  id: ContextPartId,
  label: string,
  items: ContextItem[]
): ContextPart {
  return { id, label, tokens: sumTokens(items), items };
}

function turnCountOf(count: number) {
  if (count === 1) {
    return '1 turn';
  }
  return `${count} turns`;
}

type BudgetInput = {
  turns: ContextItem[];
  removedFileIds: readonly string[];
  compaction: Compaction | null;
};

export function budgetOf({
  turns,
  removedFileIds,
  compaction,
}: BudgetInput): ContextBudget {
  const files = FILE_ITEMS.filter((file) => !removedFileIds.includes(file.id));
  const foldedCount = compaction?.foldedTurns ?? 0;
  const liveTurns = turns.slice(foldedCount);
  const parts: ContextPart[] = [
    partOf('system', 'System', SYSTEM_ITEMS),
    partOf('tools', 'Tools', TOOL_ITEMS),
    partOf('files', 'Files', files),
  ];
  if (compaction) {
    const summaryLabel = `Summary of ${turnCountOf(compaction.foldedTurns)}`;
    const summary = {
      id: 'summary',
      label: summaryLabel,
      tokens: compaction.summaryTokens,
    };
    parts.push(partOf('summary', 'Summary', [summary]));
  }
  parts.push(partOf('conversation', 'Conversation', liveTurns));
  return { limit: CONTEXT_LIMIT, reserve: CONTEXT_RESERVE, parts };
}

export function compactionLineOf(compaction: Compaction) {
  const turns = turnCountOf(compaction.foldedTurns);
  const thousands = compaction.summaryTokens / 1000;
  const summary = `${thousands.toFixed(1)}k`;
  return `Folded ${turns} into a ${summary} summary`;
}
