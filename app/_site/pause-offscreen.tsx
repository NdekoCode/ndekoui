'use client';

import { useRef } from 'react';

import { offscreenAttributeOf, useOffscreenPause } from './use-offscreen-pause';

type PauseOffscreenProps = React.HTMLAttributes<HTMLDivElement>;

/** A region of a page whose looping animations hold still while it is off screen. */
export function PauseOffscreen({ children, ...props }: PauseOffscreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useOffscreenPause(ref);

  return (
    <div ref={ref} data-offscreen={offscreenAttributeOf(isInView)} {...props}>
      {children}
    </div>
  );
}
