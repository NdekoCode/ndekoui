'use client';

import { useLayoutEffect, useState } from 'react';

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 800;

function scaleStyleOf(scale: number) {
  return {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    transform: `scale(${scale})`,
  };
}

/** A live page drawn at desktop width and shrunk to the width of its tile. */
export function ScaledFrame({ src, title }: { src: string; title: string }) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);
  const isMeasured = scale > 0;

  useLayoutEffect(() => {
    if (!box) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / FRAME_WIDTH);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [box]);

  return (
    <div
      ref={setBox}
      className='bg-background relative aspect-[16/10] overflow-hidden rounded-lg'
    >
      {isMeasured && (
        <iframe
          src={src}
          title={title}
          loading='lazy'
          tabIndex={-1}
          aria-hidden
          className='pointer-events-none absolute top-0 left-0 origin-top-left border-0'
          style={scaleStyleOf(scale)}
        />
      )}
    </div>
  );
}
