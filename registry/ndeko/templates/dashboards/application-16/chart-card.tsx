'use client';

import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] @container/card flex h-full scroll-mt-4 flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

type ChartCardProps = {
  title: string;
  description?: React.ReactNode;
  section?: string;
  className?: string;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  description,
  section,
  className,
  children,
}: ChartCardProps) {
  const titleId = useId();

  return (
    <section
      data-section={section}
      aria-labelledby={titleId}
      className={cn(CARD, className)}
    >
      <header className='flex flex-col leading-tight'>
        <h2 id={titleId} className='text-sm font-medium'>
          {title}
        </h2>
        {description}
      </header>
      {children}
    </section>
  );
}
