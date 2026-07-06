'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { RefObject } from 'react';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import type { Slide } from './data';

export function tabIdOf(base: string, slideId: string) {
  return `${base}-tab-${slideId}`;
}

function rotationLabelOf(isRotating: boolean) {
  if (isRotating) {
    return 'Pause the quotes';
  }
  return 'Play the quotes';
}

/** While the quotes turn, the bar of the current one fills from empty; at rest it is full. */
function fillTransformOf(isRotating: boolean) {
  if (isRotating) {
    return 'scaleX(0)';
  }
  return 'scaleX(1)';
}

function isSlideId(value: unknown, slides: readonly Slide[]) {
  return slides.some((slide) => slide.id === value);
}

type CarouselControlsProps = {
  slides: readonly Slide[];
  activeId: string;
  isRotating: boolean;
  fillRef: RefObject<HTMLSpanElement | null>;
  tabIdBase: string;
  panelId: string;
  onPick: (slideId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRotation: () => void;
};

export function CarouselControls({
  slides,
  activeId,
  isRotating,
  fillRef,
  tabIdBase,
  panelId,
  onPick,
  onPrevious,
  onNext,
  onToggleRotation,
}: CarouselControlsProps) {
  const count = slides.length;
  const fillStyle = { transform: fillTransformOf(isRotating) };

  function pickTab(value: unknown) {
    if (isSlideId(value, slides)) {
      onPick(String(value));
    }
  }

  return (
    <div className='flex items-center gap-1'>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={rotationLabelOf(isRotating)}
        onClick={onToggleRotation}
        className='text-muted-foreground'
      >
        <Swap swapKey={String(isRotating)}>
          {isRotating && <PauseIcon />}
          {!isRotating && <PlayIcon />}
        </Swap>
      </Button>
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        aria-label='Show the previous quote'
        onClick={onPrevious}
      >
        <ChevronLeftIcon />
      </Button>
      <TabsPrimitive.Root value={activeId} onValueChange={pickTab}>
        <TabsPrimitive.List
          activateOnFocus
          aria-label='Choose a quote'
          className='flex items-center px-1'
        >
          {slides.map((slide, index) => {
            const isActive = slide.id === activeId;
            const position = index + 1;

            return (
              <TabsPrimitive.Tab
                key={slide.id}
                value={slide.id}
                id={tabIdOf(tabIdBase, slide.id)}
                aria-controls={panelId}
                aria-label={`Quote ${position} of ${count}, ${slide.person.name}`}
                className='group/dot focus-visible:ring-ring focus-visible:ring-offset-background flex h-8 cursor-pointer items-center rounded-full px-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
              >
                <span className='bg-foreground/15 group-hover/dot:bg-foreground/25 group-data-active/dot:bg-foreground/20 relative h-1 w-6 overflow-hidden rounded-full transition-colors duration-150'>
                  {isActive && (
                    <span
                      ref={fillRef}
                      style={fillStyle}
                      className='bg-foreground absolute inset-0 origin-left rounded-full'
                    />
                  )}
                </span>
              </TabsPrimitive.Tab>
            );
          })}
        </TabsPrimitive.List>
      </TabsPrimitive.Root>
      <Button
        type='button'
        variant='outline'
        size='icon-sm'
        aria-label='Show the next quote'
        onClick={onNext}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
