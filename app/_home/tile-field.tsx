import type { CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const COLUMNS = 8;
const ROWS = 11;
const SHOWN_BELOW = 0.42;
const GLOWING_BELOW = 0.14;
const GLOW_CYCLE_SECONDS = 7;

type Side = 'left' | 'right';

type Tile = {
  key: string;
  row: number;
  column: number;
  isGlowing: boolean;
  glowDelay: number;
};

/** Integer hash in [0, 1): the same pattern on every engine, so nothing moves between server and browser. */
function hashOf(first: number, second: number, third: number) {
  let hash = Math.imul(first + 1, 374761393);
  hash ^= Math.imul(second + 1, 668265263);
  hash ^= Math.imul(third + 1, 1274126177);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function sideSeedOf(side: Side) {
  if (side === 'left') {
    return 3;
  }
  return 7;
}

function tilesOf(side: Side): Tile[] {
  const seed = sideSeedOf(side);
  const tiles: Tile[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const presence = hashOf(seed, row, column);
      const isShown = presence < SHOWN_BELOW;
      if (!isShown) {
        continue;
      }
      const glow = hashOf(seed + 11, row, column);
      const isGlowing = glow < GLOWING_BELOW;
      const glowDelay = glow * GLOW_CYCLE_SECONDS * 6;
      tiles.push({
        key: `${row}-${column}`,
        row,
        column,
        isGlowing,
        glowDelay,
      });
    }
  }
  return tiles;
}

function placementOf(tile: Tile): CSSProperties {
  return {
    gridRowStart: tile.row + 1,
    gridColumnStart: tile.column + 1,
  };
}

function glowStyleOf(tile: Tile): CSSProperties {
  return { animationDelay: `${tile.glowDelay.toFixed(2)}s` };
}

function maskOf(side: Side) {
  if (side === 'left') {
    return 'left-0 mask-r-from-30% mask-b-from-40%';
  }
  return 'right-0 mask-l-from-30% mask-b-from-40%';
}

function TileSide({ side }: { side: Side }) {
  const tiles = tilesOf(side);

  return (
    <div
      className={cn(
        'absolute top-0 grid grid-cols-[repeat(8,2.5rem)] grid-rows-[repeat(11,2.5rem)] gap-2',
        maskOf(side)
      )}
    >
      {tiles.map((tile) => (
        <span
          key={tile.key}
          style={placementOf(tile)}
          className='bg-card/70 hairline-ring ring-foreground/[0.06] dark:bg-foreground/[0.025] relative rounded-[0.7rem] shadow-[0_1px_2px_rgb(0_0_0/0.03)]'
        >
          {tile.isGlowing && (
            <span
              style={glowStyleOf(tile)}
              className='bg-primary/12 ring-primary/25 animate-tile-glow absolute inset-0 rounded-[inherit] opacity-0 ring-1 motion-reduce:hidden'
            />
          )}
        </span>
      ))}
    </div>
  );
}

/** Scattered tiles on both sides of a hero, a few of them lighting up in turn. */
export function TileField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-x-0 mx-auto hidden max-w-[88rem] lg:block',
        className
      )}
    >
      <TileSide side='left' />
      <TileSide side='right' />
    </div>
  );
}
