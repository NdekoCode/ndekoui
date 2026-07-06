'use client';

import { Marquee } from '@/components/core/marquee';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';

import {
  CHATGPT,
  CLAUDE,
  COMMAND,
  DEEPSEEK,
  GEMINI,
  GROK,
  LLAMA,
  MISTRAL,
  QWEN,
  SONAR,
  type SceneModel,
} from './_parts/models';
import { useScenePlay } from './_parts/use-scene-play';

const FIRST_ROW_SECONDS = 46;

/** Each row is a little slower than the one above, so two rows never drift in step. */
const ROW_SLOWDOWN_SECONDS = 8;

const CHIP_GAP_PX = 10;

/**
 * The rows hold still under the pointer, while the reel has the focus and while nobody can see it.
 * Each rule names the reel and its state, so it outranks the animation of the row it stops.
 */
const HELD =
  'group-hover/reel:*:[animation-play-state:paused] group-focus-visible/reel:*:[animation-play-state:paused] group-data-[held=true]/reel:*:[animation-play-state:paused]';

function durationOf(rowIndex: number) {
  return FIRST_ROW_SECONDS + rowIndex * ROW_SLOWDOWN_SECONDS;
}

function isOddRow(rowIndex: number) {
  return rowIndex % 2 === 1;
}

function rowKeyOf(row: SceneModel[], rowIndex: number) {
  const ids = row.map((model) => model.id);
  const joined = ids.join('-');
  return `${rowIndex}:${joined}`;
}

function ModelChip({ model }: { model: SceneModel }) {
  return (
    <span className='bg-card hairline-ring ring-border flex h-9 shrink-0 items-center gap-2 rounded-full ps-1 pe-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <BrandTile brand={model.brand} size='lg' className='rounded-full' />
      {model.name}
    </span>
  );
}

export type ModelReelProps = {
  /** One list of models per row. Rows drift in opposite directions. */
  rows: SceneModel[][];
  /** What the reel is, for a screen reader. */
  label?: string;
  className?: string;
};

export function ModelReel({
  rows,
  label = 'Models',
  className,
}: ModelReelProps) {
  const { ref, isPlaying } = useScenePlay();

  return (
    <div
      ref={ref}
      role='group'
      aria-label={`${label}, a moving list that holds still while it has the focus`}
      tabIndex={0}
      data-held={!isPlaying}
      className={cn(
        'group/reel focus-visible:ring-ring focus-visible:ring-offset-background flex w-full max-w-[34rem] flex-col gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className
      )}
    >
      {rows.map((row, rowIndex) => (
        <Marquee
          key={rowKeyOf(row, rowIndex)}
          reverse={isOddRow(rowIndex)}
          duration={durationOf(rowIndex)}
          gap={CHIP_GAP_PX}
          className={cn('py-1', HELD)}
        >
          {row.map((model) => (
            <ModelChip key={model.id} model={model} />
          ))}
        </Marquee>
      ))}
    </div>
  );
}

const ROWS: SceneModel[][] = [
  [CLAUDE, CHATGPT, GEMINI, MISTRAL, DEEPSEEK],
  [LLAMA, GROK, QWEN, COMMAND, SONAR],
];

export default function Illustration02() {
  return <ModelReel rows={ROWS} />;
}
