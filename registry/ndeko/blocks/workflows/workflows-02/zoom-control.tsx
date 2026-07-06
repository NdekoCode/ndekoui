'use client';

import { MaximizeIcon, MinusIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

import {
  MAX_ZOOM,
  MIN_ZOOM,
  useZoomPercent,
  type CanvasView,
} from './use-pan-zoom';

const ZOOM_STEP = 1.25;

const MIN_PERCENT = Math.round(MIN_ZOOM * 100);

const MAX_PERCENT = Math.round(MAX_ZOOM * 100);

type ZoomControlProps = {
  view: CanvasView;
  /** What Fit brings into view, for its accessible name. */
  subject: string;
};

/** It sits on the canvas and is the only part that renders again while the zoom changes. */
export function ZoomControl({ view, subject }: ZoomControlProps) {
  const percent = useZoomPercent(view);
  const isSmallest = percent <= MIN_PERCENT;
  const isLargest = percent >= MAX_PERCENT;

  return (
    <div
      role='group'
      aria-label='Zoom'
      className='bg-card hairline-ring ring-border absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full p-0.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)]'
    >
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label='Zoom out'
        disabled={isSmallest}
        focusableWhenDisabled
        onClick={() => view.zoomStep(1 / ZOOM_STEP)}
        className='rounded-full'
      >
        <MinusIcon />
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        aria-label={`Zoom ${percent}%. Reset to 100%`}
        onClick={() => view.zoomTo(1)}
        className='w-12 rounded-full px-0 tabular-nums'
      >
        {percent}%
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label='Zoom in'
        disabled={isLargest}
        focusableWhenDisabled
        onClick={() => view.zoomStep(ZOOM_STEP)}
        className='rounded-full'
      >
        <PlusIcon />
      </Button>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Fit ${subject} in view`}
        onClick={() => view.fit()}
        className='rounded-full'
      >
        <MaximizeIcon />
      </Button>
    </div>
  );
}
