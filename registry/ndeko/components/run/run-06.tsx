'use client';

import { useId, useState } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
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
  type ContextSlot,
} from './_parts/context';
import { ContextHeader } from './_parts/context-header';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { TokenCount } from './_parts/token-count';
import {
  FILLING_SCRIPT,
  FILLING_SESSION,
  useContextSession,
  type CompactStatus,
  type ContextSession,
  type ContextStep,
} from './_parts/use-context-demo';

type CellKind = ContextSlot;

type LegendEntry = {
  kind: CellKind;
  label: string;
  tokens: number;
};

/** One cell holds a thousand tokens; a 200k context is a field of 10 rows of 20. */
const TOKENS_PER_CELL = 1000;

const FILL_STAGGER_MS = 14;

const FREE_FILL = 'color-mix(in oklab, var(--foreground) 6%, transparent)';

function fillOf(kind: Exclude<CellKind, 'reserve'>) {
  if (kind === 'free') {
    return FREE_FILL;
  }
  return PART_FILL[kind];
}

function cellStyleOf(kind: CellKind): React.CSSProperties {
  if (kind === 'reserve') {
    return RESERVE_STYLE;
  }
  return { backgroundColor: fillOf(kind) };
}

const DIMMED_PERCENT = 25;

const DIMMED_OPACITY = DIMMED_PERCENT / 100;

/**
 * A cell that steps back keeps a quarter of its colour. The colour itself fades, so two hundred
 * cells dim in one repaint of the field and none of them becomes a layer of its own.
 */
function dimmedCellStyleOf(kind: CellKind): React.CSSProperties {
  if (kind === 'reserve') {
    return { ...RESERVE_STYLE, opacity: DIMMED_OPACITY };
  }
  const fill = fillOf(kind);
  return {
    backgroundColor: `color-mix(in oklab, ${fill} ${DIMMED_PERCENT}%, transparent)`,
  };
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

function isDimmedCell(kind: CellKind, activeKind: CellKind | null) {
  if (activeKind === null) {
    return false;
  }
  return kind !== activeKind;
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

function cellColorOf(kind: CellKind, isDimmed: boolean) {
  if (isDimmed) {
    return dimmedCellStyleOf(kind);
  }
  return cellStyleOf(kind);
}

function cellLookOf(
  kind: CellKind,
  index: number,
  history: FillHistory,
  isStaggered: boolean,
  isDimmed: boolean
): React.CSSProperties {
  const delay = delayOf(index, history, isStaggered);
  const color = cellColorOf(kind, isDimmed);
  return { ...color, transitionDelay: `${delay}ms` };
}

function CellField({
  budget,
  activeKind,
}: {
  budget: ContextBudget;
  activeKind: CellKind | null;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
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
          className='aspect-square rounded-[3px] transition-[background-color,opacity] duration-300 ease-(--ease-out-strong)'
          style={cellLookOf(
            kind,
            index,
            history,
            isStaggered,
            isDimmedCell(kind, activeKind)
          )}
        />
      ))}
    </div>
  );
}

function litRowOf(isLit: boolean) {
  if (isLit) {
    return 'bg-foreground/[0.03]';
  }
  return undefined;
}

function LegendButton({
  entry,
  isPinned,
  isLit,
  onPreview,
  onTogglePin,
}: {
  entry: LegendEntry;
  isPinned: boolean;
  /** Its cells are the ones lit now, whoever pointed at them. */
  isLit: boolean;
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
      className={cn(
        'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 aria-pressed:bg-foreground/[0.05] flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-[13px] transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        litRowOf(isLit)
      )}
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
      <div className='sr-only'>
        <table>
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
    </div>
  );
}

/** What a person points at comes first, then what they pinned, then what was lit from outside. */
function activeKindOf(
  preview: CellKind | null,
  pinned: CellKind | null,
  spotlight: CellKind | null
) {
  if (preview !== null) {
    return preview;
  }
  if (pinned !== null) {
    return pinned;
  }
  return spotlight;
}

export type ContextCellsProps = {
  budget: ContextBudget;
  turns: ContextItem[];
  compaction?: Compaction | null;
  canCompact?: boolean;
  compactStatus?: CompactStatus;
  onCompact?: () => void;
  /** Lights the cells of one part from outside, for a demonstration or a control beside the field. */
  spotlight?: ContextSlot | null;
  /** Shows Compact held down, for a demonstration that presses it. */
  isCompactPressed?: boolean;
  className?: string;
};

export function ContextCells({
  budget,
  turns,
  compaction = null,
  canCompact = false,
  compactStatus = 'idle',
  onCompact,
  spotlight = null,
  isCompactPressed = false,
  className,
}: ContextCellsProps) {
  const [previewKind, setPreviewKind] = useState<CellKind | null>(null);
  const [pinnedKind, setPinnedKind] = useState<CellKind | null>(null);
  const titleId = useId();
  const legend = legendOf(budget);
  const activeKind = activeKindOf(previewKind, pinnedKind, spotlight);
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
              isLit={activeKind === entry.kind}
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
        isPressed={isCompactPressed}
      />
    </section>
  );
}

function spot(after: number, slot: ContextSlot | null): ContextStep {
  return { after, by: 'demo', action: { type: 'spotlight', slot } };
}

/** The demonstration points at each part in turn before the conversation goes on. */
const TOUR: ContextStep[] = [
  spot(1200, 'system'),
  spot(650, 'tools'),
  spot(650, 'files'),
  spot(650, 'conversation'),
  spot(650, 'free'),
  spot(900, null),
];

const SESSION: ContextSession = {
  ...FILLING_SESSION,
  script: [...TOUR, ...FILLING_SCRIPT],
};

/** A part lit by the demonstration lets go the moment a person takes over. */
function spotlightOf(isAutoplaying: boolean, spotlight: ContextSlot | null) {
  if (isAutoplaying) {
    return spotlight;
  }
  return null;
}

export default function Run06() {
  const {
    ref,
    isInView,
    isAutoplaying,
    canReplay,
    pressed,
    turns,
    budget,
    compaction,
    compactStatus,
    canCompact,
    spotlight,
    compact,
    replay,
  } = useContextSession(SESSION);
  const level = levelOf(budget);
  const announcement = contextAnnouncementOf(
    level,
    LEVEL_WORD[level],
    compaction
  );

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[42.5rem] w-full max-w-[28rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ContextCells
          budget={budget}
          turns={turns}
          compaction={compaction}
          canCompact={canCompact}
          compactStatus={compactStatus}
          onCompact={compact}
          spotlight={spotlightOf(isAutoplaying, spotlight)}
          isCompactPressed={pressed === 'compact'}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton
          isShown={canReplay}
          onReplay={replay}
          label='Replay the conversation'
        />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
