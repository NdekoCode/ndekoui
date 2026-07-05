import {
  LetterTile,
  type LetterTileSize,
} from '@/registry/ndeko/ui/letter-tile';

import { labOf, type LabId } from './labs';

type LabTileProps = {
  lab: LabId;
  size?: LetterTileSize;
  className?: string;
};

export function LabTile({ lab, size = 'md', className }: LabTileProps) {
  const entry = labOf(lab);

  return (
    <LetterTile
      initial={entry.initial}
      series={entry.series}
      size={size}
      className={className}
    />
  );
}
