import type { ReactNode } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { CodeDialog } from '@/app/_site/code-dialog';
import { PreviewStage } from '@/app/_site/preview-stage';
import {
  previewWidthOf,
  widthClassOf,
  type PreviewWidth,
} from './preview-widths';
import type { CatalogEntry } from './types';

type ComponentTileProps = {
  entry: CatalogEntry;
  preview: ReactNode;
};

const STAGE_CLASSES: Record<PreviewWidth, string> = {
  compact: 'px-4 py-10',
  wide: 'px-3 py-8 sm:p-8',
  full: 'px-3 py-6 sm:p-6',
};

export function ComponentTile({ entry, preview }: ComponentTileProps) {
  const width = previewWidthOf(entry);

  return (
    <article
      id={entry.name}
      className={cn(
        'bg-foreground/[0.025] flex min-w-0 scroll-mt-20 flex-col rounded-2xl p-1.5',
        widthClassOf(width)
      )}
    >
      <header className='@container/tile-header flex items-center gap-3 py-1.5 ps-3 pe-0.5'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <h3 className='truncate text-[13px] font-medium'>{entry.title}</h3>
          <p className='text-muted-foreground truncate font-mono text-[11px]'>
            {entry.name}
          </p>
        </div>
        <CodeDialog
          title={entry.title}
          description={entry.description}
          itemName={entry.name}
        />
      </header>
      <PreviewStage
        className={cn(
          'bg-card hairline-ring ring-border min-h-48 flex-1 rounded-[calc(var(--radius-2xl)-0.375rem)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
          STAGE_CLASSES[width]
        )}
      >
        {preview}
      </PreviewStage>
    </article>
  );
}
