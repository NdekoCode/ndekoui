'use client';

import { useLayoutEffect } from 'react';

function fitHeight(textarea: HTMLTextAreaElement, maxHeight: number) {
  textarea.style.height = 'auto';
  const height = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${height}px`;
}

/** Also fits again when the width changes, and when `remountKey` changes for a textarea shown again. */
export function useAutosize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight: number,
  remountKey?: unknown
) {
  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }
    fitHeight(textarea, maxHeight);
    let lastWidth = textarea.offsetWidth;
    const observer = new ResizeObserver(() => {
      const width = textarea.offsetWidth;
      if (width === lastWidth) {
        return;
      }
      lastWidth = width;
      fitHeight(textarea, maxHeight);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [ref, value, maxHeight, remountKey]);
}

export function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isEnter = event.key === 'Enter';
  const isNewLine = event.shiftKey;
  const isComposing = event.nativeEvent.isComposing;
  const isPlainEnter = isEnter && !isNewLine;
  return isPlainEnter && !isComposing;
}

/** Puts the caret after the last character once React has committed the new text. */
export function caretToEnd(ref: React.RefObject<HTMLTextAreaElement | null>) {
  requestAnimationFrame(() => {
    const textarea = ref.current;
    if (!textarea) {
      return;
    }
    const end = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(end, end);
  });
}

/** Keydown that started inside this element, not in a menu or popover portalled out of it. */
export function isOwnKey(event: React.KeyboardEvent<HTMLElement>) {
  const target = event.target;
  if (!(target instanceof Node)) {
    return false;
  }
  return event.currentTarget.contains(target);
}
