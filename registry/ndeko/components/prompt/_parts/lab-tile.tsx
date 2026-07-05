import { BrandTile, type BrandTileSize } from '@/registry/ndeko/ui/brand-tile';

import { labOf, type LabId } from './labs';

type LabTileProps = {
  lab: LabId;
  size?: BrandTileSize;
  className?: string;
};

export function LabTile({ lab, size = 'md', className }: LabTileProps) {
  const entry = labOf(lab);

  return <BrandTile brand={entry.brand} size={size} className={className} />;
}
