'use client';

import { useEffect, useRef, useState } from 'react';

const PINNED_SLACK_PX = 24;

function distanceFromBottomOf(element: HTMLElement) {
  const bottom = element.scrollTop + element.clientHeight;
  return element.scrollHeight - bottom;
}

type FollowBottomOptions = {
  /**
   * Keeps `isPinned` in state, for a scroller that offers a way back to its last line. Without it
   * scrolling never re-renders the component and `isPinned` stays true.
   */
  tracksPinned?: boolean;
};

/**
 * A scroller follows its last line only while a person has not scrolled away from it. Put
 * `scrollerRef` and `updatePinned` (as `onScroll`) on the scrolling element and `contentRef` on the
 * element inside it that grows.
 */
export function useFollowBottom({
  tracksPinned = false,
}: FollowBottomOptions = {}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const [isPinned, setIsPinned] = useState(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (isPinnedRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function pin(nextPinned: boolean) {
    isPinnedRef.current = nextPinned;
    if (tracksPinned) {
      setIsPinned(nextPinned);
    }
  }

  function updatePinned(event: React.UIEvent<HTMLDivElement>) {
    const distance = distanceFromBottomOf(event.currentTarget);
    const nextPinned = distance <= PINNED_SLACK_PX;
    pin(nextPinned);
  }

  function jumpToBottom() {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    pin(true);
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
  }

  return { scrollerRef, contentRef, isPinned, updatePinned, jumpToBottom };
}
