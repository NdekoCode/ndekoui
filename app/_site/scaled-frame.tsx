'use client';

import { useInView } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';

import { stillSrcOf } from './still-preview';

const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 800;

/** A page is loaded a little before its tile shows, then kept: scrolling back never loads it twice. */
const NEAR_SCREEN = { once: true, margin: '240px 0px' } as const;

function scaleStyleOf(scale: number) {
  return {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    transform: `scale(${scale})`,
  };
}

/** A page drawn at desktop width, at rest, and shrunk to the width of its tile. */
export function ScaledFrame({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const isNearScreen = useInView(box, NEAR_SCREEN);
  const isMeasured = scale > 0;
  const isLoaded = isMeasured && isNearScreen;

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / FRAME_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      className='bg-background relative aspect-[16/10] overflow-hidden rounded-lg'
    >
      {isLoaded && (
        <iframe
          src={stillSrcOf(src)}
          title={title}
          tabIndex={-1}
          aria-hidden
          className='pointer-events-none absolute top-0 left-0 origin-top-left border-0'
          style={scaleStyleOf(scale)}
        />
      )}
    </div>
  );
}
