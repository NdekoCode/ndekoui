'use client';

import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type PanelProps = {
  /** Names the panel for the page: the demonstration scrolls to it. */
  panel: string;
  title: string;
  meta?: React.ReactNode;
  /** The grain wash of the surface, when it is the one that says what is live: it has to come first. */
  wash?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** One surface of the page. Its place in the grid comes from `className`, so the layout stays in one file. */
export function Panel({
  panel,
  title,
  meta,
  wash,
  className,
  children,
}: PanelProps) {
  const titleId = useId();

  return (
    <section
      data-panel={panel}
      aria-labelledby={titleId}
      className={cn(
        'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative isolate flex min-w-0 flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      {wash}
      <header className='flex min-h-6 items-center gap-2'>
        <h2
          id={titleId}
          className='min-w-0 flex-1 truncate text-sm font-medium'
        >
          {title}
        </h2>
        {meta}
      </header>
      {children}
    </section>
  );
}
