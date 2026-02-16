'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type EventVisibilityOptions = {
  eventHeight: number;
  eventGap: number;
};

/**
 * Measures one month cell so every cell shows as many events as fit, keeping a row for
 * the "more" button when some are left out.
 */
export function useEventVisibility({
  eventHeight,
  eventGap,
}: EventVisibilityOptions) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setContentHeight(content.clientHeight);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const getVisibleEventCount = useCallback(
    (totalEvents: number) => {
      if (!contentHeight) {
        return totalEvents;
      }
      const maxEvents = Math.floor(contentHeight / (eventHeight + eventGap));
      if (totalEvents <= maxEvents) {
        return totalEvents;
      }
      return Math.max(0, maxEvents - 1);
    },
    [contentHeight, eventHeight, eventGap]
  );

  return { contentRef, contentHeight, getVisibleEventCount };
}
