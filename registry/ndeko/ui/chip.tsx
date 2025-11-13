import { cn } from '@/registry/ndeko/lib/utils';

type ChipProps = React.ComponentProps<'span'> & {
  /** Any CSS colour: a token such as `var(--success)` or a colour coming from your data. */
  color?: string;
};

const DEFAULT_CHIP_COLOR = 'var(--primary)';

function Chip({
  className,
  color = DEFAULT_CHIP_COLOR,
  style,
  ...props
}: ChipProps) {
  const chipStyle = { '--chip': color, ...style } as React.CSSProperties;

  return (
    <span
      data-slot='chip'
      style={chipStyle}
      className={cn(
        "chip-3d inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  );
}

export { Chip, type ChipProps };
