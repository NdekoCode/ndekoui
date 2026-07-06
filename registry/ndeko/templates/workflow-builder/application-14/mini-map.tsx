'use client';

import { memo, useEffect, useRef } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

import { ARROW_OFFSET } from './canvas-frame';
import type { Box, FlowLayout } from './layout';
import type { Run, StepStatus } from './run';
import type { Viewport } from './use-viewport';
import type { View } from './viewport';

const MAP_WIDTH = 168;

const MAP_HEIGHT = 128;

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  view: View;
};

function toneOf(isSelected: boolean, status: StepStatus | undefined) {
  if (isSelected) {
    return 'bg-primary';
  }
  if (status === 'skipped') {
    return 'bg-foreground/10';
  }
  const isAtWork = status === 'running' || status === 'retrying';
  if (isAtWork) {
    return 'bg-primary/60';
  }
  return 'bg-foreground/25';
}

type MapStepProps = {
  box: Box;
  scale: number;
  tone: string;
};

function MapStep({ box, scale, tone }: MapStepProps) {
  const left = box.x * scale;
  const top = box.y * scale;
  const style = {
    translate: `${left}px ${top}px`,
    width: box.width * scale,
    height: box.height * scale,
  };

  return (
    <span
      style={style}
      className={cn(
        'absolute top-0 left-0 rounded-[2px] transition-[translate,background-color] duration-300 ease-(--ease-out-strong)',
        tone
      )}
    />
  );
}

type MiniMapProps = {
  layout: FlowLayout;
  viewport: Viewport;
  run: Run;
  selectedId: string | null;
  className?: string;
};

/**
 * The whole flow as small rectangles, with the part the canvas shows as a frame. The frame is
 * written to straight from the view, and dragging it pans the canvas.
 */
export const MiniMap = memo(function MiniMap({
  layout,
  viewport,
  run,
  selectedId,
  className,
}: MiniMapProps) {
  const { store, show, panBy } = viewport;
  const frameRef = useRef<HTMLButtonElement>(null);
  const latestViewport = useRef(viewport);
  const drag = useRef<Drag | null>(null);
  const scaleAcross = MAP_WIDTH / layout.width;
  const scaleDown = MAP_HEIGHT / layout.height;
  const scale = Math.min(scaleAcross, scaleDown);
  const mapStyle = {
    width: layout.width * scale,
    height: layout.height * scale,
  };

  useEffect(() => {
    latestViewport.current = viewport;
  });

  /** A pan only moves the frame. Its size is written again when the zoom or the canvas changes size, never on each frame of a drag. */
  useEffect(() => {
    let writtenSize = '';
    function place() {
      const frame = frameRef.current;
      if (!frame) {
        return;
      }
      const view = store.get();
      const size = latestViewport.current.frameSizeOf();
      const ratio = scale / view.zoom;
      const left = -view.x * ratio;
      const top = -view.y * ratio;
      const width = size.width * ratio;
      const height = size.height * ratio;
      const nextSize = `${width} ${height}`;
      frame.style.transform = `translate(${left}px, ${top}px)`;
      if (nextSize === writtenSize) {
        return;
      }
      writtenSize = nextSize;
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
    }
    place();
    return store.subscribe(place);
  }, [store, scale]);

  function startDrag(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      view: store.rest(),
    };
  }

  /** A move of the frame on the map is the opposite move of the plane, at the size the plane shows. */
  function dragFrame(event: React.PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (current?.pointerId !== event.pointerId) {
      return;
    }
    const ratio = current.view.zoom / scale;
    const offsetX = (event.clientX - current.startX) * ratio;
    const offsetY = (event.clientY - current.startY) * ratio;
    show({
      x: current.view.x - offsetX,
      y: current.view.y - offsetY,
      zoom: current.view.zoom,
    });
  }

  function endDrag() {
    drag.current = null;
  }

  function panFromKeys(event: React.KeyboardEvent<HTMLButtonElement>) {
    const offset = ARROW_OFFSET[event.key];
    if (offset) {
      event.preventDefault();
      panBy(offset.x, offset.y);
    }
  }

  return (
    <div
      data-solid
      data-canvas-overlay='map'
      className={cn(
        'bg-card hairline-ring ring-border pointer-events-auto rounded-xl p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='relative overflow-hidden' style={mapStyle}>
        {layout.boxes.map((box) => (
          <MapStep
            key={box.id}
            box={box}
            scale={scale}
            tone={toneOf(box.id === selectedId, run.steps[box.id]?.status)}
          />
        ))}
        <button
          ref={frameRef}
          type='button'
          aria-label='The part of the flow in view. Drag it, or use the arrow keys, to move the canvas'
          onPointerDown={startDrag}
          onPointerMove={dragFrame}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={panFromKeys}
          className='bg-primary/10 ring-primary/60 focus-visible:ring-primary absolute top-0 left-0 cursor-grab touch-none rounded-[3px] ring-1 outline-none ring-inset focus-visible:ring-2 active:cursor-grabbing'
        />
      </div>
    </div>
  );
});
