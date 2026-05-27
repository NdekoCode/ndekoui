import type { ComponentType } from 'react';

import { CodeDialog } from '@/app/_site/code-dialog';
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
  wide: 'px-4 py-8 sm:p-8',
  full: 'px-4 py-6 sm:p-8',
};

export function KitItem({ item, width, Demo }: KitItemProps) {
  return (
    <article
      className={cn(
        'bg-foreground/[0.025] flex min-w-0 flex-col rounded-2xl p-1.5',
        widthClassOf(width)
      )}
    >
      <header className='flex items-center gap-3 py-1.5 ps-3 pe-0.5'>
        <div className='flex min-w-0 flex-1 flex-col'>
          <h3 className='truncate text-[13px] font-medium'>{item.title}</h3>
          <p className='text-muted-foreground truncate font-mono text-[11px]'>
            {item.name}
          </p>
        </div>
        <CodeDialog
          title={item.title}
          description={item.description}
          itemName={item.name}
        />
      </header>
      <div
        className={cn(
          'bg-card hairline-ring ring-border flex min-h-48 flex-1 items-center justify-center rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
          STAGE_CLASSES[width]
        )}
      >
        <Demo />
      </div>
    </article>
  );
}
