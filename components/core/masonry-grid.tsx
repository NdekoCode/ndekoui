'use client';
import { motion, useInView } from 'motion/react';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

export type MasonryGridLayout = 'columns' | 'balanced';

export type MasonryGridProps = {
  children: ReactNode;
  className?: string;
  layout?: MasonryGridLayout;
  columnWidth?: number;
  maxColumns?: number;
  gap?: number;
  revealOnView?: boolean;
};

type Cell = {
  key: string;
  node: ReactNode;
};

type MasonryContextValue = {
  gap: number;
  revealOnView: boolean;
  seenKeys: Set<string>;
  markSeen: (key: string) => void;
};

const MasonryContext = createContext<MasonryContextValue | undefined>(
  undefined
);

const REVEAL_MARGIN = '0px 0px -8% 0px';

const REVEAL_HIDDEN = { opacity: 0, y: 12 };

const REVEAL_SHOWN = { opacity: 1, y: 0 };

const COLUMN_STAGGER = 0.04;

function useMasonry() {
  const context = useContext(MasonryContext);
  if (!context) {
    throw new Error('MasonryCell must be used within MasonryGrid');
  }
  return context;
}

function cellsOf(children: ReactNode) {
  const cells: Cell[] = [];
  Children.toArray(children).forEach((child, index) => {
    let key = String(index);
    if (isValidElement(child) && child.key !== null) {
      key = String(child.key);
    }
    cells.push({ key, node: child });
  });
  return cells;
}

function columnCountOf(
  width: number,
  columnWidth: number,
  gap: number,
  maxColumns: number
) {
  const fitting = Math.floor((width + gap) / (columnWidth + gap));
  const atLeastOne = Math.max(1, fitting);
  return Math.min(maxColumns, atLeastOne);
}

function indexOfShortest(totals: number[]) {
  let shortest = 0;
  totals.forEach((total, index) => {
    if (total < totals[shortest]) {
      shortest = index;
    }
  });
  return shortest;
}

/** Places each item, in reading order, at the bottom of the shortest column. */
function balancedColumnsOf(heights: number[], columnCount: number) {
  const columns: number[][] = Array.from({ length: columnCount }, () => []);
  const totals: number[] = Array.from({ length: columnCount }, () => 0);
  heights.forEach((height, index) => {
    const shortest = indexOfShortest(totals);
    columns[shortest].push(index);
    totals[shortest] += height;
  });
  return columns;
}

function measuredHeightsOf(container: HTMLElement, count: number) {
  const heights: number[] = Array.from({ length: count }, () => 0);
  const cells = container.querySelectorAll<HTMLElement>('[data-masonry-cell]');
  cells.forEach((cell) => {
    const index = Number(cell.dataset.masonryCell);
    heights[index] = cell.offsetHeight;
  });
  return heights;
}

function roundRobinColumnsOf(cellCount: number, columnCount: number) {
  const columns: number[][] = Array.from({ length: columnCount }, () => []);
  for (let index = 0; index < cellCount; index += 1) {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(index);
  }
  return columns;
}

function placedCountOf(columns: number[][]) {
  let placed = 0;
  columns.forEach((column) => {
    placed += column.length;
  });
  return placed;
}

function fitsLayout(
  columns: number[][] | null,
  columnCount: number,
  cellCount: number
) {
  if (!columns) {
    return false;
  }
  const hasSameColumnCount = columns.length === columnCount;
  const placesEveryCell = placedCountOf(columns) === cellCount;
  return hasSameColumnCount && placesEveryCell;
}

function contentWidthOf(container: HTMLElement) {
  const style = window.getComputedStyle(container);
  const paddingLeft = Number.parseFloat(style.paddingLeft);
  const paddingRight = Number.parseFloat(style.paddingRight);
  return container.clientWidth - paddingLeft - paddingRight;
}

function sameColumns(current: number[][] | null, next: number[][]) {
  if (!current) {
    return false;
  }
  return JSON.stringify(current) === JSON.stringify(next);
}

function revealDelayOf(columnIndex: number) {
  return columnIndex * COLUMN_STAGGER;
}

type MasonryCellProps = {
  children: ReactNode;
  cellKey: string;
  index: number;
  columnIndex: number;
};

function StaticCell({ children, index }: MasonryCellProps) {
  const { gap } = useMasonry();

  return (
    <div
      data-masonry-cell={index}
      style={{ marginBottom: gap }}
      className='break-inside-avoid'
    >
      {children}
    </div>
  );
}

function RevealCell({
  children,
  cellKey,
  index,
  columnIndex,
}: MasonryCellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { gap, markSeen } = useMasonry();
  const isInView = useInView(ref, { once: true, margin: REVEAL_MARGIN });

  useEffect(() => {
    if (isInView) {
      markSeen(cellKey);
    }
  }, [isInView, cellKey, markSeen]);

  return (
    <motion.div
      ref={ref}
      data-masonry-cell={index}
      style={{ marginBottom: gap }}
      initial={REVEAL_HIDDEN}
      animate={isInView && REVEAL_SHOWN}
      transition={{
        duration: 0.32,
        ease: [0.23, 1, 0.32, 1],
        delay: revealDelayOf(columnIndex),
      }}
      className='break-inside-avoid'
    >
      {children}
    </motion.div>
  );
}

/**
 * Whether the cell was new is read once per mount, so marking it as seen does not swap it
 * mid-entrance. The motion preference stays live: it is only known after the page hydrates.
 */
function MasonryCell(props: MasonryCellProps) {
  const { revealOnView, seenKeys } = useMasonry();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isFirstEntry] = useState(() => !seenKeys.has(props.cellKey));
  const isMotionAllowed = !prefersReducedMotion;
  const wantsReveal = revealOnView && isMotionAllowed;
  const shouldReveal = wantsReveal && isFirstEntry;

  if (shouldReveal) {
    return <RevealCell {...props} />;
  }
  return <StaticCell {...props} />;
}

function MasonryGrid({
  children,
  className,
  layout = 'columns',
  columnWidth = 220,
  maxColumns = 4,
  gap = 16,
  revealOnView = false,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(0);
  const [columns, setColumns] = useState<number[][] | null>(null);
  const [seenKeys, setSeenKeys] = useState<Set<string>>(() => new Set());
  const cells = cellsOf(children);
  const cellCount = cells.length;
  const cellSignature = cells.map((cell) => cell.key).join('|');
  const isBalanced = layout === 'balanced';

  const markSeen = useCallback((key: string) => {
    setSeenKeys((current) => {
      if (current.has(key)) {
        return current;
      }
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (!isBalanced) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const width = contentWidthOf(container);
      const count = columnCountOf(width, columnWidth, gap, maxColumns);
      setColumnCount(count);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isBalanced, columnWidth, gap, maxColumns]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (!isBalanced) {
      return;
    }
    const width = contentWidthOf(container);
    const count = columnCountOf(width, columnWidth, gap, maxColumns);
    if (count !== columnCount) {
      setColumnCount(count);
      return;
    }
    const hasFittingColumns = fitsLayout(columns, count, cellCount);
    if (!hasFittingColumns) {
      setColumns(roundRobinColumnsOf(cellCount, count));
      return;
    }
    const heights = measuredHeightsOf(container, cellCount);
    const next = balancedColumnsOf(heights, count);
    if (!sameColumns(columns, next)) {
      setColumns(next);
    }
  }, [
    isBalanced,
    columnCount,
    columns,
    cellCount,
    cellSignature,
    columnWidth,
    gap,
    maxColumns,
  ]);

  const contextValue = { gap, revealOnView, seenKeys, markSeen };
  const hasBalancedColumns = isBalanced && columns !== null;

  if (hasBalancedColumns) {
    return (
      <MasonryContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          style={{ columnGap: gap }}
          className={cn('flex items-start', className)}
          data-layout='balanced'
        >
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className='flex min-w-0 flex-1 flex-col'>
              {column.map((cellIndex) => {
                const cell = cells[cellIndex];
                if (!cell) {
                  return null;
                }
                return (
                  <MasonryCell
                    key={cell.key}
                    cellKey={cell.key}
                    index={cellIndex}
                    columnIndex={columnIndex}
                  >
                    {cell.node}
                  </MasonryCell>
                );
              })}
            </div>
          ))}
        </div>
      </MasonryContext.Provider>
    );
  }

  return (
    <MasonryContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        style={{ columnWidth, columnCount: maxColumns, columnGap: gap }}
        className={className}
        data-layout='columns'
      >
        {cells.map((cell, index) => (
          <MasonryCell
            key={cell.key}
            cellKey={cell.key}
            index={index}
            columnIndex={0}
          >
            {cell.node}
          </MasonryCell>
        ))}
      </div>
    </MasonryContext.Provider>
  );
}

export { MasonryGrid };
