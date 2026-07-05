'use client';

import { motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

const OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const INDICATOR_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.2, 0, 0, 1],
};

const INSTANT_TRANSITION: Transition = { duration: 0 };

const INDICATOR = [
  'absolute inset-0 -z-10 rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08)] hairline-ring ring-foreground/10',
  'dark:bg-foreground/[0.09] dark:ring-foreground/15',
].join(' ');

const ITEM =
  'relative h-7 flex-1 px-3 hover:bg-transparent data-pressed:bg-transparent';

function indicatorTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return INDICATOR_TRANSITION;
}

export default function Button35() {
  const indicatorId = useId();
  const [selection, setSelection] = useState(['left']);
  const shouldReduceMotion = usePrefersReducedMotion();
  const indicatorTransition = indicatorTransitionOf(shouldReduceMotion);

  function selectOption(nextSelection: string[]) {
    const hasSelection = nextSelection.length > 0;
    if (hasSelection) {
      setSelection(nextSelection);
    }
  }

  return (
    <ToggleGroup
      value={selection}
      onValueChange={selectOption}
      aria-label='Text alignment'
      className='bg-foreground/[0.05] isolate flex w-full rounded-lg p-0.5'
    >
      {OPTIONS.map((option) => {
        const isSelected = selection.includes(option.value);

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={ITEM}
          >
            {isSelected && (
              <motion.span
                layoutId={indicatorId}
                className={INDICATOR}
                transition={indicatorTransition}
              />
            )}
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
