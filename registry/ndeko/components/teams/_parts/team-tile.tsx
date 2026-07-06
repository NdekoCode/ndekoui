import { cn } from '@/registry/ndeko/lib/utils';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

const SIZE_CLASS = {
  sm: 'size-5 rounded-[5px]',
  md: 'size-6 rounded-md',
  lg: 'size-9 rounded-lg',
} as const;

type TeamTileProps = {
  name: string;
  color: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

/** A team without a logo: a picture drawn from its name, in its colour. */
export function TeamTile({
  name,
  color,
  size = 'md',
  className,
}: TeamTileProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <MeshTile seed={name} color={color} className={cn(sizeClass, className)} />
  );
}
