const FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const isField = target.matches(FIELD_SELECTOR);
  return isField || target.isContentEditable;
}

export function hasModifierKey(event: React.KeyboardEvent) {
  const hasCommand = event.metaKey || event.ctrlKey;
  return hasCommand || event.altKey;
}

/** Keydown that started inside this element, not in a menu or popover portalled out of it. */
export function isOwnKey(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return false;
  }
  return event.currentTarget.contains(target);
}

/**
 * Single-letter shortcuts act only while focus is inside the piece, never while a field takes the
 * typing and never with a modifier held, so they cannot steal a browser or system shortcut.
 */
export function isShortcutKey(event: React.KeyboardEvent<HTMLElement>) {
  const isTyping = isTypingTarget(event.target);
  const hasModifier = hasModifierKey(event);
  const isOwn = isOwnKey(event);
  const isBlocked = isTyping || hasModifier;
  return isOwn && !isBlocked;
}
