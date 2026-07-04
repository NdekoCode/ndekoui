'use client';

import { useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

import { CompactOffer, contextAnnouncementOf } from './_parts/compact-offer';
import {
  freeTokensOf,
  LEVEL_WORD,
  levelOf,
  PART_FILL,
  RESERVE_STYLE,
  usedTokensOf,
  type Compaction,
  type ContextBudget,
  type ContextItem,
  type ContextPartId,
} from './_parts/context';
import { ContextHeader } from './_parts/context-header';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { TokenCount } from './_parts/token-count';
import {
  useContextControls,
  useContextRun,
  type CompactStatus,
} from './_parts/use-context-demo';

type CellKind = ContextPartId | 'free' | 'reserve';

type LegendEntry = {
  kind: CellKind;
  label: string;
  tokens: number;
};

/** One cell holds a thousand tokens; a 200k context is a field of 10 rows of 20. */
const TOKENS_PER_CELL = 1000;

const FILL_STAGGER_MS = 14;

const FREE_FILL = 'color-mix(in oklab, var(--foreground) 6%, transparent)';

function cellStyleOf(kind: CellKind): React.CSSProperties {
  if (kind === 'free') {
    return { backgroundColor: FREE_FILL };
  }
  if (kind === 'reserve') {
    return RESERVE_STYLE;
  }
  return { backgroundColor: PART_FILL[kind] };
}

function cellCountOf(tokens: number) {
  return Math.round(tokens / TOKENS_PER_CELL);
}

/** Parts fill cells in order, rounded on running totals so the field always adds up to the limit. */
function cellKindsOf(budget: ContextBudget) {
  const total = cellCountOf(budget.limit);
  const reserveCells = cellCountOf(budget.reserve);
  const freeEnd = total - reserveCells;
  const kinds: CellKind[] = [];
  let runningTokens = 0;
  for (const part of budget.parts) {
    runningTokens += part.tokens;
    const partEnd = cellCountOf(runningTokens);
    const boundary = Math.min(partEnd, freeEnd);
    while (kinds.length < boundary) {
      kinds.push(part.id);
    }
  }
  while (kinds.length < freeEnd) {
    kinds.push('free');
  }
  while (kinds.length < total) {
    kinds.push('reserve');
  }
  return kinds;
}

function isPartCell(kind: CellKind) {
  const isFree = kind === 'free';
  const isReserve = kind === 'reserve';
  return !isFree && !isReserve;
}

function filledCountOf(kinds: CellKind[]) {
  const filled = kinds.filter(isPartCell);
  return filled.length;
}

type FillHistory = { filled: number; previous: number };

function delayOf(index: number, history: FillHistory, isStaggered: boolean) {
  if (!isStaggered) {
    return 0;
  }
  const isNew = index >= history.previous;
  const isFilled = index < history.filled;
  if (isNew && isFilled) {
    const order = index - history.previous;
    return order * FILL_STAGGER_MS;
  }
  return 0;
}

function dimOf(kind: CellKind, activeKind: CellKind | null) {
  if (activeKind === null) {
    return 'opacity-100';
  }
  if (kind === activeKind) {
    return 'opacity-100';
  }
  return 'opacity-25';
}

function useFillHistory(filled: number) {
  const [history, setHistory] = useState<FillHistory>({
    filled,
    previous: filled,
  });
  if (history.filled !== filled) {
    setHistory({ filled, previous: history.filled });
  }
  return history;
}

function legendOf(budget: ContextBudget): LegendEntry[] {
  const entries: LegendEntry[] = [];
  for (const part of budget.parts) {
    if (part.tokens > 0) {
      entries.push({ kind: part.id, label: part.label, tokens: part.tokens });
    }
  }
  const free = freeTokensOf(budget);
  entries.push({ kind: 'free', label: 'Free', tokens: free });
  entries.push({
    kind: 'reserve',
    label: 'Held for the answer',
    tokens: budget.reserve,
  });
  return entries;
}

function spokenFieldOf(budget: ContextBudget) {
  const used = usedTokensOf(budget);
  const usedText = formatTokens(used);
  const limitText = formatTokens(budget.limit);
  return `${usedText} of ${limitText} tokens used, one cell per thousand`;
}

function cellLookOf(
  kind: CellKind,
  index: number,
  history: FillHistory,
  isStaggered: boolean
): React.CSSProperties {
  const delay = delayOf(index, history, isStaggered);
  return { ...cellStyleOf(kind), transitionDelay: `${delay}ms` };
}

function CellField({
  budget,
  activeKind,
}: {
  budget: ContextBudget;
  activeKind: CellKind | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const kinds = cellKindsOf(budget);
  const filled = filledCountOf(kinds);
  const history = useFillHistory(filled);
  const isStaggered = !shouldReduceMotion;
  const spoken = spokenFieldOf(budget);

  return (
    <div role='img' aria-label={spoken} className='grid grid-cols-20 gap-0.5'>
      {kinds.map((kind, index) => (
        <span
          key={index}
          className={cn(
            'aspect-square rounded-[3px] transition-[background-color,opacity] duration-300 ease-(--ease-out-strong)',
            dimOf(kind, activeKind)
          )}
          style={cellLookOf(kind, index, history, isStaggered)}
        />
      ))}
    </div>
  );
}

function LegendButton({
  entry,
  isPinned,
  onPreview,
  onTogglePin,
}: {
  entry: LegendEntry;
  isPinned: boolean;
  onPreview: (kind: CellKind | null) => void;
  onTogglePin: (kind: CellKind) => void;
}) {
  function preview() {
    onPreview(entry.kind);
  }

  function clearPreview() {
    onPreview(null);
  }

  return (
    <button
      type='button'
      aria-pressed={isPinned}
      onPointerEnter={preview}
      onPointerLeave={clearPreview}
      onFocus={preview}
      onBlur={clearPreview}
      onClick={() => onTogglePin(entry.kind)}
      className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 aria-pressed:bg-foreground/[0.05] flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
    >
      <span
        aria-hidden='true'
        className='size-2.5 shrink-0 rounded-[3px]'
        style={cellStyleOf(entry.kind)}
      />
      <span className='min-w-0 flex-1 truncate'>{entry.label}</span>
      <TokenCount tokens={entry.tokens} className='text-muted-foreground' />
    </button>
  );
}

function barStyleOf(turn: ContextItem, maxTokens: number): React.CSSProperties {
  const share = turn.tokens / maxTokens;
  const height = Math.max(8, share * 100);
  return { height: `${height}%` };
}

function turnCountOf(count: number) {
  if (count === 1) {
    return '1 turn';
  }
  return `${count} turns`;
}

function maxTokensOf(turns: ContextItem[]) {
  let max = 1;
  for (const turn of turns) {
    max = Math.max(max, turn.tokens);
  }
  return max;
}

function turnFillOf(index: number, lastIndex: number, foldedTurns: number) {
  if (index < foldedTurns) {
    return 'bg-chart-4';
  }
  if (index === lastIndex) {
    return 'bg-chart-1';
  }
  return 'bg-foreground/20';
}

function TurnSparkline({
  turns,
  foldedTurns,
}: {
  turns: ContextItem[];
  foldedTurns: number;
}) {
  const maxTokens = maxTokensOf(turns);
  const lastIndex = turns.length - 1;

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-baseline justify-between gap-3 text-xs'>
        <span className='text-muted-foreground'>Tokens added per turn</span>
        <span className='text-muted-foreground tabular-nums'>
          {turnCountOf(turns.length)}
        </span>
      </div>
      <div aria-hidden='true' className='flex h-8 items-end gap-0.5'>
        {turns.map((turn, index) => (
          <span
            key={turn.id}
            className={cn(
              'min-w-0 flex-1 origin-bottom rounded-t-[2px] transition-[background-color,scale] duration-300 ease-(--ease-out-strong) starting:scale-y-0',
              turnFillOf(index, lastIndex, foldedTurns)
            )}
            style={barStyleOf(turn, maxTokens)}
          />
        ))}
      </div>
      <table className='sr-only'>
        <caption>Tokens added per turn</caption>
        <tbody>
          {turns.map((turn) => (
            <tr key={turn.id}>
              <th scope='row'>{turn.label}</th>
              <td>{formatTokens(turn.tokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function activeKindOf(preview: CellKind | null, pinned: CellKind | null) {
  if (preview !== null) {
    return preview;
  }
  return pinned;
}

export type ContextCellsProps = {
  budget: ContextBudget;
  turns: ContextItem[];
  compaction?: Compaction | null;
  canCompact?: boolean;
  compactStatus?: CompactStatus;
  onCompact?: () => void;
  className?: string;
};

export function ContextCells({
  budget,
  turns,
  compaction = null,
  canCompact = false,
  compactStatus = 'idle',
  onCompact,
  className,
}: ContextCellsProps) {
  const [previewKind, setPreviewKind] = useState<CellKind | null>(null);
  const [pinnedKind, setPinnedKind] = useState<CellKind | null>(null);
  const titleId = useId();
  const legend = legendOf(budget);
  const activeKind = activeKindOf(previewKind, pinnedKind);
  const foldedTurns = compaction?.foldedTurns ?? 0;

  function togglePin(kind: CellKind) {
    setPinnedKind((current) => {
      if (current === kind) {
        return null;
      }
      return kind;
    });
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border @container flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <ContextHeader budget={budget} titleId={titleId} />
      <CellField budget={budget} activeKind={activeKind} />
      <ul
        aria-label='Parts of the context, point at one to light its cells'
        className='-mx-2 grid grid-cols-1 gap-x-3 @md:grid-cols-2'
      >
        {legend.map((entry) => (
          <li key={entry.kind}>
            <LegendButton
              entry={entry}
              isPinned={pinnedKind === entry.kind}
              onPreview={setPreviewKind}
              onTogglePin={togglePin}
            />
          </li>
        ))}
      </ul>
      <TurnSparkline turns={turns} foldedTurns={foldedTurns} />
      <CompactOffer
        budget={budget}
        canCompact={canCompact}
        compactStatus={compactStatus}
        compaction={compaction}
        onCompact={onCompact}
      />
    </section>
  );
}

export default function Run06() {
  const { ref, turns, restart, isFinished } = useContextRun();
  const controls = useContextControls(turns);
  const level = levelOf(controls.budget);
  const announcement = contextAnnouncementOf(
    level,
    LEVEL_WORD[level],
    controls.compaction
  );

  function replay() {
    controls.reset();
    restart();
  }

  return (
    <div ref={ref} className='flex w-full max-w-[28rem] flex-col gap-2'>
      <ContextCells
        budget={controls.budget}
        turns={turns}
        compaction={controls.compaction}
        canCompact={controls.canCompact}
        compactStatus={controls.compactStatus}
        onCompact={controls.compact}
      />
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={isFinished}
          onReplay={replay}
          label='Replay the conversation'
        />
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}
