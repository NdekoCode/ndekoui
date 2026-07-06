'use client';

import { startOfDay } from 'date-fns';
import { useSyncExternalStore } from 'react';

let cachedToday: Date | null = null;

function subscribeNever() {
  return () => {};
}

function readToday() {
  if (cachedToday === null) {
    cachedToday = startOfDay(new Date());
  }
  return cachedToday;
}

function readNothing() {
  return null;
}

/** The server and the first client render know no day, so what depends on it appears once the page is live. */
export function useToday() {
  return useSyncExternalStore(subscribeNever, readToday, readNothing);
}
