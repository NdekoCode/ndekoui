import { useSyncExternalStore } from 'react';

import { QUESTIONS } from './data';

const ANCHOR_PREFIX = 'faq-';

export function anchorOf(questionId: string) {
  return `${ANCHOR_PREFIX}${questionId}`;
}

export function questionIdOfHash(hash: string) {
  const anchor = hash.replace('#', '');
  const found = QUESTIONS.find((question) => anchorOf(question.id) === anchor);
  return found?.id ?? null;
}

export function linkOf(questionId: string) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${anchorOf(questionId)}`;
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

export function useLinkedQuestion() {
  const hash = useSyncExternalStore(subscribe, currentHash, serverHash);
  return questionIdOfHash(hash);
}
