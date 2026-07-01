'use client';

import { useLayoutEffect, useState, type CSSProperties } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

type LiveFrameProps = {
  src: string;
  title: string;
  frameWidth: number;
  frameHeight: number;
  className?: string;
};

function frameStyleOf(
  frameWidth: number,
  frameHeight: number,
  scale: number
): CSSProperties {
  return {
    width: frameWidth,
    height: frameHeight,
    transform: `scale(${scale})`,
  };
}

/** A page drawn at a fixed screen size and shrunk to the width of its box. */
export function LiveFrame({
  src,
  title,
  frameWidth,
  frameHeight,
  className,
}: LiveFrameProps) {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);
  const isMeasured = scale > 0;

  useLayoutEffect(() => {
    if (!box) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setScale(width / frameWidth);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [box, frameWidth]);

  return (
    <div
      ref={setBox}
      className={cn('bg-background relative overflow-hidden', className)}
    >
      {isMeasured && (
        <iframe
          src={src}
          title={title}
          loading='lazy'
          tabIndex={-1}
          aria-hidden
          className='pointer-events-none absolute top-0 left-0 origin-top-left border-0'
          style={frameStyleOf(frameWidth, frameHeight, scale)}
        />
      )}
    </div>
  );
}
