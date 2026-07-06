'use client';

import { useRef, useState } from 'react';

import { PlusIcon } from '@/registry/ndeko/lib/icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

import type { PaletteEntry } from './catalog';
import { Palette } from './palette';
import { capitalized } from './words';

type InsertButtonProps = {
  /** Where the point sits, from the corner of the step it follows. */
  x: number;
  y: number;
  /** Where a step added here goes, in words that follow "Add a step": after Track the parcel. */
  placement: string;
  onPick: (entry: PaletteEntry) => void;
};

/**
 * A small plus on an edge. It opens the palette beside it, and a pick adds the step right there.
 * The point sits on a zero-size anchor, so centring it never widens the plane.
 */
export function InsertButton({ x, y, placement, onPick }: InsertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasPicked = useRef(false);
  const anchorStyle = { translate: `${x}px ${y}px` };

  function pick(entry: PaletteEntry) {
    hasPicked.current = true;
    setIsOpen(false);
    onPick(entry);
  }

  /** After a pick the focus belongs to the new step, which takes it itself. Without one it goes back to the plus. */
  function returnsFocus() {
    const wasPicked = hasPicked.current;
    hasPicked.current = false;
    return !wasPicked;
  }

  return (
    <span className='absolute top-0 left-0 size-0' style={anchorStyle}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type='button'
              aria-label={`Add a step ${placement}`}
              className='bg-card text-muted-foreground ring-foreground/15 hover:text-foreground hover:ring-foreground/30 focus-visible:ring-ring data-popup-open:bg-primary data-popup-open:text-primary-foreground data-popup-open:ring-primary hairline-ring absolute -top-2 -left-2 flex size-4 cursor-pointer items-center justify-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[color,background-color,box-shadow] duration-150 outline-none after:absolute after:-inset-2 focus-visible:ring-2'
            />
          }
        >
          <PlusIcon className='size-2.5' strokeWidth={2.5} />
        </PopoverTrigger>
        <PopoverContent
          side='right'
          align='start'
          sideOffset={10}
          finalFocus={returnsFocus}
          className='flex max-h-80 w-64 flex-col p-2'
        >
          <Palette
            placement={capitalized(placement)}
            pressed={null}
            onPick={pick}
          />
        </PopoverContent>
      </Popover>
    </span>
  );
}
