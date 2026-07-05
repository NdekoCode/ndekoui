import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';

const SIZE_CLASS = {
  sm: 'size-5 rounded-[5px] text-[9px]',
  md: 'size-6 rounded-md text-[10px]',
  lg: 'size-8 rounded-lg text-xs',
} as const;

export type AgentTileSize = keyof typeof SIZE_CLASS;

/** "Planner" gives P, "Price reader" gives PR, "Researcher 2" gives R2. */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/);
  const [first = '', second] = words;
  const firstLetter = first.charAt(0).toUpperCase();
  if (!second) {
    return firstLetter;
  }
  const secondLetter = second.charAt(0).toUpperCase();
  return `${firstLetter}${secondLetter}`;
}

type AgentTileProps = {
  name: string;
  series: SeriesSlot;
  size?: AgentTileSize;
  className?: string;
};

/** The name always sits beside the tile, so screen readers skip the initials. */
export function AgentTile({
  name,
  series,
  size = 'md',
  className,
}: AgentTileProps) {
  const gemStyle = { '--gem': seriesColorOf(series) } as React.CSSProperties;
  const initials = initialsOf(name);

  return (
    <span
      aria-hidden='true'
      style={gemStyle}
      className={cn(
        'gem-plate inline-flex shrink-0 items-center justify-center font-semibold select-none',
        SIZE_CLASS[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
