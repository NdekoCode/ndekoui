'use client';
import { TextLoop } from '@/components/core/text-loop';
import { HeadphonesIcon } from '@/registry/ndeko/lib/icons';
import { useState } from 'react';

function directionOf(index: number) {
  if (index === 0) {
    return -1;
  }
  return 1;
}

export function TextLoopOnIndexChange() {
  const [direction, setDirection] = useState(-1);

  return (
    <TextLoop
      className='text-foreground text-sm'
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 19,
        mass: 1.2,
      }}
      interval={2.5}
      onIndexChange={(index) => {
        setDirection(directionOf(index));
      }}
      variants={{
        initial: {
          y: -direction * 20,
          rotateX: -direction * 90,
          opacity: 0,
          filter: 'blur(4px)',
        },
        animate: {
          y: 0,
          rotateX: 0,
          opacity: 1,
          filter: 'blur(0px)',
        },
        exit: {
          y: -direction * 20,
          rotateX: -direction * 90,
          opacity: 0,
          filter: 'blur(4px)',
        },
      }}
    >
      <span>
        <HeadphonesIcon className='mr-1 inline-block size-3' />
        Morning tide・The Harbor Lane Trio
      </span>
      <span>La Trinité, Martinique</span>
    </TextLoop>
  );
}
