import { meshIn, meshOf } from '@/registry/ndeko/lib/mesh';
import { cn } from '@/registry/ndeko/lib/utils';

export type MeshTileSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<MeshTileSize, string> = {
  sm: 'size-4 rounded-[4px]',
  md: 'size-5 rounded-[5px]',
  lg: 'size-7 rounded-md',
};

type MeshTileProps = {
  /** The name the picture is drawn from. The same name gives the same picture everywhere. */
  seed: string;
  /** A colour that already means something, such as the series colour of an agent. Without it the hue comes from the seed. */
  color?: string;
  size?: MeshTileSize;
  className?: string;
};

function styleOf(seed: string, color: string | undefined) {
  if (color === undefined) {
    return meshOf(seed);
  }
  return meshIn(color, seed);
}

/** The picture of an agent, a team or a project that has no logo. Its name always sits beside it. */
export function MeshTile({
  seed,
  color,
  size = 'md',
  className,
}: MeshTileProps) {
  return (
    <span
      aria-hidden='true'
      style={styleOf(seed, color)}
      className={cn(
        'mesh-fill hairline-ring inline-block shrink-0 ring-black/10 ring-inset',
        SIZE_CLASS[size],
        className
      )}
    />
  );
}
