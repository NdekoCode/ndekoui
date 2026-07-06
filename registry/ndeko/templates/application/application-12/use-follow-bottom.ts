'use client';

import { useEffect, useRef } from 'react';

const PINNED_SLACK_PX = 24;

/** A scroller follows its last line only while a person has not scrolled away from it. */
export function useFollowBottom() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isPinned = useRef(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (isPinned.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function updatePinned(event: React.UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    const bottom = scroller.scrollTop + scroller.clientHeight;
    const distance = scroller.scrollHeight - bottom;
    isPinned.current = distance <= PINNED_SLACK_PX;
  }

  return { scrollerRef, contentRef, updatePinned };
}
