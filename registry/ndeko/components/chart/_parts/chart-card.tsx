import { useId } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';

type ChartCardProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One line that says what the chart shows, read by screen readers with the title. */
  summary: string;
  /** Controls that change what the chart draws: a period, a view. */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * The surface every chart sits on. It is a query container, so a chart lays itself out by the
 * room it has, and it is positioned, so the hidden table of a chart never widens the page.
 */
export function ChartCard({
  title,
  note,
  summary,
  actions,
  className,
  children,
}: ChartCardProps) {
  const titleId = useId();
  const summaryId = useId();

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      className={cn(
        'bg-card hairline-ring ring-border @container relative flex flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <h3 id={titleId} className='text-sm font-medium text-balance'>
            {title}
          </h3>
          {note && <Badge variant='secondary'>{note}</Badge>}
        </div>
        {actions}
      </header>
      {children}
      <p id={summaryId} className='sr-only'>
        {summary}
      </p>
    </section>
  );
}
