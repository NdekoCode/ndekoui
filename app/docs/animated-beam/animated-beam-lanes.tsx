'use client';

import { useRef } from 'react';

import { AnimatedBeam, BeamNode } from '@/components/core/animated-beam';
import { MonitorIcon, ServerIcon } from '@/registry/ndeko/lib/icons';

const NODE_HALF_WIDTH = 32;

const LANE_OFFSET = 10;

export function AnimatedBeamLanes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      role='img'
      aria-label='An app sends a request to the server on the upper lane and gets the answer back on the lower lane'
      className='relative flex w-full max-w-sm items-center justify-between px-2 py-12'
    >
      <BeamNode ref={appRef} size='lg'>
        <MonitorIcon />
      </BeamNode>
      <BeamNode ref={apiRef} size='lg' material='gem'>
        <ServerIcon />
      </BeamNode>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={appRef}
        toRef={apiRef}
        startXOffset={NODE_HALF_WIDTH}
        endXOffset={-NODE_HALF_WIDTH}
        startYOffset={-LANE_OFFSET}
        endYOffset={-LANE_OFFSET}
        duration={2}
        repeatDelay={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={appRef}
        toRef={apiRef}
        startXOffset={NODE_HALF_WIDTH}
        endXOffset={-NODE_HALF_WIDTH}
        startYOffset={LANE_OFFSET}
        endYOffset={LANE_OFFSET}
        duration={2}
        repeatDelay={2}
        delay={2}
        reverse
      />
    </div>
  );
}
