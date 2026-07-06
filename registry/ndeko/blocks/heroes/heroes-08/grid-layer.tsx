import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { CELLS, COLUMNS, type GridCell, LIT_COUNT, ORDER } from './data';

const LINE = 'var(--border) var(--hairline), transparent var(--hairline)';

const GRID_STYLE: CSSProperties = {
  backgroundImage: `linear-gradient(to right, ${LINE}), linear-gradient(to bottom, ${LINE})`,
  backgroundSize: 'var(--cell) var(--cell)',
};

const BOARD_STYLE: CSSProperties = {
  width: `calc(var(--cell) * ${COLUMNS})`,
};

const LINES_FADE =
  '[mask-image:radial-gradient(ellipse_70%_80%_at_50%_45%,black_40%,transparent_100%)]';

type CellStyle = CSSProperties & {
  '--column': number;
  '--row': number;
};

function cellStyleOf(cell: GridCell) {
  const style: CellStyle = { '--column': cell.column, '--row': cell.row };
  return style;
}

function isLitAt(step: number, cellIndex: number) {
  const rank = ORDER.indexOf(cellIndex);
  const count = ORDER.length;
  const shifted = rank - step + count;
  const distance = shifted % count;
  return distance < LIT_COUNT;
}

function litOf(isLit: boolean) {
  if (isLit) {
    return '';
  }
  return undefined;
}

type GridLayerProps = {
  step: number;
};

export function GridLayer({ step }: GridLayerProps) {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 overflow-hidden [--cell:4.5rem]'
    >
      <div
        style={BOARD_STYLE}
        className='absolute inset-y-0 left-1/2 -translate-x-1/2'
      >
        <div
          style={GRID_STYLE}
          className={cn('absolute inset-0', LINES_FADE)}
        />
        {CELLS.map((cell, index) => {
          const isLit = isLitAt(step, index);
          return (
            <span
              key={cell.name}
              style={cellStyleOf(cell)}
              data-lit={litOf(isLit)}
              className='absolute top-[calc(var(--cell)*var(--row))] left-[calc(var(--cell)*var(--column))] flex size-(--cell) scale-90 items-center justify-center opacity-0 transition-[opacity,scale] duration-300 ease-(--ease-out-strong) data-lit:scale-100 data-lit:opacity-100 data-lit:duration-500 motion-reduce:transition-none'
            >
              <BrandTile brand={cell.brand} size='2xl' />
            </span>
          );
        })}
      </div>
    </div>
  );
}
