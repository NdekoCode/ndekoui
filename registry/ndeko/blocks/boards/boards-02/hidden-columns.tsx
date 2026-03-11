'use client';

import { useDroppable } from '@dnd-kit/core';

import { EyeIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { LaneTile, type LaneMeta } from './board-lane';
import { hiddenDropIdOf } from './board-moves';
import type { LaneId } from './data';

type HiddenLaneRowProps = {
  lane: LaneMeta;
  count: number;
  isTarget: boolean;
  onShow: (laneId: LaneId) => void;
};

function HiddenLaneRow({ lane, count, isTarget, onShow }: HiddenLaneRowProps) {
  const { setNodeRef } = useDroppable({ id: hiddenDropIdOf(lane.id) });

  function showLane() {
    onShow(lane.id);
  }

  return (
    <li
      ref={setNodeRef}
      className={cn(
        'flex h-10 items-center gap-2 rounded-lg pr-1 pl-2.5 transition-colors duration-150',
        isTarget && 'bg-primary/[0.08]'
      )}
    >
      <LaneTile lane={lane} />
      <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
        {lane.label}
      </span>
      <span className='text-muted-foreground text-xs tabular-nums'>
        {count}
      </span>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Show the ${lane.label} column`}
        onClick={showLane}
        className='text-muted-foreground'
      >
        <EyeIcon />
      </Button>
    </li>
  );
}

type HiddenColumnsProps = {
  lanes: LaneMeta[];
  countOf: (laneId: LaneId) => number;
  targetLaneId: LaneId | null;
  onShow: (laneId: LaneId) => void;
};

/** Folded lanes gather at the end of the board. Each row still takes a dropped card. */
export function HiddenColumns({
  lanes,
  countOf,
  targetLaneId,
  onShow,
}: HiddenColumnsProps) {
  return (
    <section
      aria-label='Hidden columns'
      className='bg-foreground/[0.03] flex w-60 shrink-0 snap-start flex-col rounded-xl'
    >
      <header className='flex h-11 items-center px-3'>
        <h2 className='text-muted-foreground text-[13px] font-semibold'>
          Hidden columns
        </h2>
      </header>
      <ul className='flex flex-col gap-0.5 px-1.5 pb-1.5'>
        {lanes.map((lane) => (
          <HiddenLaneRow
            key={lane.id}
            lane={lane}
            count={countOf(lane.id)}
            isTarget={targetLaneId === lane.id}
            onShow={onShow}
          />
        ))}
      </ul>
    </section>
  );
}
