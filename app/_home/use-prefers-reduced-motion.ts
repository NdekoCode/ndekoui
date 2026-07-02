'use client';

import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToPreference(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function readPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function readOnServer() {
  return false;
}

/**
 * The reduced motion preference, read so the first client render matches the server. Use it when
 * the preference changes what is rendered, where motion's own hook would differ during hydration.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToPreference,
    readPreference,
    readOnServer
  );
}
