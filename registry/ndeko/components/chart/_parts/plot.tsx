import { cn } from '@/registry/ndeko/lib/utils';

import { CategoryAxis, GridLines, ValueAxis, type AxisLabel } from './axis';
import { VIEW_WIDTH } from './path';
import type { Scale } from './scale';

/**
 * A plot is a query container, so the readout and the marks inside it are placed in shares of its
 * width, and it lets the page scroll vertically under a finger while a sideways move reads values.
 */
export const PLOT_SURFACE =
  'focus-visible:ring-ring/25 @container relative touch-pan-y rounded-md outline-none focus-visible:ring-[3px]';

type PlotFrameProps = {
  /** The name of the plot and how to read it, for screen readers. */
  label: string;
  scale: Scale;
  height: number;
  formatTick: (value: number) => string;
  axisLabels: readonly AxisLabel[];
  axisAlign?: 'spread' | 'center';
  /** Receives the plot element, for a chart that measures the room it has. */
  plotRef?: (element: HTMLDivElement | null) => void;
  /** The handlers of the reading: the plot is the one tab stop of the chart. */
  plotProps?: React.HTMLAttributes<HTMLDivElement>;
  plotClassName?: string;
  /** For a chart whose marks carry their own figures, which can drop the axis on a narrow piece. */
  valueAxisClassName?: string;
  /** Labels laid out by the chart itself, in place of one row of `axisLabels`. */
  categoryAxis?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * A plot between its value axis on the left and its category axis underneath. Each part has its own
 * cell: placed in turn, a plot whose value axis is hidden would fall into the axis column, which is
 * only as wide as its content, and nothing in a plot has a width of its own, so every mark would
 * stack at the left edge.
 */
export function PlotFrame({
  label,
  scale,
  height,
  formatTick,
  axisLabels,
  axisAlign,
  plotRef,
  plotProps,
  plotClassName,
  valueAxisClassName,
  categoryAxis,
  className,
  children,
}: PlotFrameProps) {
  return (
    <div
      className={cn('grid grid-cols-[auto_minmax(0,1fr)] gap-x-2', className)}
    >
      <ValueAxis
        scale={scale}
        height={height}
        format={formatTick}
        className={cn('col-start-1 row-start-1', valueAxisClassName)}
      />
      <div
        ref={plotRef}
        role='group'
        tabIndex={0}
        aria-label={label}
        className={cn(PLOT_SURFACE, 'col-start-2 row-start-1', plotClassName)}
        style={{ height }}
        {...plotProps}
      >
        <GridLines scale={scale} height={height} />
        {children}
      </div>
      <div className='col-start-2 row-start-2 min-w-0'>
        {categoryAxis}
        {!categoryAxis && (
          <CategoryAxis
            labels={axisLabels}
            align={axisAlign}
            className='mt-2'
          />
        )}
      </div>
    </div>
  );
}

type PathLayerProps = {
  height: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * The layer the paths are drawn in: `VIEW_WIDTH` units across whatever the width of the plot, and
 * real pixels down. Strokes keep their thickness because each path opts out of the stretch.
 */
export function PathLayer({ height, className, children }: PathLayerProps) {
  return (
    <svg
      aria-hidden='true'
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      preserveAspectRatio='none'
      className={cn(
        'pointer-events-none absolute inset-0 size-full overflow-visible',
        className
      )}
    >
      {children}
    </svg>
  );
}
