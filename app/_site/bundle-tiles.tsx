import Link from 'next/link';

import { countLabel } from '@/lib/site';

import { ScaledFrame } from './scaled-frame';

export type BundleTile = {
  href: string;
  previewSrc: string;
  name: string;
  count: number;
  singular: string;
  plural: string;
};

const TILE =
  'flex flex-col gap-3 rounded-xl bg-card p-2 pb-3 hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-colors hover:bg-foreground/[0.015] focus-visible:ring-[3px] focus-visible:ring-ring/25';

function BundleTileView({ tile }: { tile: BundleTile }) {
  return (
    <li>
      <Link href={tile.href} className={TILE}>
        <ScaledFrame src={tile.previewSrc} title={`${tile.name} preview`} />
        <span className='flex items-baseline justify-between gap-2 px-1'>
          <span className='text-[13px] font-medium'>{tile.name}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {countLabel(tile.count, tile.singular, tile.plural)}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function BundleTileGrid({ tiles }: { tiles: BundleTile[] }) {
  return (
    <ul className='grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
      {tiles.map((tile) => (
        <BundleTileView key={tile.href} tile={tile} />
      ))}
    </ul>
  );
}
