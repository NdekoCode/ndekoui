'use client';

import type { useRender } from '@base-ui/react/use-render';
import type { ItemInstance } from '@headless-tree/core';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { createContext, useContext, useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  EASE_IN_OUT_STRONG,
  rowPresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { TreeItem } from '@/registry/ndeko/ui/tree';

/*
 * The highlight is one element shared by every row of a tree. It glides to the row that mounts it
 * only when that row gives it another layout dependency than the row it left, hence the row id.
 */
const HighlightContext = createContext<string | undefined>(undefined);

const TRAVEL = { duration: 0.25, ease: EASE_IN_OUT_STRONG };

const NO_TRAVEL = { duration: 0 };

const FRAME = 'flex min-w-0 items-center gap-1.5';

const ITEM = 'relative min-w-0 flex-1 ps-(--row-indent) pb-0.5';

const HIGHLIGHT =
  'bg-primary/[0.08] pointer-events-none absolute start-(--row-indent) end-0 top-0 bottom-0.5 -z-10 rounded-md';

/* The highlight glides between rows, so the label stops drawing its own tint on a selected row. A search match keeps its colour. */
const LABEL_WITHOUT_TINT =
  '[&[data-selected=true]:not([data-search-match=true])_[data-slot=tree-item-label]]:bg-transparent';

/* One hairline per level of nesting, each under the icon of the folder it belongs to. */
const GUIDES = [
  'bg-no-repeat [background-position:-0.25rem_0] [background-size:var(--row-indent)_100%]',
  'bg-[repeating-linear-gradient(to_right,transparent_0_calc(var(--tree-indent)_-_var(--hairline)),var(--border)_calc(var(--tree-indent)_-_var(--hairline))_var(--tree-indent))]',
].join(' ');

function travelOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return NO_TRAVEL;
  }
  return TRAVEL;
}

function layoutOf(travels: boolean) {
  if (travels) {
    return 'position' as const;
  }
  return false;
}

/* A tree set up without the selection feature keeps no list of selected rows. */
function selectedIdsOf<T>(item: ItemInstance<T>) {
  const { selectedItems } = item.getTree().getState();
  return selectedItems ?? [];
}

/* A row that left the visible tree reports level -1 while it fades out: it keeps the indent it had. */
function useShownLevel<T>(item: ItemInstance<T>) {
  const { level } = item.getItemMeta();
  const [shownLevel, setShownLevel] = useState(level);
  const isInTree = level >= 0;
  const hasMoved = level !== shownLevel;
  if (isInTree && hasMoved) {
    setShownLevel(level);
    return level;
  }
  return shownLevel;
}

type TreeRowsProps = {
  children: React.ReactNode;
};

/* Rows that are there when the tree mounts do not animate: only the ones a folder opens or closes later do. */
export function TreeRows({ children }: TreeRowsProps) {
  const highlightId = useId();

  return (
    <HighlightContext.Provider value={highlightId}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </HighlightContext.Provider>
  );
}

type TreeRowProps<T> = {
  item: ItemInstance<T>;
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  render?: useRender.ComponentProps<'button'>['render'];
  hasGuides?: boolean;
  travels?: boolean;
  className?: string;
};

export function TreeRow<T>({
  item,
  children,
  leading,
  trailing,
  render,
  hasGuides = false,
  travels = false,
  className,
}: TreeRowProps<T>) {
  const highlightId = useContext(HighlightContext);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isPresent = useIsPresent();
  const [isResizing, setIsResizing] = useState(false);
  const level = useShownLevel(item);
  const presence = rowPresenceOf(shouldReduceMotion);
  const travel = travelOf(shouldReduceMotion);
  const transition = { ...presence.transition, layout: travel };
  const glide = springOf(shouldReduceMotion);
  const layout = layoutOf(travels);
  const itemId = item.getId();
  const position = item.getItemMeta().index;
  const selectedIds = selectedIdsOf(item);
  const isSelected = selectedIds.includes(itemId);
  const isOnlySelected = isSelected && selectedIds.length === 1;
  /* A row on its way out keeps a plain tint, so its removal never waits for the highlight to land elsewhere. */
  const hasGlidingTint = isOnlySelected && isPresent;
  const hasStillTint = isSelected && !hasGlidingTint;
  const isClipped = isResizing || !isPresent;
  const frameStyle = {
    '--row-indent': `calc(var(--tree-indent) * ${level})`,
  } as React.CSSProperties;

  function startResizing() {
    setIsResizing(true);
  }

  function stopResizing() {
    setIsResizing(false);
  }

  return (
    <motion.div
      data-slot='tree-row'
      style={frameStyle}
      className={cn(FRAME, isClipped && 'overflow-hidden')}
      layout={layout}
      layoutDependency={position}
      onAnimationStart={startResizing}
      onAnimationComplete={stopResizing}
      {...presence}
      transition={transition}
    >
      {leading}
      <TreeItem
        item={item}
        render={render}
        className={cn(ITEM, LABEL_WITHOUT_TINT, hasGuides && GUIDES, className)}
      >
        {hasGlidingTint && (
          <motion.span
            layoutId={highlightId}
            layoutDependency={itemId}
            transition={glide}
            aria-hidden='true'
            className={HIGHLIGHT}
          />
        )}
        {hasStillTint && <span aria-hidden='true' className={HIGHLIGHT} />}
        {children}
      </TreeItem>
      {trailing}
    </motion.div>
  );
}
