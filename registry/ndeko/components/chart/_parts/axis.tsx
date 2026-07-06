import { cn } from '@/registry/ndeko/lib/utils';

import { yOf } from './path';
import { columnCenterOf, percentOf, type Scale } from './scale';

/** The least room one label of the category axis needs, text and breathing space. */
export const LABEL_ROOM_PX = 56;

type ValueAxisProps = {
  scale: Scale;
  height: number;
  format: (value: number) => string;
  className?: string;
};

/** The figures of the value axis, one per gridline, in a column beside the plot. */
export function ValueAxis({
  scale,
  height,
  format,
  className,
}: ValueAxisProps) {
  return (
    <div
      aria-hidden='true'
      className={cn('relative w-9 shrink-0', className)}
      style={{ height }}
    >
      {scale.ticks.map((tick) => (
        <span
          key={tick}
          className='text-muted-foreground absolute right-0 -translate-y-1/2 text-[11px] tabular-nums'
          style={{ top: yOf(tick, scale, height) }}
        >
          {format(tick)}
        </span>
      ))}
    </div>
  );
}

/** Zero is drawn stronger when values go below it, since bars start there. */
export function gridToneOf(tick: number, scale: Scale) {
  const isZero = tick === 0;
  const crossesZero = scale.min < 0;
  if (isZero && crossesZero) {
    return 'border-foreground/25';
  }
  return 'border-border';
}

type GridLinesProps = {
  scale: Scale;
  height: number;
};

export function GridLines({ scale, height }: GridLinesProps) {
  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0'>
      {scale.ticks.map((tick) => (
        <span
          key={tick}
          className={cn(
            'hairline-t absolute inset-x-0',
            gridToneOf(tick, scale)
          )}
          style={{ top: yOf(tick, scale, height) }}
        />
      ))}
    </div>
  );
}

export type AxisLabel = {
  id: string;
  text: string;
  /** From 0 at the left edge of the plot to 1 at its right edge. */
  ratio: number;
  isStrong?: boolean;
};

/** Every how many positions a label is written, so the labels that are written never touch. */
export function labelStepOf(count: number, plotWidth: number) {
  const fitting = Math.floor(plotWidth / LABEL_ROOM_PX);
  const labelCount = Math.max(fitting, 1);
  const step = Math.ceil(count / labelCount);
  return Math.max(step, 1);
}

/** The labels kept when one in `step` is written, counted back from the last so the latest is always named. */
export function spacedLabelsOf(labels: readonly AxisLabel[], step: number) {
  const lastIndex = labels.length - 1;
  return labels.filter((_, index) => {
    const fromLast = lastIndex - index;
    return fromLast % step === 0;
  });
}

/**
 * One label per position, under the middle of its column, written as often as the room allows. The
 * one at `strongIndex`, such as today, is set stronger.
 */
export function positionLabelsOf(
  labels: readonly string[],
  plotWidth: number,
  strongIndex?: number
) {
  const all: AxisLabel[] = labels.map((text, index) => ({
    id: `${index}-${text}`,
    text,
    ratio: columnCenterOf(index, labels.length),
    isStrong: index === strongIndex,
  }));
  const step = labelStepOf(labels.length, plotWidth);
  return spacedLabelsOf(all, step);
}

function strongOf(isStrong: boolean | undefined) {
  if (isStrong) {
    return 'text-foreground font-medium';
  }
  return 'text-muted-foreground';
}

type LabelAlign = 'spread' | 'center';

/**
 * A spread label slides from its left edge to its right edge as it crosses the plot, like the
 * readout, so the first and the last never stick out of the piece. A centred label sits under its
 * mark, for the few wide columns of a bar chart.
 */
function labelStyleOf(
  label: AxisLabel,
  align: LabelAlign
): React.CSSProperties {
  const left = percentOf(label.ratio);
  if (align === 'center') {
    return { left, transform: 'translateX(-50%)' };
  }
  const shift = percentOf(-label.ratio);
  return { left, transform: `translateX(${shift})` };
}

type CategoryAxisProps = {
  labels: readonly AxisLabel[];
  align?: LabelAlign;
  className?: string;
};

export function CategoryAxis({
  labels,
  align = 'spread',
  className,
}: CategoryAxisProps) {
  return (
    <div aria-hidden='true' className={cn('relative h-4', className)}>
      {labels.map((label) => (
        <span
          key={label.id}
          className={cn(
            'absolute top-0 text-[11px] whitespace-nowrap tabular-nums',
            strongOf(label.isStrong)
          )}
          style={labelStyleOf(label, align)}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
}
