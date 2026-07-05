'use client';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

const TRAVEL = '-rotate-90 transition-[translate] ease-(--ease-out-strong)';

const LEAVING_ARROW =
  'duration-200 group-hover/button:-translate-y-full group-hover/button:duration-150';

const ARRIVING_ARROW =
  'absolute inset-0 translate-y-full duration-150 group-hover/button:translate-y-0 group-hover/button:duration-200';

function scrollBehaviorOf(shouldReduceMotion: boolean | null): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

export function BackToTop() {
  const shouldReduceMotion = usePrefersReducedMotion();

  function scrollToTop() {
    const behavior = scrollBehaviorOf(shouldReduceMotion);
    window.scrollTo({ top: 0, behavior });
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      className='text-muted-foreground'
      onClick={scrollToTop}
    >
      Back to top
      <span
        aria-hidden='true'
        className='relative flex size-3.5 overflow-hidden'
      >
        <ArrowRightIcon className={cn(TRAVEL, LEAVING_ARROW, 'size-3.5')} />
        <ArrowRightIcon className={cn(TRAVEL, ARRIVING_ARROW, 'size-3.5')} />
      </span>
    </Button>
  );
}
