import { cn } from '@/registry/ndeko/lib/utils';

const GLIDE = 'transition-transform duration-200 ease-(--ease-out-strong)';

/** A mark on the crosshair travels with the reading, and appears in place when the reading opens. */
const MARK_GLIDE =
  'group-data-gliding/readout:transition-transform group-data-gliding/readout:duration-200 group-data-gliding/readout:ease-(--ease-out-strong)';

function glideOf(isGliding: boolean) {
  if (isGliding) {
    return GLIDE;
  }
  return undefined;
}

function fadedUnless(isVisible: boolean) {
  if (isVisible) {
    return undefined;
  }
  return 'opacity-0';
}

function glidingAttributeOf(isGliding: boolean) {
  if (isGliding) {
    return true;
  }
  return undefined;
}

type ReadoutProps = {
  /** From 0 at the left edge of the plot to 1 at its right edge. */
  ratio: number;
  /** Pixels from the top of the plot down to the point the bubble sits on. */
  top: number;
  isVisible: boolean;
  /** True while the reading moves to another position: the bubble travels. False when it opens. */
  isGliding: boolean;
  hasCrosshair?: boolean;
  /** What is drawn on the crosshair itself, such as the dot of each series. */
  marks?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * The one readout of a plot: a crosshair, the marks on it and a bubble. The plot is a query
 * container (`@container`), so every position is a share of its width and nothing is measured. The
 * bubble slides from its left edge to its right edge as it crosses the plot, so it never leaves it.
 * It stays mounted to fade out where it was.
 */
export function Readout({
  ratio,
  top,
  isVisible,
  isGliding,
  hasCrosshair = true,
  marks,
  children,
}: ReadoutProps) {
  const glide = glideOf(isGliding);
  const faded = fadedUnless(isVisible);
  const share = ratio * 100;
  const column = { transform: `translateX(${share}cqw)` };
  const row = { transform: `translateY(${top}px)` };
  const slide = { transform: `translateX(-${share}%)` };

  return (
    <div
      aria-hidden='true'
      data-gliding={glidingAttributeOf(isGliding)}
      className='group/readout pointer-events-none absolute inset-0 z-10'
    >
      <div
        className={cn('absolute inset-y-0 left-0 w-0', glide)}
        style={column}
      >
        {hasCrosshair && (
          <span
            className={cn(
              'bg-foreground/15 absolute inset-y-0 left-0 w-px -translate-x-1/2 transition-opacity duration-150',
              faded
            )}
          />
        )}
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-0 transition-opacity duration-150',
            faded
          )}
        >
          {marks}
        </div>
        <div className={cn('absolute top-0 left-0 size-0', glide)} style={row}>
          <div
            className={cn('absolute bottom-2.5 left-0 w-max', glide)}
            style={slide}
          >
            <div
              className={cn(
                'surface-raised flex max-w-[min(14rem,100cqw)] origin-bottom flex-col gap-1 rounded-lg px-2.5 py-1.5 text-xs',
                'transition-[opacity,scale] duration-[125ms] ease-(--ease-out-strong)',
                !isVisible && 'scale-[0.97] opacity-0'
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReadoutTitle({ children }: { children: React.ReactNode }) {
  return <span className='text-muted-foreground'>{children}</span>;
}

type ReadoutRowProps = {
  value: string;
  name: string;
  /** The colour of the series, drawn as a short stroke. Text never wears it. */
  color?: string;
};

export function ReadoutRow({ value, name, color }: ReadoutRowProps) {
  return (
    <span className='flex items-center gap-2'>
      {color && (
        <span
          className='h-0.5 w-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: color }}
        />
      )}
      <span className='text-[13px] font-medium tabular-nums'>{value}</span>
      <span className='text-muted-foreground min-w-0 truncate'>{name}</span>
    </span>
  );
}

type ReadoutDotProps = {
  /** Pixels from the top of the plot. */
  top: number;
  color: string;
};

/** The mark of one series where the crosshair meets it, ringed in the colour of the surface. */
export function ReadoutDot({ top, color }: ReadoutDotProps) {
  const style = {
    backgroundColor: color,
    transform: `translate(-50%, ${top}px)`,
  };

  return (
    <span
      className={cn(
        'ring-card absolute -top-1 left-0 size-2 rounded-full ring-2',
        MARK_GLIDE
      )}
      style={style}
    />
  );
}
