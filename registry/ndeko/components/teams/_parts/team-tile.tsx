import { cn } from '@/registry/ndeko/lib/utils';

const SIZE_CLASS = {
  sm: 'size-5 rounded-[5px] text-[9px]',
  md: 'size-6 rounded-md text-[10px]',
  lg: 'size-9 rounded-lg text-xs',
} as const;

type TeamTileProps = {
  initials: string;
  color: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

/** A team without a logo: its initials in white on a gem plate of its colour. */
export function TeamTile({
  initials,
  color,
  size = 'md',
  className,
}: TeamTileProps) {
  const gemStyle = { '--gem': color } as React.CSSProperties;

  return (
    <span
      aria-hidden='true'
      style={gemStyle}
      className={cn(
        'gem-plate inline-flex shrink-0 items-center justify-center font-semibold',
        SIZE_CLASS[size],
        className
      )}
    >
      {initials}
    </span>
  );
}
