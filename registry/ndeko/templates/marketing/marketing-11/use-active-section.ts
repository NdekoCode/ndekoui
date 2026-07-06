'use client';

import { useEffect, useState } from 'react';

/**
 * The section that holds the middle of the window: the last one whose top has passed it. It is
 * measured from the scroll position, not from an observer, so it answers the same way inside a
 * frame as on a page.
 */
export function useActiveSection(ids: readonly string[]) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    let frame = 0;

    function measure() {
      frame = 0;
      const middle = window.innerHeight / 2;
      let found = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        const top = element?.getBoundingClientRect().top;
        const hasPassed = top !== undefined && top <= middle;
        if (hasPassed) {
          found = id;
        }
      }
      setActiveId(found);
    }

    function schedule() {
      if (frame === 0) {
        frame = requestAnimationFrame(measure);
      }
    }

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids]);

  return activeId;
}
