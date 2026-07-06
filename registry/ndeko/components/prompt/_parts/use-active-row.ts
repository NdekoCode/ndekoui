'use client';

import { useEffect } from 'react';

import { keepRowInView } from './option-list';

/** Keeps the active row of a list in view as it changes, scrolling the list and never the page. */
export function useActiveRowInView(
  listRef: React.RefObject<HTMLElement | null>,
  rowId: string | undefined
) {
  useEffect(() => {
    if (rowId === undefined) {
      return;
    }
    const list = listRef.current;
    const row = document.getElementById(rowId);
    if (list && row) {
      keepRowInView(list, row);
    }
  }, [listRef, rowId]);
}
