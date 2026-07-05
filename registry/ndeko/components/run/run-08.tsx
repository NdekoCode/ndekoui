'use client';

import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { formatTokens } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
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
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  EASE_IN_OUT_STRONG,
  FADE,
  risePresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import {
  squarify,
  type TreemapEntry,
  type TreemapRect,
} from './_parts/treemap';
import {
  FILLING_SESSION,
  useContextSession,
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

function selectionOf(isSelected: boolean) {
  if (isSelected) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function boxShapeOf(kind: TileKind) {
  if (kind === 'free') {
    return 'hairline-border border-dashed border-foreground/25';
  }
  return undefined;
}

function labelToneOf(kind: TileKind) {
  if (kind === 'free') {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

/** Where the turns go when they are folded: the place of the summary tile, for the tiles that leave. */
const FoldTargetContext = createContext<TreemapRect | null>(null);

const TRAVEL: KeyframeAnimationOptions = {
  duration: 320,
  easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
};

const LANDING: KeyframeAnimationOptions = { ...TRAVEL, fill: 'forwards' };

type Placement = {
  shift: string;
  scale: string;
};

/**
 * What draws a tile of rectangle `own` where the rectangle `other` is, from its top left corner.
 * Both rectangles come from the layout, so nothing is measured in the page.
 */
function placementOf(own: TreemapRect, other: TreemapRect): Placement {
  const leftGap = other.x - own.x;
  const topGap = other.y - own.y;
  const shiftX = (leftGap / own.width) * 100;
  const shiftY = (topGap / own.height) * 100;
  const scaleX = other.width / own.width;
  const scaleY = other.height / own.height;
  return {
    shift: `translate(${shiftX}%, ${shiftY}%)`,
    scale: `scale(${scaleX}, ${scaleY})`,
  };
}

function isSameRect(first: TreemapRect, second: TreemapRect) {
  const isSamePlace = first.x === second.x && first.y === second.y;
  const isSameWidth = first.width === second.width;
  const isSameHeight = first.height === second.height;
  return isSamePlace && isSameWidth && isSameHeight;
}

type TileParts = {
  box: React.RefObject<HTMLSpanElement | null>;
  label: React.RefObject<HTMLSpanElement | null>;
};

/**
 * A tile sits at its new rectangle at once, then its plate plays the way there from the old one by
 * transform. The label only travels, so its text never stretches.
 */
function useTileTravel(rect: TreemapRect, parts: TileParts) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const previous = useRef<TreemapRect | null>(null);
  const { x, y, width, height } = rect;
  const { box, label } = parts;

  useLayoutEffect(() => {
    const from = previous.current;
    const to = { x, y, width, height };
    previous.current = to;
    if (!from || shouldReduceMotion) {
      return;
    }
    if (isSameRect(from, to)) {
      return;
    }
    const start = placementOf(to, from);
    box.current?.animate(
      [{ transform: `${start.shift} ${start.scale}` }, { transform: 'none' }],
      TRAVEL
    );
    label.current?.animate(
      [{ transform: start.shift }, { transform: 'none' }],
      TRAVEL
    );
  }, [x, y, width, height, shouldReduceMotion, box, label]);
}

/** A turn that leaves because it was folded flies into the summary tile while it fades. */
function useFoldInto(tile: Tile, parts: TileParts) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPresent = useIsPresent();
  const target = useContext(FoldTargetContext);
  const isTurn = tile.kind === 'conversation';
  const { x, y, width, height } = tile.rect;
  const { box, label } = parts;
  const targetX = target?.x;
  const targetY = target?.y;
  const targetWidth = target?.width;
  const targetHeight = target?.height;

  useEffect(() => {
    const isLeaving = !isPresent && isTurn;
    if (!isLeaving || shouldReduceMotion) {
      return;
    }
    const hasTarget = targetX !== undefined && targetY !== undefined;
    const hasTargetSize =
      targetWidth !== undefined && targetHeight !== undefined;
    if (!hasTarget || !hasTargetSize) {
      return;
    }
    const own = { x, y, width, height };
    const summary = {
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
    };
    const end = placementOf(own, summary);
    box.current?.animate(
      [{ transform: 'none' }, { transform: `${end.shift} ${end.scale}` }],
      LANDING
    );
    label.current?.animate(
      [{ transform: 'none' }, { transform: end.shift }],
      LANDING
    );
  }, [
    isPresent,
    isTurn,
    shouldReduceMotion,
    x,
    y,
    width,
    height,
    targetX,
    targetY,
    targetWidth,
    targetHeight,
    box,
    label,
  ]);
}

type TileButtonProps = {
  tile: Tile;
  isSelected: boolean;
  onSelect: (tileId: string) => void;
};

function TileButton({ tile, isSelected, onSelect }: TileButtonProps) {
  const box = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const room = roomOf(tile.rect);
  const showsName = room !== 'none';
  const showsTokens = room === 'full';
  const tokens = formatTokens(tile.tokens);
  useTileTravel(tile.rect, { box, label });
  useFoldInto(tile, { box, label });

  return (
    <button
      type='button'
      aria-pressed={isSelected}
      aria-label={`${tile.label}, ${tile.group}, ${tokens} tokens`}
      onClick={() => onSelect(tile.id)}
      className='focus-visible:ring-ring/40 relative block size-full cursor-pointer rounded-md text-start outline-none focus-visible:ring-[3px]'
    >
      <span
        ref={box}
        aria-hidden='true'
        className={cn(
          'absolute inset-0 origin-top-left rounded-md',
          boxShapeOf(tile.kind)
        )}
        style={tileFillOf(tile.kind)}
      >
        <span
          className={cn(
            'ring-foreground/60 absolute inset-0 rounded-md ring-2 transition-opacity duration-150 ring-inset',
            selectionOf(isSelected)
          )}
        />
      </span>
      <span
        ref={label}
        className={cn(
          'relative flex size-full flex-col items-start justify-start overflow-hidden p-1.5',
          labelToneOf(tile.kind)
        )}
      >
        {showsName && (
          <span className='w-full truncate text-[11px] leading-4 font-medium'>
            {tile.label}
          </span>
        )}
        {showsTokens && (
          <span className='text-muted-foreground text-[11px] leading-4 tabular-nums'>
            {tokens}
          </span>
        )}
      </span>
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

/** A tile that leaves stays long enough to be seen on its way before it is gone. */
const TILE_EXIT = {
  opacity: 0,
  transition: { duration: 0.3, ease: EASE_IN_OUT_STRONG },
};

function summaryRectOf(tiles: Tile[]) {
  const summary = tiles.find((tile) => tile.kind === 'summary');
  return summary?.rect ?? null;
}

export type ContextTreemapProps = {
  budget: ContextBudget;
  /** The same context without the last compaction, for the Before view. */
  budgetBefore?: ContextBudget;
  compaction?: Compaction | null;
  canCompact?: boolean;
  compactStatus?: CompactStatus;
  onCompact?: () => void;
  /** Shows Compact held down, for a demonstration that presses it. */
  isCompactPressed?: boolean;
  className?: string;
};

export function ContextTreemap({
  budget,
  budgetBefore = budget,
  compaction = null,
  canCompact = false,
  compactStatus = 'idle',
  onCompact,
  isCompactPressed = false,
  className,
}: ContextTreemapProps) {
  const [view, setView] = useState<View>('after');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const hasCompaction = compaction !== null;
  const shownView = shownViewOf(view, hasCompaction);
  const shownBudget = viewedBudgetOf(shownView, budget, budgetBefore);
  const tiles = tilesOf(shownBudget);
  const summaryRect = summaryRectOf(tiles);
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
      <FoldTargetContext.Provider value={summaryRect}>
        <ul
          aria-label='Tiles of the context, sized by tokens'
          className='relative aspect-[4/3] w-full'
        >
          <AnimatePresence initial={false}>
            {tiles.map((tile) => (
              <motion.li
                key={tile.layoutId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={TILE_EXIT}
                transition={FADE}
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
      </FoldTargetContext.Provider>
      <AnimatedSize>
        <TileDetails tile={selectedTile} budget={shownBudget} />
      </AnimatedSize>
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

function shownViewOf(view: View, hasCompaction: boolean): View {
  if (hasCompaction) {
    return view;
  }
  return 'after';
}

export default function Run08() {
  const {
    ref,
    isInView,
    isAutoplaying,
    canReplay,
    pressed,
    budget,
    budgetBefore,
    compaction,
    compactStatus,
    canCompact,
    compact,
    replay,
  } = useContextSession(FILLING_SESSION);
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
      className='flex min-h-[44.5rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <ContextTreemap
          budget={budget}
          budgetBefore={budgetBefore}
          compaction={compaction}
          canCompact={canCompact}
          compactStatus={compactStatus}
          onCompact={compact}
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
