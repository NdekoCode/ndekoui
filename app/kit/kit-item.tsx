import type { ComponentType } from 'react';

import { PreviewStage } from '@/app/_site/preview-stage';
import { TileHeader } from '@/app/_site/tile-header';
import {
  widthClassOf,
  type PreviewWidth,
} from '@/app/components/_catalog/preview-widths';
import type { RegistryItemDefinition } from '@/registry/items';
import { cn } from '@/registry/ndeko/lib/utils';

type KitItemProps = {
  item: RegistryItemDefinition;
  width: PreviewWidth;
  Demo: ComponentType;
};

const STAGE_CLASSES: Record<PreviewWidth, string> = {
  compact: 'px-4 py-10',
  wide: 'px-3 py-8 sm:p-8',
  full: 'px-3 py-6 sm:p-8',
};

export function KitItem({ item, width, Demo }: KitItemProps) {
  return (
    <article
      id={item.name}
      className={cn(
        'bg-foreground/[0.025] flex min-w-0 scroll-mt-20 flex-col rounded-2xl p-1.5',
        widthClassOf(width)
      )}
    >
      <TileHeader
        title={item.title}
        titleAs='h3'
        name={item.name}
        description={item.description}
      />
      <PreviewStage
        className={cn(
          'bg-card hairline-ring ring-border min-h-48 flex-1 rounded-[calc(var(--radius-2xl)-0.375rem)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
          STAGE_CLASSES[width]
        )}
      >
        <Demo />
      </PreviewStage>
    </article>
  );
}
