'use client';

import Link from 'next/link';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { AnimatedTabsHover } from '@/app/docs/animated-background/animated-tabs-hover';
import { TextLoopBasic } from '@/app/docs/text-loop/text-loop-basic';
import { TextMorphButton } from '@/app/docs/text-morph/text-morph-button';
import { MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const MIN_SEATS = 1;
const MAX_SEATS = 50;

function SeatCounter() {
  const [seats, setSeats] = useState(4);
  const isAtMinimum = seats <= MIN_SEATS;
  const isAtMaximum = seats >= MAX_SEATS;

  function removeSeat() {
    setSeats((current) => Math.max(MIN_SEATS, current - 1));
  }

  function addSeat() {
    setSeats((current) => Math.min(MAX_SEATS, current + 1));
  }

  return (
    <div className='flex items-center gap-3'>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label='Remove a seat'
        disabled={isAtMinimum}
        onClick={removeSeat}
      >
        <MinusIcon />
      </Button>
      <span className='flex w-10 justify-center text-2xl font-semibold tabular-nums'>
        <MotionNumber value={seats} />
      </span>
      <Button
        variant='outline'
        size='icon-sm'
        aria-label='Add a seat'
        disabled={isAtMaximum}
        onClick={addSeat}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

type MotionCell = {
  slug: string;
  name: string;
  motion: string;
  demo: React.ReactNode;
};

const CELLS: MotionCell[] = [
  {
    slug: 'motion-number',
    name: 'Motion number',
    motion: 'Digits roll in the direction of the change',
    demo: <SeatCounter />,
  },
  {
    slug: 'text-morph',
    name: 'Text morph',
    motion: 'Letters the two labels share stay in place',
    demo: <TextMorphButton />,
  },
  {
    slug: 'animated-background',
    name: 'Animated background',
    motion: 'One highlight follows the pointer between items',
    demo: <AnimatedTabsHover />,
  },
  {
    slug: 'text-loop',
    name: 'Text loop',
    motion: 'Hints take turns in one place',
    demo: <TextLoopBasic />,
  },
];

export function MotionShowcase() {
  return (
    <ul className='grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4'>
      {CELLS.map((cell) => (
        <li key={cell.slug} className='flex flex-col gap-3'>
          <div className='bg-foreground/[0.025] flex h-44 items-center justify-center rounded-2xl px-4'>
            {cell.demo}
          </div>
          <Link
            href={`/docs/${cell.slug}`}
            className='group focus-visible:ring-ring/25 flex flex-col gap-0.5 rounded-md px-1 outline-none focus-visible:ring-[3px]'
          >
            <span className='text-[13px] font-medium group-hover:underline'>
              {cell.name}
            </span>
            <span className='text-muted-foreground text-xs'>{cell.motion}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
