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
 * The reduced motion preference, read so the first client render matches the server and so a change
 * of the setting is followed. Use it wherever the preference changes what is rendered: a hook that
 * reads the setting during the first render makes the page fail to hydrate for the people who set it.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToPreference,
    readPreference,
    readOnServer
  );
}
