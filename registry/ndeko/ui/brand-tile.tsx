import { BrandLogo, type BrandSlug } from '@/registry/ndeko/lib/brand-logos';
import { cn } from '@/registry/ndeko/lib/utils';

export type BrandTileSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const TILE_CLASS: Record<BrandTileSize, string> = {
  sm: 'size-4 rounded-[4px]',
  md: 'size-5 rounded-[5px]',
  lg: 'size-7 rounded-md',
  xl: 'size-8 rounded-lg',
  '2xl': 'size-10 rounded-[10px]',
};

const MARK_CLASS: Record<BrandTileSize, string> = {
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-4',
  xl: 'size-4',
  '2xl': 'size-5',
};

type BrandTileProps = {
  brand: BrandSlug;
  size?: BrandTileSize;
  /** The accessible name. Without it the tile is decorative, for a row that already names the product. */
  title?: string;
  className?: string;
};

/** The mark of a known product on a key cap tile, so marks of every shape sit in the same square. */
export function BrandTile({
  brand,
  size = 'md',
  title,
  className,
}: BrandTileProps) {
  return (
    <span
      className={cn(
        'keycap-3d inline-flex shrink-0 items-center justify-center',
        TILE_CLASS[size],
        className
      )}
    >
      <BrandLogo brand={brand} title={title} className={MARK_CLASS[size]} />
    </span>
  );
}
