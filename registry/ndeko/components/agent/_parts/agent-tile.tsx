import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

const SIZE_CLASS = {
  sm: 'size-5 rounded-[5px]',
  md: 'size-6 rounded-md',
  lg: 'size-8 rounded-lg',
} as const;

export type AgentTileSize = keyof typeof SIZE_CLASS;

type AgentTileProps = {
  name: string;
  series: SeriesSlot;
  size?: AgentTileSize;
  className?: string;
};

/** The picture of an agent: a gradient drawn from its name, in its series colour. Its name always sits beside it. */
export function AgentTile({
  name,
  series,
  size = 'md',
  className,
}: AgentTileProps) {
  const color = seriesColorOf(series);
  const sizeClass = SIZE_CLASS[size];

  return (
    <MeshTile seed={name} color={color} className={cn(sizeClass, className)} />
  );
}
