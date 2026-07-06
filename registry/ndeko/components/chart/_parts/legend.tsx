'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

export type LegendEntry = {
  id: string;
  label: string;
  /** The colour of the mark. The label keeps a text colour. */
  color: string;
  /** A series taken off the plot keeps its place and its colour, faded. */
  isOff?: boolean;
};

function keyOpacityOf(isOff: boolean | undefined) {
  if (isOff) {
    return 'opacity-30';
  }
  return undefined;
}

function labelToneOf(isOff: boolean | undefined) {
  if (isOff) {
    return 'text-muted-foreground';
  }
  return 'text-foreground';
}

function LegendKey({ entry }: { entry: LegendEntry }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'h-0.5 w-3 shrink-0 rounded-full transition-opacity duration-150',
        keyOpacityOf(entry.isOff)
      )}
      style={{ backgroundColor: entry.color }}
    />
  );
}

type LegendProps = {
  entries: readonly LegendEntry[];
  /** What the list names, for screen readers. */
  label: string;
  /** With it each entry is a button that takes its series off the plot and puts it back. */
  onToggle?: (id: string) => void;
  /** The entry a demonstration is pressing. */
  pressedId?: string | null;
  className?: string;
};

export function Legend({
  entries,
  label,
  onToggle,
  pressedId = null,
  className,
}: LegendProps) {
  return (
    <ul
      aria-label={label}
      className={cn('-mx-1.5 flex flex-wrap gap-x-1 gap-y-0.5', className)}
    >
      {entries.map((entry) => (
        <li key={entry.id}>
          {onToggle && (
            <button
              type='button'
              aria-pressed={!entry.isOff}
              onClick={() => onToggle(entry.id)}
              className={cn(
                'hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-7 cursor-pointer items-center gap-2 rounded-md px-1.5 text-xs outline-none',
                'transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) focus-visible:ring-[3px] active:scale-[0.97]',
                labelToneOf(entry.isOff),
                pressedQuietOf(entry.id === pressedId)
              )}
            >
              <LegendKey entry={entry} />
              {entry.label}
            </button>
          )}
          {!onToggle && (
            <span className='flex h-7 items-center gap-2 px-1.5 text-xs'>
              <LegendKey entry={entry} />
              {entry.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
