import type { CSSProperties } from 'react';

import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

export type LetterTileSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<LetterTileSize, string> = {
  sm: 'size-4 rounded-[4px] text-[9px]',
  md: 'size-5 rounded-[5px] text-[10px]',
  lg: 'size-7 rounded-md text-xs',
};

type LetterTileProps = {
  initial: string;
  /** Without a series the tile stays neutral, for views where agents already own the series colours. */
  series?: SeriesSlot;
  size?: LetterTileSize;
  className?: string;
};

function materialOf(series: SeriesSlot | undefined) {
  if (series === undefined) {
    return 'keycap-3d text-foreground';
  }
  return 'gem-plate';
}

function plateStyleOf(series: SeriesSlot | undefined) {
  if (series === undefined) {
    return undefined;
  }
  const style = { '--gem': seriesColorOf(series) } as CSSProperties;
  return style;
}

/** A letter on a tile for what a letter names: a lettered choice, a product whose mark cannot be shown. A person, an agent or a company wears a picture instead. */
export function LetterTile({
  initial,
  series,
  size = 'md',
  className,
}: LetterTileProps) {
  return (
    <span
      aria-hidden='true'
      style={plateStyleOf(series)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center leading-none font-semibold select-none',
        materialOf(series),
        SIZE_CLASS[size],
        className
      )}
    >
      {initial}
    </span>
  );
}
