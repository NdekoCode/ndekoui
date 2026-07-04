'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { CompactOffer, contextAnnouncementOf } from './_parts/compact-offer';
import {
  freeTokensOf,
  LEVEL_WORD,
  levelOf,
  PART_FILL,
  percentOf,
  RESERVE_STYLE,
  TURNS,
  type Compaction,
  type ContextBudget,
  type ContextPartId,
} from './_parts/context';
import { ContextHeader } from './_parts/context-header';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  FADE,
  risePresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import {
  squarify,
  type TreemapEntry,
  type TreemapRect,
} from './_parts/treemap';
import {
  useContextControls,
  useContextRun,
  type CompactStatus,
} from './_parts/use-context-demo';

type TileKind = ContextPartId | 'free' | 'reserve';

type Tile = {
  id: string;
  layoutId: string;
  kind: TileKind;
  group: string;
  label: string;
  tokens: number;
  rect: TreemapRect;
};

type View = 'before' | 'after';

/** The map is laid out on a 4 by 3 field, the shape of its frame. */
const FIELD_WIDTH = 100;

const FIELD_HEIGHT = 75;

const FIELD: TreemapRect = {
  x: 0,
  y: 0,
  width: FIELD_WIDTH,
  height: FIELD_HEIGHT,
};

/** The summary takes the place of the oldest turn, so that turn is the one that turns into it. */
const SUMMARY_LAYOUT_ID = TURNS[0].id;

const VIEWS: Segment<View>[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
];

const GROUP_LABEL: Record<TileKind, string> = {
  system: 'System',
  tools: 'Tools',
  files: 'Files',
  summary: 'Summary',
  conversation: 'Conversation',
  free: 'Free',
  reserve: 'Held for the answer',
};

function layoutIdOf(itemId: string) {
  if (itemId === 'summary') {
    return SUMMARY_LAYOUT_ID;
  }
  return itemId;
}

function groupEntriesOf(budget: ContextBudget) {
  const free = freeTokensOf(budget);
  const entries: TreemapEntry[] = budget.parts.map((part) => ({
    id: part.id,
    value: part.tokens,
  }));
  entries.push({ id: 'free', value: free });
  entries.push({ id: 'reserve', value: budget.reserve });
  return entries;
}

function singleTile(
  kind: 'free' | 'reserve',
  tokens: number,
  rect: TreemapRect
): Tile {
  const label = GROUP_LABEL[kind];
  return { id: kind, layoutId: kind, kind, group: label, label, tokens, rect };
}

function tilesOf(budget: ContextBudget) {
  const groups = squarify(groupEntriesOf(budget), FIELD);
  const tiles: Tile[] = [];
  for (const group of groups) {
    if (group.id === 'free') {
      tiles.push(singleTile('free', group.value, group.rect));
      continue;
    }
    if (group.id === 'reserve') {
      tiles.push(singleTile('reserve', group.value, group.rect));
      continue;
    }
    const part = budget.parts.find((candidate) => candidate.id === group.id);
    if (!part) {
      continue;
    }
    const items = part.items.map((item) => ({
      id: item.id,
      value: item.tokens,
    }));
    const placedItems = squarify(items, group.rect);
    for (const placed of placedItems) {
      const item = part.items.find((candidate) => candidate.id === placed.id);
      tiles.push({
        id: placed.id,
        layoutId: layoutIdOf(placed.id),
        kind: part.id,
        group: part.label,
        label: item?.label ?? placed.id,
        tokens: placed.value,
        rect: placed.rect,
      });
    }
  }
  return tiles;
}

function rectStyleOf(rect: TreemapRect): React.CSSProperties {
  const left = (rect.x / FIELD_WIDTH) * 100;
  const top = (rect.y / FIELD_HEIGHT) * 100;
  const width = (rect.width / FIELD_WIDTH) * 100;
  const height = (rect.height / FIELD_HEIGHT) * 100;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

function tileFillOf(kind: TileKind): React.CSSProperties {
  if (kind === 'reserve') {
    return RESERVE_STYLE;
  }
  if (kind === 'free') {
    return {};
  }
  const fill = PART_FILL[kind];
  return {
    backgroundColor: `color-mix(in oklab, ${fill} 24%, var(--card))`,
    boxShadow: `inset 0 0 0 var(--hairline) color-mix(in oklab, ${fill} 40%, transparent)`,
  };
}

type TileRoom = 'none' | 'name' | 'full';

function roomOf(rect: TreemapRect): TileRoom {
  const isWideEnough = rect.width >= 20;
  const isTallEnough = rect.height >= 13;
  if (isWideEnough && isTallEnough) {
    return 'full';
  }
  const fitsName = rect.width >= 17;
  const fitsLine = rect.height >= 8;
  if (fitsName && fitsLine) {
    return 'name';
  }
  return 'none';
}

function selectionRingOf(isSelected: boolean) {
  if (isSelected) {
    return 'ring-2 ring-foreground/60 ring-inset';
  }
  return 'ring-0';
}

function tileShapeOf(kind: TileKind) {
  if (kind === 'free') {
    return 'hairline-border border-dashed border-foreground/25 text-muted-foreground';
  }
  return 'text-foreground';
}

type TileButtonProps = {
  tile: Tile;
  isSelected: boolean;
  onSelect: (tileId: string) => void;
};

function TileButton({ tile, isSelected, onSelect }: TileButtonProps) {
  const room = roomOf(tile.rect);
  const showsName = room !== 'none';
  const showsTokens = room === 'full';
  const tokens = formatTokens(tile.tokens);

  return (
    <button
      type='button'
      aria-pressed={isSelected}
      aria-label={`${tile.label}, ${tile.group}, ${tokens} tokens`}
      onClick={() => onSelect(tile.id)}
      className={cn(
        'focus-visible:ring-ring/40 flex size-full cursor-pointer flex-col items-start justify-start overflow-hidden rounded-md p-1.5 text-start transition-[box-shadow] duration-150 outline-none focus-visible:ring-[3px]',
        tileShapeOf(tile.kind),
        selectionRingOf(isSelected)
      )}
      style={tileFillOf(tile.kind)}
    >
      {showsName && (
        <motion.span
          layout='position'
          className='w-full truncate text-[11px] leading-4 font-medium'
        >
          {tile.label}
        </motion.span>
      )}
      {showsTokens && (
        <motion.span
          layout='position'
          className='text-muted-foreground text-[11px] leading-4 tabular-nums'
        >
          {tokens}
        </motion.span>
      )}
    </button>
  );
}

function TileDetails({
  tile,
  budget,
}: {
  tile: Tile | undefined;
  budget: ContextBudget;
}) {
  if (!tile) {
    return (
      <p className='text-muted-foreground text-xs leading-5'>
        Select a tile to see what it holds
      </p>
    );
  }
  const share = percentOf(tile.tokens, budget);
  const shareText = `${share.toFixed(1)}%`;

  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs'>
      <dt className='text-muted-foreground'>Holds</dt>
      <dd className='truncate font-medium'>{tile.label}</dd>
      <dt className='text-muted-foreground'>Part</dt>
      <dd>{tile.group}</dd>
      <dt className='text-muted-foreground'>Tokens</dt>
      <dd className='tabular-nums'>
        {formatTokens(tile.tokens)}, {shareText} of the window
      </dd>
    </dl>
  );
}

function viewedBudgetOf(
  view: View,
  budget: ContextBudget,
  budgetBefore: ContextBudget
) {
  if (view === 'before') {
    return budgetBefore;
  }
  return budget;
}

export type ContextTreemapProps = {
  budget: ContextBudget;
  /** The same context without the last compaction, for the Before view. */
  budgetBefore?: ContextBudget;
  compaction?: Compaction | null;
  canCompact?: boolean;
  compactStatus?: CompactStatus;
  onCompact?: () => void;
  className?: string;
};

export function ContextTreemap({
  budget,
  budgetBefore = budget,
  compaction = null,
  canCompact = false,
  compactStatus = 'idle',
  onCompact,
  className,
}: ContextTreemapProps) {
  const [view, setView] = useState<View>('after');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const titleId = useId();
  const layoutGroupId = useId();
  const shouldReduceMotion = useReducedMotion();
  const spring = springOf(shouldReduceMotion);
  const risePresence = risePresenceOf(shouldReduceMotion);
  const hasCompaction = compaction !== null;
  const shownView = shownViewOf(view, hasCompaction);
  const shownBudget = viewedBudgetOf(shownView, budget, budgetBefore);
  const tiles = tilesOf(shownBudget);
  const selectedTile = tiles.find((tile) => tile.id === selectedId);

  function select(tileId: string) {
    setSelectedId((current) => {
      if (current === tileId) {
        return null;
      }
      return tileId;
    });
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <ContextHeader budget={shownBudget} titleId={titleId} />
      <AnimatePresence initial={false}>
        {hasCompaction && (
          <motion.div key='views' className='flex' {...risePresence}>
            <Segments
              value={shownView}
              segments={VIEWS}
              onValueChange={setView}
              label='Compare the context before and after the compaction'
            />
          </motion.div>
        )}
      </AnimatePresence>
      <LayoutGroup id={layoutGroupId}>
        <ul
          aria-label='Tiles of the context, sized by tokens'
          className='relative aspect-[4/3] w-full'
        >
          <AnimatePresence initial={false}>
            {tiles.map((tile) => (
              <motion.li
                key={tile.id}
                layoutId={tile.layoutId}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ layout: spring, opacity: FADE }}
                className='absolute p-px'
                style={rectStyleOf(tile.rect)}
              >
                <TileButton
                  tile={tile}
                  isSelected={tile.id === selectedId}
                  onSelect={select}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </LayoutGroup>
      <AnimatedSize>
        <TileDetails tile={selectedTile} budget={shownBudget} />
      </AnimatedSize>
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

function shownViewOf(view: View, hasCompaction: boolean): View {
  if (hasCompaction) {
    return view;
  }
  return 'after';
}

export default function Run08() {
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
    <div ref={ref} className='flex w-full max-w-[30rem] flex-col gap-2'>
      <ContextTreemap
        budget={controls.budget}
        budgetBefore={controls.budgetBefore}
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
