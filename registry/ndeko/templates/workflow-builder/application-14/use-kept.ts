'use client';

import { useState } from 'react';

/**
 * The value as it was when its key last changed. What reads it draws again only when the key does:
 * the instructions of a step typed key by key leave the canvas as it was.
 */
export function useKept<Value>(value: Value, key: string): Value {
  const [kept, setKept] = useState({ key, value });
  const isStale = kept.key !== key;
  if (isStale) {
    setKept({ key, value });
    return value;
  }
  return kept.value;
}
