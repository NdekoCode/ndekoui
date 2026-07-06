import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { FONT_CLASS, type Direction, type ShapeKind } from './data';

const SHAPE_CLASS: Record<ShapeKind, string> = {
  circle: 'rounded-full',
  square: 'rounded-[12%]',
  triangle: '',
  arch: 'rounded-t-full',
};

const TRIANGLE = 'polygon(50% 0, 100% 100%, 0 100%)';

type ShapeProps = {
  kind: ShapeKind;
  color: string;
  className?: string;
};

function Shape({ kind, color, className }: ShapeProps) {
  const style: CSSProperties = { backgroundColor: color };
  if (kind === 'triangle') {
    style.clipPath = TRIANGLE;
  }
  return (
    <span
      aria-hidden='true'
      style={style}
      className={cn('absolute', SHAPE_CLASS[kind], className)}
    />
  );
}

type DirectionArtProps = {
  direction: Direction;
};

/**
 * A small composition of one direction: its type, two shapes and its four colours. Sizes are in
 * container units, so the same drawing holds at any size and can grow from a tile into a brief.
 */
export function DirectionArt({ direction }: DirectionArtProps) {
  const [paper, ink, accent, soft] = direction.swatches;

  return (
    <span
      aria-hidden='true'
      style={{ backgroundColor: paper.color }}
      className='@container relative block aspect-[4/3] w-full overflow-hidden'
    >
      <span
        style={{ color: ink.color }}
        className={cn(
          'absolute start-[8cqw] top-[6cqw] text-[30cqw] leading-none font-semibold',
          FONT_CLASS[direction.display]
        )}
      >
        Aa
      </span>
      <Shape
        kind={direction.shapes[0]}
        color={accent.color}
        className='end-[24cqw] top-[10cqw] size-[22cqw]'
      />
      <Shape
        kind={direction.shapes[1]}
        color={soft.color}
        className='end-[7cqw] top-[22cqw] size-[16cqw]'
      />
      <span className='absolute inset-x-[8cqw] bottom-[8cqw] flex h-[11cqw] gap-[2cqw]'>
        {direction.swatches.map((swatch) => (
          <span
            key={swatch.name}
            style={{ backgroundColor: swatch.color }}
            className='hairline-ring flex-1 rounded-[2cqw] ring-black/10'
          />
        ))}
      </span>
    </span>
  );
}

type ResultArtProps = {
  direction: Direction;
};

function ResultFrame({
  direction,
  children,
}: ResultArtProps & { children: React.ReactNode }) {
  const [paper] = direction.swatches;

  return (
    <span
      aria-hidden='true'
      style={{ backgroundColor: paper.color }}
      className='@container relative block aspect-[4/3] w-full overflow-hidden'
    >
      {children}
    </span>
  );
}

function SplitResult({ direction }: ResultArtProps) {
  const [, , accent, soft] = direction.swatches;

  return (
    <ResultFrame direction={direction}>
      <span
        style={{ backgroundColor: accent.color }}
        className='absolute inset-y-0 end-0 w-[46%]'
      />
      <Shape
        kind={direction.shapes[0]}
        color={soft.color}
        className='end-[10cqw] top-[22cqw] size-[28cqw]'
      />
    </ResultFrame>
  );
}

function TypeResult({ direction }: ResultArtProps) {
  const [, ink, accent] = direction.swatches;

  return (
    <ResultFrame direction={direction}>
      <span
        style={{ color: ink.color }}
        className={cn(
          'absolute start-[10cqw] top-[12cqw] text-[40cqw] leading-none font-semibold',
          FONT_CLASS[direction.display]
        )}
      >
        Ab
      </span>
      <span
        style={{ backgroundColor: accent.color }}
        className='absolute inset-x-[10cqw] bottom-[12cqw] h-[5cqw] rounded-full'
      />
    </ResultFrame>
  );
}

function PosterResult({ direction }: ResultArtProps) {
  const [, ink, accent, soft] = direction.swatches;

  return (
    <ResultFrame direction={direction}>
      <span
        style={{ backgroundColor: accent.color }}
        className='absolute inset-x-[14cqw] top-[10cqw] bottom-0 rounded-t-full'
      />
      <span
        style={{ backgroundColor: soft.color }}
        className='absolute start-[26cqw] top-[34cqw] size-[22cqw] rounded-full'
      />
      <span
        style={{ backgroundColor: ink.color }}
        className='absolute inset-x-0 bottom-0 h-[10cqw]'
      />
    </ResultFrame>
  );
}

function GridResult({ direction }: ResultArtProps) {
  const [, ink, accent, soft] = direction.swatches;
  const colors = [accent.color, ink.color, soft.color, accent.color];

  return (
    <ResultFrame direction={direction}>
      <span className='absolute inset-[10cqw] grid grid-cols-2 gap-[3cqw]'>
        {colors.map((color, index) => (
          <span
            key={index}
            style={{ backgroundColor: color }}
            className='rounded-[4cqw]'
          />
        ))}
      </span>
    </ResultFrame>
  );
}

function BarsResult({ direction }: ResultArtProps) {
  const [, ink, accent, soft] = direction.swatches;

  return (
    <ResultFrame direction={direction}>
      <span className='absolute inset-x-[10cqw] bottom-[10cqw] flex h-[50cqw] items-end gap-[3cqw]'>
        <span
          style={{ backgroundColor: soft.color }}
          className='h-[40%] flex-1 rounded-[2cqw]'
        />
        <span
          style={{ backgroundColor: accent.color }}
          className='h-[100%] flex-1 rounded-[2cqw]'
        />
        <span
          style={{ backgroundColor: ink.color }}
          className='h-[65%] flex-1 rounded-[2cqw]'
        />
      </span>
    </ResultFrame>
  );
}

function RingResult({ direction }: ResultArtProps) {
  const [, ink, accent] = direction.swatches;

  return (
    <ResultFrame direction={direction}>
      <span
        style={{ borderColor: accent.color }}
        className='absolute start-[28cqw] top-[10cqw] size-[44cqw] rounded-full border-[7cqw]'
      />
      <span
        style={{ backgroundColor: ink.color }}
        className='absolute start-[50cqw] top-[32cqw] size-[10cqw] rounded-full'
      />
    </ResultFrame>
  );
}

const RESULT_ARTS = [
  SplitResult,
  TypeResult,
  PosterResult,
  GridResult,
  BarsResult,
  RingResult,
];

type ResultProps = {
  direction: Direction;
  index: number;
};

export function ResultDrawing({ direction, index }: ResultProps) {
  const Art = RESULT_ARTS[index % RESULT_ARTS.length];

  return <Art direction={direction} />;
}
