import { useSyncExternalStore } from 'react';

import { SEARCH_TABS, type SearchTab } from './search-kinds';

const APPLE_DEVICE = /mac|iphone|ipad|ipod/i;

const DIGIT_CODE = /^Digit([1-9])$/;

function subscribeToNothing() {
  return () => {};
}

function clientShortcutLabel() {
  const isAppleDevice = APPLE_DEVICE.test(navigator.userAgent);
  if (isAppleDevice) {
    return '⌘K';
  }
  return 'Ctrl K';
}

function serverShortcutLabel() {
  return null;
}

/** Null on the server and during hydration, so both renders match before the platform is known. */
export function useShortcutLabel() {
  return useSyncExternalStore<string | null>(
    subscribeToNothing,
    clientShortcutLabel,
    serverShortcutLabel
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const isField = target.matches('input, textarea, select');
  return isField || target.isContentEditable;
}

export function isToggleShortcut(event: KeyboardEvent) {
  const isKKey = event.key.toLowerCase() === 'k';
  const hasCommand = event.metaKey || event.ctrlKey;
  const hasOtherModifier = event.altKey || event.shiftKey;
  const isPlainCommand = hasCommand && !hasOtherModifier;
  return isKKey && isPlainCommand;
}

export function isSlashShortcut(event: KeyboardEvent) {
  const isSlash = event.key === '/';
  const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
  const isTyping = isTypingTarget(event.target);
  const isFree = !hasModifier && !isTyping;
  return isSlash && isFree;
}

function stepOf(event: React.KeyboardEvent) {
  if (event.shiftKey) {
    return -1;
  }
  return 1;
}

function isTabSwitch(event: React.KeyboardEvent) {
  const isTabKey = event.key === 'Tab';
  const hasModifier = event.altKey || event.ctrlKey || event.metaKey;
  return isTabKey && !hasModifier;
}

function steppedTabOf(current: SearchTab, step: number) {
  const count = SEARCH_TABS.length;
  const index = SEARCH_TABS.indexOf(current);
  const shifted = index + step + count;
  const nextIndex = shifted % count;
  return SEARCH_TABS[nextIndex];
}

function numberedTabOf(event: React.KeyboardEvent) {
  const hasOtherModifier = event.metaKey || event.altKey;
  const isControlOnly = event.ctrlKey && !hasOtherModifier;
  if (!isControlOnly) {
    return null;
  }
  const match = DIGIT_CODE.exec(event.code);
  if (!match) {
    return null;
  }
  const digit = Number(match[1]);
  const position = digit - 1;
  return SEARCH_TABS[position] ?? null;
}

export function tabFromKey(event: React.KeyboardEvent, current: SearchTab) {
  if (isTabSwitch(event)) {
    const step = stepOf(event);
    return steppedTabOf(current, step);
  }
  return numberedTabOf(event);
}
