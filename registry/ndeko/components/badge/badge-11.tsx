'use client';

import { Checkbox } from '@base-ui/react/checkbox';

import { CheckIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { badgeVariants } from '@/registry/ndeko/ui/badge';

const MARK = [
  'flex transition-[scale,opacity] duration-150 ease-(--ease-out-strong)',
  'data-starting-style:scale-60 data-starting-style:opacity-0',
  'data-ending-style:scale-60 data-ending-style:opacity-0 data-ending-style:duration-100',
].join(' ');

export default function Badge11() {
  return (
    <Checkbox.Root
      defaultChecked
      className={cn(
        badgeVariants(),
        'data-unchecked:bg-foreground/[0.06] data-unchecked:text-muted-foreground cursor-pointer transition-colors select-none',
        FOCUS_RING
      )}
    >
      <AnimatedSize
        axis='width'
        as='span'
        contentClassName='flex items-center gap-1'
      >
        <Checkbox.Indicator className={MARK}>
          <CheckIcon strokeWidth={2.5} />
        </Checkbox.Indicator>
        Remote
      </AnimatedSize>
    </Checkbox.Root>
  );
}
