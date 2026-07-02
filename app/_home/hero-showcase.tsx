'use client';

import { useState, type ComponentType, type CSSProperties } from 'react';

import Activity05 from '@/registry/ndeko/components/activity/activity-05';
import Avatar23 from '@/registry/ndeko/components/avatar/avatar-23';
import Button27 from '@/registry/ndeko/components/button/button-27';
import Button35 from '@/registry/ndeko/components/button/button-35';
import Button40 from '@/registry/ndeko/components/button/button-40';
import CalendarDatePicker02 from '@/registry/ndeko/components/calendar-date-picker/calendar-date-picker-02';
import Comment03 from '@/registry/ndeko/components/comment/comment-03';
import Input25 from '@/registry/ndeko/components/input/input-25';
import Notification28 from '@/registry/ndeko/components/notification/notification-28';
import Slider26 from '@/registry/ndeko/components/slider/slider-26';
import Subtask01 from '@/registry/ndeko/components/subtask/subtask-01';
import Switch12 from '@/registry/ndeko/components/switch/switch-12';
import Teams08 from '@/registry/ndeko/components/teams/teams-08';
import Tooltip09 from '@/registry/ndeko/components/tooltip/tooltip-09';
import { cn } from '@/registry/ndeko/lib/utils';

type Swatch = {
  name: string;
  /** Left out for the theme's own colour, so the default look is exactly the theme. */
  primary?: string;
  inkLight?: string;
  inkDark?: string;
  dot: string;
};

const SWATCHES: Swatch[] = [
  { name: 'Indigo', dot: 'hsl(239 84% 67%)' },
  {
    name: 'Blue',
    primary: 'hsl(217 91% 60%)',
    inkLight: 'hsl(221 83% 53%)',
    inkDark: 'hsl(213 94% 68%)',
    dot: 'hsl(217 91% 60%)',
  },
  {
    name: 'Violet',
    primary: 'hsl(262 83% 62%)',
    inkLight: 'hsl(263 70% 50%)',
    inkDark: 'hsl(255 92% 76%)',
    dot: 'hsl(262 83% 62%)',
  },
  {
    name: 'Rose',
    primary: 'hsl(347 77% 56%)',
    inkLight: 'hsl(345 83% 47%)',
    inkDark: 'hsl(351 95% 71%)',
    dot: 'hsl(347 77% 56%)',
  },
  {
    name: 'Emerald',
    primary: 'hsl(160 84% 36%)',
    inkLight: 'hsl(161 94% 30%)',
    inkDark: 'hsl(156 72% 67%)',
    dot: 'hsl(160 84% 36%)',
  },
];

/** The ink pair follows the theme of the page: the darker shade on light, the lighter one on dark. */
const INK_BY_THEME =
  '[--primary-ink:var(--swatch-ink-light)] dark:[--primary-ink:var(--swatch-ink-dark)]';

type Piece = {
  name: string;
  Piece: ComponentType;
  /** It draws its own card, so it sits on the stage without a second ring around it. */
  hasOwnSurface?: boolean;
};

/* Pieces that read without a click, one list per column, balanced by height on a wide screen. */
const COLUMNS: Piece[][][] = [
  [
    [{ name: 'input-25', Piece: Input25 }],
    [{ name: 'slider-26', Piece: Slider26 }],
    [
      { name: 'switch-12', Piece: Switch12 },
      { name: 'button-35', Piece: Button35 },
    ],
    [
      {
        name: 'calendar-date-picker-02',
        Piece: CalendarDatePicker02,
        hasOwnSurface: true,
      },
    ],
    [{ name: 'avatar-23', Piece: Avatar23 }],
  ],
  [
    [{ name: 'comment-03', Piece: Comment03 }],
    [{ name: 'tooltip-09', Piece: Tooltip09 }],
    [
      { name: 'button-40', Piece: Button40 },
      { name: 'button-27', Piece: Button27 },
    ],
    [{ name: 'teams-08', Piece: Teams08, hasOwnSurface: true }],
  ],
  [
    [{ name: 'subtask-01', Piece: Subtask01 }],
    [{ name: 'activity-05', Piece: Activity05 }],
    [{ name: 'notification-28', Piece: Notification28 }],
  ],
];

/** The third column spans the row on a medium screen and splits its own cards in two. */
function columnClassOf(index: number) {
  const isLast = index === COLUMNS.length - 1;
  if (isLast) {
    return 'md:col-span-2 md:block md:columns-2 md:gap-3 xl:col-span-1 xl:flex xl:columns-1';
  }
  return '';
}

function columnKeyOf(column: Piece[][]) {
  return column.map(groupKeyOf).join('|');
}

function themeStyleOf(swatch: Swatch): CSSProperties | undefined {
  if (!swatch.primary) {
    return undefined;
  }
  return {
    '--primary': swatch.primary,
    '--ring': swatch.primary,
    '--chart-1': swatch.primary,
    '--chart-2': `color-mix(in oklab, ${swatch.primary} 72%, white)`,
    '--chart-3': `color-mix(in oklab, ${swatch.primary} 48%, white)`,
    '--swatch-ink-light': swatch.inkLight,
    '--swatch-ink-dark': swatch.inkDark,
  } as CSSProperties;
}

function themeClassOf(swatch: Swatch) {
  if (!swatch.primary) {
    return undefined;
  }
  return INK_BY_THEME;
}

function dotStyleOf(swatch: Swatch): CSSProperties {
  return { backgroundColor: swatch.dot };
}

function groupKeyOf(group: Piece[]) {
  return group.map((piece) => piece.name).join('+');
}

type SwatchPickerProps = {
  activeIndex: number;
  onPick: (index: number) => void;
};

function SwatchPicker({ activeIndex, onPick }: SwatchPickerProps) {
  return (
    <div
      role='radiogroup'
      aria-label='Primary colour of the components below'
      className='flex items-center gap-2'
    >
      {SWATCHES.map((swatch, index) => {
        const isActive = index === activeIndex;

        function pick() {
          onPick(index);
        }

        return (
          <button
            key={swatch.name}
            type='button'
            role='radio'
            aria-checked={isActive}
            aria-label={swatch.name}
            onClick={pick}
            style={dotStyleOf(swatch)}
            className={cn(
              'focus-visible:ring-ring/40 ring-offset-background size-5 rounded-full ring-offset-2 transition-[box-shadow,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-90',
              isActive && 'ring-foreground/40 ring-2'
            )}
          />
        );
      })}
    </div>
  );
}

const CARD_SURFACE =
  'bg-card hairline-ring ring-border p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

function hasOwnSurfaceOf(group: Piece[]) {
  return group.some((piece) => piece.hasOwnSurface);
}

function surfaceOf(group: Piece[]) {
  if (hasOwnSurfaceOf(group)) {
    return '';
  }
  return CARD_SURFACE;
}

function PieceCard({ group }: { group: Piece[] }) {
  return (
    <div
      className={cn(
        surfaceOf(group),
        'mb-3 flex break-inside-avoid flex-wrap items-center justify-center gap-4 rounded-2xl last:mb-0 md:last:mb-3 xl:last:mb-0'
      )}
    >
      {group.map(({ name, Piece }) => (
        <div key={name} className='flex max-w-full min-w-0 grow justify-center'>
          <Piece />
        </div>
      ))}
    </div>
  );
}

/**
 * Catalogue items laid out on one stage, as they install, with a colour picker that re-themes all
 * of them at once. Every one of them can be clicked.
 */
export function HeroShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SWATCHES[activeIndex];

  return (
    <div className='flex flex-col gap-4 text-left'>
      <div className='flex flex-wrap items-center justify-between gap-4 px-1'>
        <p className='text-muted-foreground text-sm'>
          Live components from the catalogue. Try them, or change their colour.
        </p>
        <SwatchPicker activeIndex={activeIndex} onPick={setActiveIndex} />
      </div>
      <div
        style={themeStyleOf(active)}
        className={cn(
          'bg-foreground/[0.025] rounded-3xl p-3',
          themeClassOf(active)
        )}
      >
        <div className='grid grid-cols-[minmax(0,1fr)] gap-x-3 md:grid-cols-2 xl:grid-cols-3'>
          {COLUMNS.map((column, index) => (
            <div
              key={columnKeyOf(column)}
              className={cn('flex min-w-0 flex-col', columnClassOf(index))}
            >
              {column.map((group) => (
                <PieceCard key={groupKeyOf(group)} group={group} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
