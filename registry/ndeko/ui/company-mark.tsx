import type { CSSProperties, ReactNode } from 'react';

import { hashOf, pickedFrom } from '@/registry/ndeko/lib/seeded';
import { cn } from '@/registry/ndeko/lib/utils';

export type CompanyMarkSize = 'sm' | 'md' | 'lg';

const TILE_CLASS: Record<CompanyMarkSize, string> = {
  sm: 'size-4 rounded-[4px]',
  md: 'size-5 rounded-[5px]',
  lg: 'size-7 rounded-md',
};

const HEXAGON = (
  <path
    fillRule='evenodd'
    d='M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5ZM12 8l-3.5 2v4l3.5 2 3.5-2v-4Z'
  />
);

const SUNRISE = (
  <>
    <path d='M4.5 14a7.5 7.5 0 0 1 15 0Z' />
    <rect x='3' y='16.5' width='18' height='3' rx='1.5' opacity='0.55' />
  </>
);

const LEAF_OUTLINE = 'M12 21C6.5 17.5 5 11 12 3c7 8 5.5 14.5 0 18Z';

const LEAF = (
  <>
    <path d={LEAF_OUTLINE} opacity='0.55' transform='rotate(-28 12 21)' />
    <path d={LEAF_OUTLINE} transform='rotate(24 12 21)' />
  </>
);

const ARCH = (
  <path d='M4 20V12a8 8 0 0 1 16 0v8h-4.5v-8a3.5 3.5 0 0 0-7 0v8Z' />
);

const PINWHEEL = (
  <>
    <path d='M12 3.5a4.25 4.25 0 0 1 0 8.5Z' />
    <path d='M20.5 12a4.25 4.25 0 0 1-8.5 0Z' opacity='0.6' />
    <path d='M12 20.5a4.25 4.25 0 0 1 0-8.5Z' />
    <path d='M3.5 12a4.25 4.25 0 0 1 8.5 0Z' opacity='0.6' />
  </>
);

const TILES = (
  <>
    <rect x='3' y='3' width='8' height='8' rx='2' />
    <rect x='13' y='3' width='8' height='8' rx='4' opacity='0.6' />
    <rect x='3' y='13' width='8' height='8' rx='4' opacity='0.6' />
    <rect x='13' y='13' width='8' height='8' rx='2' />
  </>
);

const ORBIT = (
  <>
    <circle
      cx='12'
      cy='12'
      r='7.5'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
    />
    <circle cx='18.5' cy='6' r='2.5' />
  </>
);

const BARS = (
  <>
    <rect x='4' y='12' width='4' height='8' rx='2' opacity='0.5' />
    <rect x='10' y='8' width='4' height='12' rx='2' opacity='0.75' />
    <rect x='16' y='4' width='4' height='16' rx='2' />
  </>
);

const STACK = (
  <>
    <rect x='3' y='4' width='18' height='4' rx='2' />
    <rect x='5' y='10' width='14' height='4' rx='2' opacity='0.7' />
    <rect x='7' y='16' width='10' height='4' rx='2' opacity='0.45' />
  </>
);

const DROP = (
  <path
    fillRule='evenodd'
    d='M12 3c4 4.8 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 11 8 7.8 12 3Zm0 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z'
  />
);

const PETALS = (
  <g opacity='0.8'>
    <circle cx='12' cy='7' r='4.5' />
    <circle cx='12' cy='17' r='4.5' />
    <circle cx='7' cy='12' r='4.5' />
    <circle cx='17' cy='12' r='4.5' />
  </g>
);

const CHEVRONS = (
  <g
    fill='none'
    stroke='currentColor'
    strokeWidth='2.8'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='m5 6 6 6-6 6' opacity='0.55' />
    <path d='m12 6 6 6-6 6' />
  </g>
);

const QUARTERS = (
  <>
    <path d='M11 11V2a9 9 0 0 0-9 9Z' />
    <path d='M13 2h9a9 9 0 0 1-9 9Z' opacity='0.6' />
    <path d='M2 13h9a9 9 0 0 1-9 9Z' opacity='0.6' />
    <path d='M22 22v-9a9 9 0 0 0-9 9Z' />
  </>
);

const PEAKS = (
  <>
    <path d='M2 19 9 6l7 13Z' />
    <path d='m11 19 5.5-9 5.5 9Z' opacity='0.55' />
  </>
);

const SPLIT = (
  <>
    <circle
      cx='12'
      cy='12'
      r='8.5'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
    />
    <path d='M12 3.5a8.5 8.5 0 0 1 0 17Z' />
  </>
);

const WAVES = (
  <g fill='none' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round'>
    <path d='M3 9c3-3.2 6-3.2 9 0s6 3.2 9 0' />
    <path d='M3 15.5c3-3.2 6-3.2 9 0s6 3.2 9 0' opacity='0.55' />
  </g>
);

/** A name lands on a position of this list, so the order is part of the design: moving a shape changes whose mark it is. */
const SHAPES: ReactNode[] = [
  HEXAGON,
  SUNRISE,
  LEAF,
  ARCH,
  PINWHEEL,
  TILES,
  ORBIT,
  BARS,
  STACK,
  DROP,
  PETALS,
  CHEVRONS,
  QUARTERS,
  PEAKS,
  SPLIT,
  WAVES,
];

const INK = '#18181b';

/** Colours a company would pick for itself. They belong to the mark, so they stay the same in both themes. */
const COLORS = [
  '#8b5cf6',
  '#e5484d',
  '#0f9b8e',
  INK,
  '#2f9e5b',
  '#52607a',
  '#c28a04',
  '#c2379a',
  '#5b5bd6',
  '#2f4fc4',
  '#0b84f3',
  '#f26b21',
];

type Plate = 'solid' | 'paper';

/** Most companies fill their square with their colour; one in three draws in colour on a plain square. */
const PLATES: Plate[] = ['solid', 'solid', 'paper'];

const PLATE_CLASS: Record<Plate, string> = {
  solid: 'bg-(--mark) text-white ring-black/10 dark:ring-white/15',
  paper:
    'bg-card ring-border text-(--mark) dark:text-[color-mix(in_oklab,var(--mark)_72%,white)]',
};

const SHAPE_SHIFT = 14;
const COLOR_SHIFT = 1;
const PLATE_SHIFT = 20;

/** Ink on a plain square disappears in the dark theme, so the ink colour always fills its square. */
function plateOf(hash: number, color: string) {
  if (color === INK) {
    return 'solid';
  }
  return pickedFrom(PLATES, hash, PLATE_SHIFT);
}

function roleOf(isNamed: boolean) {
  if (isNamed) {
    return 'img';
  }
  return undefined;
}

function hiddenOf(isNamed: boolean) {
  if (isNamed) {
    return undefined;
  }
  return true;
}

type MarkStyle = CSSProperties & { '--mark': string };

type CompanyMarkProps = {
  /** The name of the company, or its id when the name can change. The same text gives the same mark everywhere. */
  seed: string;
  size?: CompanyMarkSize;
  /** The accessible name. Without it the mark is decorative, for a row that already names the company. */
  title?: string;
  className?: string;
};

/**
 * The mark of a company that has no logo to show: a shape and a colour drawn from its name, in the
 * square a real logo would fill. A known product wears its own mark through `BrandTile` instead.
 */
export function CompanyMark({
  seed,
  size = 'md',
  title,
  className,
}: CompanyMarkProps) {
  const hash = hashOf(seed);
  const shape = pickedFrom(SHAPES, hash, SHAPE_SHIFT);
  const color = pickedFrom(COLORS, hash, COLOR_SHIFT);
  const plate = plateOf(hash, color);
  const markStyle: MarkStyle = { '--mark': color };
  const isNamed = Boolean(title);

  return (
    <span
      role={roleOf(isNamed)}
      aria-label={title}
      aria-hidden={hiddenOf(isNamed)}
      style={markStyle}
      className={cn(
        'hairline-ring inline-flex shrink-0 items-center justify-center ring-inset',
        PLATE_CLASS[plate],
        TILE_CLASS[size],
        className
      )}
    >
      <svg
        viewBox='0 0 24 24'
        fill='currentColor'
        focusable='false'
        aria-hidden='true'
        className='size-[62%]'
      >
        {shape}
      </svg>
    </span>
  );
}
