'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

const MERGE_METHODS = ['merge', 'squash', 'rebase'] as const;

type MergeMethod = (typeof MERGE_METHODS)[number];

const MERGE_OPTIONS: Record<
  MergeMethod,
  { label: string; description: string }
> = {
  merge: {
    label: 'Merge pull request',
    description:
      'All commits from this branch will be added to the base branch via a merge commit.',
  },
  squash: {
    label: 'Squash and merge',
    description:
      'The 6 commits from this branch will be combined into one commit in the base branch.',
  },
  rebase: {
    label: 'Rebase and merge',
    description:
      'The 6 commits from this branch will be rebased and added to the base branch.',
  },
};

const SEGMENT =
  'rounded-none first:rounded-s-full last:rounded-e-full focus-visible:z-10';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

export default function Button40() {
  const [method, setMethod] = useState<MergeMethod>('merge');
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const selectedLabel = MERGE_OPTIONS[method].label;

  function selectMethod(nextMethod: MergeMethod) {
    setMethod(nextMethod);
  }

  return (
    <div className='inline-flex -space-x-px'>
      <Button className={SEGMENT}>
        <AnimatedSize axis='width' as='span' contentClassName='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={method}
              className='flex'
              variants={labelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {selectedLabel}
            </motion.span>
          </AnimatePresence>
        </AnimatedSize>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size='icon'
              aria-label='Merge options'
              className={SEGMENT}
            />
          }
        >
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          sideOffset={4}
          className='max-w-64 md:max-w-xs'
        >
          <DropdownMenuRadioGroup value={method} onValueChange={selectMethod}>
            {MERGE_METHODS.map((value) => {
              const option = MERGE_OPTIONS[value];

              return (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  closeOnClick
                  className='h-auto items-start py-2'
                >
                  <span className='flex flex-col gap-1'>
                    <span className='font-medium'>{option.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {option.description}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
