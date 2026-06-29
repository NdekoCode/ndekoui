'use client';

import { useState } from 'react';

import {
  DirectionalDrawer,
  DirectionalDrawerContent,
  DirectionalDrawerDescription,
  DirectionalDrawerHeader,
  DirectionalDrawerTitle,
  type DrawerSide,
} from '@/components/core/directional-drawer';
import { Button } from '@/registry/ndeko/ui/button';

const SIDES: DrawerSide[] = ['top', 'right', 'bottom', 'left'];

const SIDE_NAMES: Record<DrawerSide, string> = {
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
};

export function DirectionalDrawerSides() {
  const [side, setSide] = useState<DrawerSide>('right');
  const [open, setOpen] = useState(false);

  function openFrom(nextSide: DrawerSide) {
    setSide(nextSide);
    setOpen(true);
  }

  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      {SIDES.map((option) => (
        <Button
          key={option}
          type='button'
          variant='outline'
          aria-haspopup='dialog'
          onClick={() => openFrom(option)}
        >
          {SIDE_NAMES[option]}
        </Button>
      ))}
      <DirectionalDrawer open={open} onOpenChange={setOpen}>
        <DirectionalDrawerContent side={side}>
          <DirectionalDrawerHeader>
            <DirectionalDrawerTitle>
              {SIDE_NAMES[side]} drawer
            </DirectionalDrawerTitle>
            <DirectionalDrawerDescription>
              Drag it back toward its edge to close it. A quick flick is enough,
              and pulling the other way only gives a little.
            </DirectionalDrawerDescription>
          </DirectionalDrawerHeader>
        </DirectionalDrawerContent>
      </DirectionalDrawer>
    </div>
  );
}
