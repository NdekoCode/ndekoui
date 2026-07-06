'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { PreviewStage } from '@/app/_site/preview-stage';
import { ThemeToggle } from '@/app/_site/theme-toggle';
import { InstallCommand } from '@/app/blocks/_shared/install-command';
import type { PreviewWidth } from '@/app/components/_catalog/preview-widths';
import { NdekoUILLogo } from '@/components/website/icons/ndekoui-logo';
import { ArrowLeftIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

const STAGE = [
  'bg-card hairline-ring ring-border min-h-0 flex-1 rounded-2xl p-4 sm:p-10',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
].join(' ');

const BAR = 'flex h-14 shrink-0 items-center gap-3 px-3 sm:px-6';

/** Long enough for a component to settle after it hydrates, short enough that a demo growing later keeps its top edge. */
const SETTLE_MS = 1500;

/** The same room as the catalogue tile gives the kind of component, a little wider for a page of its own. */
const CONTENT_WIDTH: Record<PreviewWidth, string> = {
  compact: 'max-w-sm',
  wide: 'max-w-2xl',
  full: 'max-w-5xl',
};

type ItemPresentationProps = {
  title: string;
  itemName: string;
  /** What the link back to the catalogue is called, such as the category of a component. */
  backLabel: string;
  backHref: string;
  width: PreviewWidth;
  children: ReactNode;
};

/**
 * One item alone on a page, centred in the window between the mark and the name of the library
 * above it and its install command below, so a recording of the tab carries the brand.
 */
export function ItemPresentation({
  title,
  itemName,
  backLabel,
  backHref,
  width,
  children,
}: ItemPresentationProps) {
  const maxWidthClass = CONTENT_WIDTH[width];
  const contentClassName = cn('flex w-full justify-center', maxWidthClass);

  return (
    <div className='bg-foreground/[0.025] flex h-dvh flex-col'>
      <header className={BAR}>
        <Link
          href='/'
          className='focus-visible:ring-ring/25 flex w-fit shrink-0 items-center gap-2.5 rounded-lg text-[15px] font-semibold outline-none focus-visible:ring-[3px]'
        >
          <NdekoUILLogo aria-hidden className='size-7' />
          ndekoui
        </Link>
        <span aria-hidden='true' className='text-muted-foreground/50'>
          /
        </span>
        <h1 className='min-w-0 truncate text-[13px] font-medium'>{title}</h1>
        <div className='ms-auto flex shrink-0 items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            nativeButton={false}
            className='text-muted-foreground'
            aria-label={`Back to ${backLabel}`}
            render={<Link href={backHref} />}
          >
            <ArrowLeftIcon />
            <span className='hidden sm:inline'>{backLabel}</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className='flex min-h-0 flex-1 px-3 sm:px-6'>
        <PreviewStage className={STAGE} recentresOnHeight settleMs={SETTLE_MS}>
          <div className={contentClassName}>{children}</div>
        </PreviewStage>
      </main>
      <footer className={BAR}>
        <p className='text-muted-foreground min-w-0 truncate font-mono text-[11px]'>
          {itemName}
        </p>
        <InstallCommand
          itemName={itemName}
          className='ms-auto hidden md:flex'
        />
      </footer>
    </div>
  );
}
