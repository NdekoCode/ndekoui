import { cn } from '@/registry/ndeko/lib/utils';

import type { TileCopy } from './data';

type TileProps = {
  copy: TileCopy;
  stageClassName?: string;
  children: React.ReactNode;
};

/** The stage radius is the tile radius minus the padding between them, so the curves run parallel. */
export function Tile({ copy, stageClassName, children }: TileProps) {
  return (
    <article className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex min-w-0 flex-1 flex-col gap-4 rounded-2xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div
        className={cn(
          'bg-foreground/[0.04] relative isolate flex min-h-52 flex-1 flex-col justify-center rounded-[calc(var(--radius-2xl)-0.5rem)] p-4',
          stageClassName
        )}
      >
        {children}
      </div>
      <div className='flex flex-col gap-1 px-2 pb-2'>
        <h3 className='text-sm font-medium'>{copy.title}</h3>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {copy.text}
        </p>
      </div>
    </article>
  );
}
