import { useSyncExternalStore } from 'react';

import { ENTRIES } from './data';

const ANCHOR_PREFIX = 'changelog-';

export function anchorOf(entryId: string) {
  return `${ANCHOR_PREFIX}${entryId}`;
}

export function entryIdOfHash(hash: string) {
  const anchor = hash.replace('#', '');
  const found = ENTRIES.find((entry) => anchorOf(entry.id) === anchor);
  return found?.id ?? null;
}

export function linkOf(entryId: string) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${anchorOf(entryId)}`;
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function currentHash() {
  return window.location.hash;
}

function serverHash() {
  return '';
}

export function useLinkedEntry() {
  const hash = useSyncExternalStore(subscribe, currentHash, serverHash);
  return entryIdOfHash(hash);
}
