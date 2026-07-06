'use client';

import { useId } from 'react';

const UNSAFE_CHARACTERS = /[^a-zA-Z0-9_-]/g;

/**
 * An id for a clip path or a gradient, unique to one instance of a chart so two of them on a page
 * never share one. The characters React puts in its ids are dropped: they are not safe inside the
 * `url(#...)` that points at the id.
 */
export function useSvgId(name: string) {
  const id = useId();
  const safeId = id.replace(UNSAFE_CHARACTERS, '');
  return `${name}-${safeId}`;
}
