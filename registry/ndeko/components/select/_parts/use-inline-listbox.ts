'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';

import {
  nextHighlightOf,
  optionIdOf,
  useDismissOutside,
  type ListOption,
} from './inline-listbox';

export type InlineListboxControl = {
  options: readonly ListOption[];
  value: string;
  onValueChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  highlighted?: string | null;
  onHighlightedChange?: (value: string | null) => void;
};

function idWhenOpen(isOpen: boolean, id: string | null) {
  if (isOpen && id !== null) {
    return id;
  }
  return undefined;
}

function activeOptionIdOf(listId: string, activeValue: string | null) {
  if (activeValue === null) {
    return null;
  }
  return optionIdOf(listId, activeValue);
}

/**
 * The state and the keyboard of a list drawn inline: the focus stays on the trigger, which names
 * the highlighted row with `aria-activedescendant`. Open and highlight can be driven from outside.
 */
export function useInlineListbox({
  options,
  value,
  onValueChange,
  open,
  onOpenChange,
  highlighted,
  onHighlightedChange,
}: InlineListboxControl) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [ownOpen, setOwnOpen] = useState(false);
  const [ownHighlighted, setOwnHighlighted] = useState<string | null>(null);
  const isOpen = open ?? ownOpen;
  const activeValue = highlighted ?? ownHighlighted;
  const activeOptionId = activeOptionIdOf(listId, activeValue);
  const controlsId = idWhenOpen(isOpen, listId);
  const activeId = idWhenOpen(isOpen, activeOptionId);

  function changeOpen(next: boolean) {
    setOwnOpen(next);
    onOpenChange?.(next);
  }

  function changeHighlight(next: string | null) {
    setOwnHighlighted(next);
    onHighlightedChange?.(next);
  }

  function close() {
    changeOpen(false);
    changeHighlight(null);
  }

  function openAround() {
    changeHighlight(value);
    changeOpen(true);
  }

  function pick(next: string) {
    onValueChange(next);
    close();
  }

  useDismissOutside(rootRef, isOpen, close);

  function handleKey(event: KeyboardEvent<HTMLElement>) {
    const isActivation = event.key === 'Enter' || event.key === ' ';
    const isArrow = event.key === 'ArrowDown' || event.key === 'ArrowUp';
    if (!isOpen) {
      const opensList = isActivation || isArrow;
      if (opensList) {
        event.preventDefault();
        openAround();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      close();
      return;
    }
    if (isActivation) {
      event.preventDefault();
      pick(activeValue ?? value);
      return;
    }
    const next = nextHighlightOf(options, activeValue ?? value, event.key);
    if (next === null) {
      return;
    }
    event.preventDefault();
    changeHighlight(next);
  }

  return {
    listId,
    rootRef,
    isOpen,
    activeValue,
    controlsId,
    activeId,
    openAround,
    close,
    pick,
    changeHighlight,
    handleKey,
  };
}
