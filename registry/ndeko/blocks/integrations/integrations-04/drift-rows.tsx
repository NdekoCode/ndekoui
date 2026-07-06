'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import { TOOLS, type Tool, type ToolId } from './data';

export type DriftLayer = 'grey' | 'colour';

type DriftStyle = React.CSSProperties & { '--marquee-duration': string };

type RowSpec = {
  id: string;
  seconds: number;
  isReversed: boolean;
  offset: number;
};

const ROWS: RowSpec[] = [
  { id: 'top', seconds: 46, isReversed: false, offset: 0 },
  { id: 'middle', seconds: 58, isReversed: true, offset: 4 },
  { id: 'bottom', seconds: 38, isReversed: false, offset: 8 },
];

/** Half of the copies is what one loop travels, so two copies must be wider than the stage. */
const COPIES = [0, 1, 2, 3];

const TRACK =
  'flex w-max motion-safe:animate-marquee group-data-[held=true]/reel:[animation-play-state:paused]!';

function rotatedTools(offset: number) {
  const tail = TOOLS.slice(0, offset);
  const head = TOOLS.slice(offset);
  return [...head, ...tail];
}

function directionOf(isReversed: boolean) {
  if (isReversed) {
    return '[animation-direction:reverse]!';
  }
  return undefined;
}

function quietOf(isConnected: boolean) {
  if (isConnected) {
    return undefined;
  }
  return 'opacity-70 grayscale';
}

type GreyTileProps = {
  tool: Tool;
  isConnected: boolean;
  onPick: (id: ToolId) => void;
};

function GreyTile({ tool, isConnected, onPick }: GreyTileProps) {
  return (
    <button
      type='button'
      tabIndex={-1}
      onClick={() => onPick(tool.id)}
      className={cn(
        'block cursor-pointer rounded-[10px] transition-[filter,opacity] duration-300 ease-(--ease-out-strong) outline-none hover:opacity-100',
        quietOf(isConnected)
      )}
    >
      <BrandTile brand={tool.id} size='2xl' />
    </button>
  );
}

type DriftRowProps = {
  row: RowSpec;
  layer: DriftLayer;
  connected: ToolId[];
  onPick?: (id: ToolId) => void;
};

function Tile({
  tool,
  layer,
  connected,
  onPick,
}: Omit<DriftRowProps, 'row'> & { tool: Tool }) {
  if (layer === 'grey' && onPick) {
    const isConnected = connected.includes(tool.id);
    return <GreyTile tool={tool} isConnected={isConnected} onPick={onPick} />;
  }
  return <BrandTile brand={tool.id} size='2xl' />;
}

function DriftRow({ row, layer, connected, onPick }: DriftRowProps) {
  const tools = rotatedTools(row.offset);
  const style: DriftStyle = { '--marquee-duration': `${row.seconds}s` };

  return (
    <div className='flex overflow-hidden'>
      <div style={style} className={cn(TRACK, directionOf(row.isReversed))}>
        {COPIES.map((copy) => (
          <ul key={copy} className='flex shrink-0 gap-3 pe-3'>
            {tools.map((tool) => (
              <li key={tool.id}>
                <Tile
                  tool={tool}
                  layer={layer}
                  connected={connected}
                  onPick={onPick}
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

type DriftRowsProps = Omit<DriftRowProps, 'row'>;

/** The grey layer and the colour layer are the same rows on the same clock, so they stay in step. */
export function DriftRows({ layer, connected, onPick }: DriftRowsProps) {
  return (
    <div className='absolute inset-x-0 top-8 flex flex-col gap-3'>
      {ROWS.map((row) => (
        <DriftRow
          key={row.id}
          row={row}
          layer={layer}
          connected={connected}
          onPick={onPick}
        />
      ))}
    </div>
  );
}
