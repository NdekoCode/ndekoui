'use client';

import { AnimatePresence, motion, type MotionProps } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  pressedQuietOf,
  pressedSolidOf,
} from '@/registry/ndeko/lib/demonstration';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';

import {
  ASK_EXAMPLE,
  ASK_FAILED_LINE,
  filterLabelOf,
  type Filter,
  type FilterKind,
} from './ask';

const CHIP =
  'chip-3d inline-flex h-7 max-w-full items-center gap-0.5 rounded-md ps-2 pe-0.5 text-xs font-medium whitespace-nowrap [--chip:var(--primary)]';

const CHIP_REMOVE =
  'focus-visible:ring-ring/25 hover:bg-foreground/[0.08] flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-70 transition-[opacity,background-color,scale] duration-150 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]';

/** The chips of one question land one after the other. */
const LANDING_STAGGER = 0.06;

const LEAVE = { duration: 0.12, ease: EASE_OUT_STRONG };

type ChipPresence = Pick<MotionProps, 'initial' | 'animate' | 'exit'>;

const CHIP_FADE: ChipPresence = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: LEAVE },
};

/** A chip settles from a slightly larger size. Reduced motion keeps the fade only. */
function chipPresenceOf(
  shouldReduceMotion: boolean,
  order: number
): ChipPresence {
  if (shouldReduceMotion) {
    return CHIP_FADE;
  }
  const delay = order * LANDING_STAGGER;
  const land = { duration: 0.3, ease: EASE_OUT_STRONG, delay };
  return {
    initial: { opacity: 0, scale: 1.04 },
    animate: { opacity: 1, scale: 1, transition: land },
    exit: { opacity: 0, scale: 0.96, transition: LEAVE },
  };
}

function describedByOf(hasAskFailed: boolean, hintId: string) {
  if (hasAskFailed) {
    return hintId;
  }
  return undefined;
}

type AskBarProps = {
  question: string;
  hasAskFailed: boolean;
  filters: Filter[];
  pressed: string | null;
  onType: (text: string) => void;
  onAsk: () => void;
  onRemove: (kind: FilterKind) => void;
  onClear: () => void;
};

export function AskBar({
  question,
  hasAskFailed,
  filters,
  pressed,
  onType,
  onAsk,
  onRemove,
  onClear,
}: AskBarProps) {
  const fieldId = useId();
  const hintId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = springOf(shouldReduceMotion);
  const kinds = filters.map((filter) => filter.kind);
  const placement = kinds.join(' ');
  const hasFilters = filters.length > 0;

  function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAsk();
  }

  return (
    <section aria-label='Ask the table' className='flex flex-col gap-2'>
      <form onSubmit={ask} className='flex flex-col gap-1.5'>
        <div className='flex items-center gap-2'>
          <label
            htmlFor={fieldId}
            className='text-muted-foreground shrink-0 text-[13px]'
          >
            Show me
          </label>
          <Input
            id={fieldId}
            data-ask-field
            autoComplete='off'
            placeholder={ASK_EXAMPLE}
            value={question}
            aria-invalid={hasAskFailed}
            aria-describedby={describedByOf(hasAskFailed, hintId)}
            onChange={(event) => onType(event.target.value)}
          />
          <Button
            type='submit'
            className={cn('shrink-0', pressedSolidOf(pressed === 'ask'))}
          >
            Ask
          </Button>
        </div>
        <Fold open={hasAskFailed}>
          <p id={hintId} className='text-destructive-ink text-xs'>
            {ASK_FAILED_LINE}
          </p>
        </Fold>
      </form>
      <div className='flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1.5'>
        {!hasFilters && (
          <p className='text-muted-foreground text-xs'>
            Name a plan, a region, seats over or under a number, or what renews
            this quarter
          </p>
        )}
        <ul
          aria-label='Filters'
          className='relative flex flex-wrap items-center gap-1.5'
        >
          <AnimatePresence mode='popLayout' initial={false}>
            {filters.map((filter, index) => {
              const label = filterLabelOf(filter);
              const isPressed = pressed === `chip-${filter.kind}`;
              return (
                <motion.li
                  key={filter.kind}
                  layout='position'
                  layoutDependency={placement}
                  {...chipPresenceOf(shouldReduceMotion, index)}
                  transition={{ layout: travel }}
                  className='max-w-full'
                >
                  <span className={CHIP}>
                    <span className='min-w-0 truncate'>{label}</span>
                    <button
                      type='button'
                      data-filter-remove={filter.kind}
                      aria-label={`Remove the filter ${label}`}
                      onClick={() => onRemove(filter.kind)}
                      className={cn(CHIP_REMOVE, pressedQuietOf(isPressed))}
                    >
                      <XIcon className='size-3.5' />
                    </button>
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {hasFilters && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onClear}
            className='text-muted-foreground'
          >
            Clear filters
          </Button>
        )}
      </div>
    </section>
  );
}
