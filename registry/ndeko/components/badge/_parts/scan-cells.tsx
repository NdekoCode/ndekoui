import { GRID, type Grain } from './scan-pattern';

type CellsStyle = React.CSSProperties & {
  '--cell': string;
  '--fall-ease': string;
};

/** A module is drawn a little smaller than its square, so the cells read as separate grains. */
const REST_SCALE = 0.88;

const CELL_PERCENT = 100 / GRID;

const GROW_MS = 340;

const APPEAR_MS = 200;

/** A grain fades over the last part of its fall, so none is left showing under the badge. */
const FADE_SHARE = 0.3;

const STILL_FADE = 'opacity 200ms linear';

/** The size of a cell and the curve of a fall are written once on the grid, not on each of its cells. */
const CELLS_STYLE: CellsStyle = {
  '--cell': `${percentOf(1)}%`,
  '--fall-ease': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
};

function percentOf(index: number) {
  const percent = index * CELL_PERCENT;
  return Math.round(percent * 1000) / 1000;
}

function placeOf(grain: Grain): React.CSSProperties {
  return {
    left: `${percentOf(grain.col)}%`,
    top: `${percentOf(grain.row)}%`,
  };
}

/** A translate in percent of the cell's own size, so one module is 100%. */
function travelOf(grain: Grain) {
  const across = Math.round(grain.fallX * 100);
  const down = Math.round(grain.fallY * 100);
  return `${across}% ${down}%`;
}

/**
 * A grain falls the way a weight does, slowly at first and then faster, fades out over the end of
 * its fall, and only then shrinks to nothing: the shrinking is what lets it grow back from nothing.
 */
function fallTransitionOf(grain: Grain) {
  const fadeMs = Math.round(grain.fallMs * FADE_SHARE);
  const landsAt = grain.pourDelayMs + grain.fallMs;
  const fall = `translate ${grain.fallMs}ms var(--fall-ease) ${grain.pourDelayMs}ms`;
  const fade = `opacity ${fadeMs}ms linear ${landsAt - fadeMs}ms`;
  const shrink = `scale 1ms linear ${landsAt}ms`;
  return [fall, fade, shrink].join(', ');
}

/** Growing back is in place: the translate is not in the list, so the cell is back on its square at once, unseen. */
function growTransitionOf(grain: Grain) {
  const grow = `scale ${GROW_MS}ms var(--ease-out-strong) ${grain.growDelayMs}ms`;
  const appear = `opacity ${APPEAR_MS}ms linear ${grain.growDelayMs}ms`;
  return [grow, appear].join(', ');
}

function stillOpacityOf(isFallen: boolean) {
  if (isFallen) {
    return 0;
  }
  return 1;
}

function grainStyleOf(
  grain: Grain,
  isFallen: boolean,
  isStill: boolean
): React.CSSProperties {
  const place = placeOf(grain);
  const restScale = String(REST_SCALE);
  if (isStill) {
    return {
      ...place,
      scale: restScale,
      opacity: stillOpacityOf(isFallen),
      transition: STILL_FADE,
    };
  }
  if (isFallen) {
    return {
      ...place,
      translate: travelOf(grain),
      scale: '0',
      opacity: 0,
      transition: fallTransitionOf(grain),
    };
  }
  return {
    ...place,
    translate: '0% 0%',
    scale: restScale,
    opacity: 1,
    transition: growTransitionOf(grain),
  };
}

export type ScanCellsProps = {
  grains: readonly Grain[];
  /** The cells have poured into the badge. */
  isFallen: boolean;
  /** Reduced motion: the cells fade out and in where they stand. */
  isStill: boolean;
};

/**
 * The cells of the code, each one its own element placed on the grid of the code. A change of
 * `isFallen` moves them with transitions of `translate`, `scale` and `opacity` and nothing else, so
 * the browser animates them off the main thread and nothing runs between two changes.
 */
export function ScanCells({ grains, isFallen, isStill }: ScanCellsProps) {
  return (
    <div
      aria-hidden='true'
      style={CELLS_STYLE}
      className='absolute inset-0 forced-colors:*:bg-[CanvasText]'
    >
      {grains.map((grain) => (
        <span
          key={`${grain.col}-${grain.row}`}
          style={grainStyleOf(grain, isFallen, isStill)}
          className='bg-foreground absolute size-(--cell) rounded-[30%]'
        />
      ))}
    </div>
  );
}
