'use client';

import { useRef } from 'react';

import { AnimatedBeam, BeamNode } from '@/components/core/animated-beam';
import { ServerIcon, SmartphoneIcon } from '@/registry/ndeko/lib/icons';

export function AnimatedBeamSync() {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      role='img'
      aria-label='A phone and a server send changes to each other'
      className='relative flex w-full max-w-sm items-center justify-between px-2 py-12'
    >
      <BeamNode ref={phoneRef} size='lg'>
        <SmartphoneIcon />
      </BeamNode>
      <BeamNode ref={serverRef} size='lg'>
        <ServerIcon />
      </BeamNode>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={phoneRef}
        toRef={serverRef}
        curvature={-36}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={phoneRef}
        toRef={serverRef}
        curvature={36}
        reverse
        delay={1.5}
      />
    </div>
  );
}
