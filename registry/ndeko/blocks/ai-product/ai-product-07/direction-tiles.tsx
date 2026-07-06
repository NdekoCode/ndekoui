'use client';

import { motion } from 'motion/react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';

import { DIRECTIONS, type Direction, type DirectionId } from './data';
import { DirectionArt } from './direction-art';

const ART_STYLE = { borderRadius: 10 };

function toneOf(isPicked: boolean, isSteppedBack: boolean) {
  if (isPicked) {
    return 'bg-foreground/[0.08]';
  }
  if (isSteppedBack) {
    return 'bg-foreground/[0.03] opacity-60 scale-[0.97] hover:opacity-100';
  }
  return 'bg-foreground/[0.04] hover:bg-foreground/[0.07]';
}

type TileProps = {
  direction: Direction;
  isPicked: boolean;
  isSteppedBack: boolean;
  pressed: string | null;
  onPick: (id: DirectionId) => void;
};

function DirectionTile({
  direction,
  isPicked,
  isSteppedBack,
  pressed,
  onPick,
}: TileProps) {
  const isPressed = pressed === `tile-${direction.id}`;

  return (
    <button
      type='button'
      data-direction-tile={direction.id}
      aria-pressed={isPicked}
      onClick={() => onPick(direction.id)}
      className={cn(
        'focus-visible:ring-ring/25 flex w-full cursor-pointer flex-col gap-2 rounded-xl p-2 text-start transition-[background-color,opacity,scale] duration-200 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.97]',
        toneOf(isPicked, isSteppedBack),
        pressedQuietOf(isPressed)
      )}
    >
      <span className='block overflow-hidden rounded-[10px]'>
        {!isPicked && (
          <motion.span
            layoutId={`art-${direction.id}`}
            style={ART_STYLE}
            className='block overflow-hidden'
          >
            <DirectionArt direction={direction} />
          </motion.span>
        )}
        {isPicked && (
          <span className='bg-foreground/[0.06] block aspect-[4/3] w-full' />
        )}
      </span>
      <span className='px-1 text-[13px] font-medium'>{direction.name}</span>
    </button>
  );
}

type DirectionTilesProps = {
  pickedId: DirectionId | null;
  pressed: string | null;
  onPick: (id: DirectionId) => void;
};

export function DirectionTiles({
  pickedId,
  pressed,
  onPick,
}: DirectionTilesProps) {
  const hasPicked = pickedId !== null;

  return (
    <ul aria-label='Visual directions' className='grid grid-cols-2 gap-3'>
      {DIRECTIONS.map((direction) => {
        const isPicked = pickedId === direction.id;
        return (
          <li key={direction.id}>
            <DirectionTile
              direction={direction}
              isPicked={isPicked}
              isSteppedBack={hasPicked && !isPicked}
              pressed={pressed}
              onPick={onPick}
            />
          </li>
        );
      })}
    </ul>
  );
}
