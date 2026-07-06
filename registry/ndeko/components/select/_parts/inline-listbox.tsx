'use client';

import { useEffect, type RefObject } from 'react';

import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

export type ListOption = {
  value: string;
  label: string;
};

/** A row is `h-8` and the list is `p-1`: a list that opens around its trigger lines the rows up with these. */
export const OPTION_HEIGHT_PX = 32;

export const LISTBOX_PADDING_PX = 4;

const MARK =
  'absolute right-1.5 transition-[scale,opacity] duration-150 ease-(--ease-out-strong)';

function markStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'scale-100 opacity-100';
  }
  return 'scale-75 opacity-0 duration-100';
}

function highlightAttributeOf(isHighlighted: boolean) {
  if (isHighlighted) {
    return '';
  }
  return undefined;
}

export function optionIdOf(listId: string, value: string) {
  return `${listId}-${value}`;
}

export function indexOfOption(options: readonly ListOption[], value: string) {
  return options.findIndex((option) => option.value === value);
}

export function nextHighlightOf(
  options: readonly ListOption[],
  current: string | null,
  key: string
) {
  const lastIndex = options.length - 1;
  const currentIndex = options.findIndex((option) => option.value === current);
  if (key === 'ArrowDown') {
    return options[Math.min(lastIndex, currentIndex + 1)].value;
  }
  if (key === 'ArrowUp') {
    return options[Math.max(0, currentIndex - 1)].value;
  }
  if (key === 'Home') {
    return options[0].value;
  }
  if (key === 'End') {
    return options[lastIndex].value;
  }
  return null;
}

/** With the pointer captured by the trigger, the row under it has to be found by position. */
export function optionValueAt(
  listbox: HTMLElement | null,
  x: number,
  y: number
) {
  if (!listbox) {
    return null;
  }
  const hit = document.elementFromPoint(x, y);
  const option = hit?.closest<HTMLElement>('[data-option]');
  if (!option || !listbox.contains(option)) {
    return null;
  }
  return option.dataset.option ?? null;
}

export function useDismissOutside(
  rootRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function dismissOnOutsidePress(event: PointerEvent) {
      const root = rootRef.current;
      const target = event.target;
      if (!root || !(target instanceof Node)) {
        return;
      }
      if (root.contains(target)) {
        return;
      }
      onDismiss();
    }
    document.addEventListener('pointerdown', dismissOnOutsidePress);
    return () =>
      document.removeEventListener('pointerdown', dismissOnOutsidePress);
  }, [rootRef, isOpen, onDismiss]);
}

type InlineListboxProps = {
  id: string;
  label: string;
  options: readonly ListOption[];
  value: string;
  highlighted: string | null;
  onHighlight: (value: string) => void;
  onPick: (value: string) => void;
  listboxRef?: React.Ref<HTMLDivElement>;
  className?: string;
};

export function InlineListbox({
  id,
  label,
  options,
  value,
  highlighted,
  onHighlight,
  onPick,
  listboxRef,
  className,
}: InlineListboxProps) {
  return (
    <div
      ref={listboxRef}
      id={id}
      role='listbox'
      aria-label={label}
      className={cn('surface-raised rounded-xl p-1 outline-none', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isHighlighted = option.value === highlighted;

        return (
          <div
            key={option.value}
            id={optionIdOf(id, option.value)}
            role='option'
            aria-selected={isSelected}
            data-option={option.value}
            data-highlighted={highlightAttributeOf(isHighlighted)}
            onPointerMove={() => onHighlight(option.value)}
            onClick={() => onPick(option.value)}
            className={cn(MENU_ITEM, 'cursor-pointer pr-8')}
          >
            {option.label}
            <SelectedMark className={cn(MARK, markStateOf(isSelected))} />
          </div>
        );
      })}
    </div>
  );
}
