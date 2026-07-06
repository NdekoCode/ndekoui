'use client';

import { useEffect, useState, type RefObject } from 'react';

export type Cells = {
  columns: number;
  rows: number;
};

const NO_CELLS: Cells = { columns: 0, rows: 0 };

function cellsOf(element: HTMLElement, cell: number): Cells {
  const side = Math.max(1, cell);
  const across = element.clientWidth / side;
  const down = element.clientHeight / side;
  const columns = Math.ceil(across);
  const rows = Math.ceil(down);
  return { columns, rows };
}

function keptIfSame(current: Cells, next: Cells) {
  const hasSameColumns = current.columns === next.columns;
  const hasSameRows = current.rows === next.rows;
  if (hasSameColumns && hasSameRows) {
    return current;
  }
  return next;
}

/**
 * How many cells of `cell` pixels it takes to cover the element, counted again when its box
 * changes. Both counts are 0 until the box has been measured. The state only changes when a count
 * does, so a resize that stays inside the same cells renders nothing again.
 */
export function useCells<Target extends HTMLElement>(
  ref: RefObject<Target | null>,
  cell: number
) {
  const [cells, setCells] = useState(NO_CELLS);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const measured = element;

    function count() {
      const next = cellsOf(measured, cell);
      setCells((current) => keptIfSame(current, next));
    }

    const observer = new ResizeObserver(count);
    observer.observe(measured);
    return () => observer.disconnect();
  }, [ref, cell]);

  return cells;
}
