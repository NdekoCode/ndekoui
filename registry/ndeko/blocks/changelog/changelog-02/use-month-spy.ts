'use client';

import { useEffect, useState, type RefObject } from 'react';

const BOTTOM_TOLERANCE_PX = 2;

function isAtBottom(frame: HTMLElement) {
  const reach = frame.scrollTop + frame.clientHeight;
  return reach >= frame.scrollHeight - BOTTOM_TOLERANCE_PX;
}

/**
 * The month under the top of the frame, followed as it scrolls. `monthsKey` changes when the
 * months on show do, so the sections are watched again.
 */
export function useMonthSpy(
  frameRef: RefObject<HTMLElement | null>,
  monthsKey: string
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const sections = Array.from(
      frame.querySelectorAll<HTMLElement>('[data-month]')
    );
    const inBand = new Set<string>();

    function settle() {
      const first = sections.find((section) => {
        const id = section.dataset.month ?? '';
        return inBand.has(id);
      });
      if (first?.dataset.month) {
        setActiveId(first.dataset.month);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-month') ?? '';
          if (entry.isIntersecting) {
            inBand.add(id);
          } else {
            inBand.delete(id);
          }
        }
        settle();
      },
      { root: frame, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));

    const markEnd = () => {
      const last = sections.at(-1);
      const monthId = last?.dataset.month;
      if (monthId && isAtBottom(frame)) {
        setActiveId(monthId);
      }
    };

    frame.addEventListener('scroll', markEnd, { passive: true });
    return () => {
      observer.disconnect();
      frame.removeEventListener('scroll', markEnd);
    };
  }, [frameRef, monthsKey]);

  return activeId;
}
