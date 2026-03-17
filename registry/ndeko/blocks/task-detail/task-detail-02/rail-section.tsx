'use client';

import { useId, useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

type RailSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function RailSection({ title, children }: RailSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();

  return (
    <section className='hairline-b border-border py-3 @5xl:px-5'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => !current)}
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex h-7 w-full cursor-pointer items-center justify-between rounded-md text-xs font-medium outline-none focus-visible:ring-[3px]'
      >
        {title}
        <ChevronDownIcon
          className={cn(
            'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
            !isOpen && '-rotate-90'
          )}
        />
      </button>
      <AnimatedSize>
        <div id={contentId}>
          {isOpen && <div className='pt-1 pb-1'>{children}</div>}
        </div>
      </AnimatedSize>
    </section>
  );
}
