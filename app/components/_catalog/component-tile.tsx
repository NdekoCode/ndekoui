import type { ReactNode } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { PreviewStage } from '@/app/_site/preview-stage';
import { TileHeader, type TitleTag } from '@/app/_site/tile-header';
import { fullPagePathOf } from './component-paths';
import {
  previewWidthOf,
  widthClassOf,
  type PreviewWidth,
} from './preview-widths';
import type { CatalogEntry } from './types';

type ComponentTileProps = {
  entry: CatalogEntry;
  preview: ReactNode;
  /** Replaces the catalogue's column span, for a tile placed in another grid. */
  placement?: string;
  /** `h3` when the tile sits under a section that has its own `h2`. */
  titleAs?: TitleTag;
};

const STAGE_CLASSES: Record<PreviewWidth, string> = {
  compact: 'px-4 py-10',
  wide: 'px-3 py-8 sm:p-8',
  full: 'px-3 py-6 sm:p-6',
};

export function ComponentTile({
  entry,
  preview,
  placement,
  titleAs = 'h2',
}: ComponentTileProps) {
  const width = previewWidthOf(entry);
  const placementClass = placement ?? widthClassOf(width);
  const fullPagePath = fullPagePathOf(entry.category, entry.name);

  return (
    <article
      id={entry.name}
      className={cn(
        'bg-foreground/[0.025] flex min-w-0 scroll-mt-20 flex-col rounded-2xl p-1.5',
        placementClass
      )}
    >
      <TileHeader
        title={entry.title}
        titleAs={titleAs}
        name={entry.name}
        description={entry.description}
        fullPageHref={fullPagePath}
      />
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
