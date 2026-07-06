'use client';

import { useEffect } from 'react';

/**
 * A demonstration that will not play, because of reduced motion or because a person took over, ends
 * on the state that shows best what it does. The state is applied from a timer, as the session hook
 * does, so the first render still matches the server.
 */
export function useRestingState<State>(
  isResting: boolean,
  restingState: State,
  apply: (state: State) => void
) {
  useEffect(() => {
    if (!isResting) {
      return;
    }
    const timer = setTimeout(() => apply(restingState), 0);
    return () => clearTimeout(timer);
  }, [isResting, restingState, apply]);
}
