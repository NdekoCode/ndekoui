'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { ArrowLeftIcon, ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

import { PAGE_ORDER, pageOf, type PageId } from './pages';

const CARD =
  'bg-card hairline-ring ring-border dark:bg-foreground/[0.03] rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function neighbourOf(pageId: PageId, offset: number) {
  const index = PAGE_ORDER.indexOf(pageId);
  return PAGE_ORDER[index + offset];
}

type PageFooterProps = {
  pageId: PageId;
  pressed: string | null;
  onOpen: (pageId: PageId) => void;
};

export function PageFooter({ pageId, pressed, onOpen }: PageFooterProps) {
  const previousId = neighbourOf(pageId, -1);
  const nextId = neighbourOf(pageId, 1);
  const hasPrevious = previousId !== undefined;
  const hasNext = nextId !== undefined;

  return (
    <nav
      aria-label='Previous and next pages'
      className='grid gap-3 @lg:grid-cols-2'
    >
      {hasPrevious && (
        <a
          href={`#${previousId}`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(previousId);
          }}
          className={cn(
            CARD,
            'group hover:bg-foreground/[0.02] flex flex-col gap-1 p-4 transition-colors duration-100',
            FOCUS_RING,
            pressedQuietOf(pressed === 'previous-page')
          )}
        >
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            <ArrowLeftIcon className='size-3.5 transition-transform duration-100 group-hover:-translate-x-0.5' />
            Previous
          </span>
          <span className='text-sm font-medium'>
            {pageOf(previousId).title}
          </span>
        </a>
      )}
      {hasNext && (
        <a
          href={`#${nextId}`}
          onClick={(event) => {
            event.preventDefault();
            onOpen(nextId);
          }}
          className={cn(
            CARD,
            'group hover:bg-foreground/[0.02] flex flex-col gap-1 p-4 transition-colors duration-100 @lg:col-start-2 @lg:items-end @lg:text-end',
            FOCUS_RING,
            pressedQuietOf(pressed === 'next-page')
          )}
        >
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            Next
            <ArrowRightIcon className='size-3.5 transition-transform duration-100 group-hover:translate-x-0.5' />
          </span>
          <span className='text-sm font-medium'>{pageOf(nextId).title}</span>
        </a>
      )}
    </nav>
  );
}
