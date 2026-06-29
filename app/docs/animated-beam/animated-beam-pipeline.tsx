'use client';

import { useRef } from 'react';

import { AnimatedBeam, BeamNode } from '@/components/core/animated-beam';
import {
  BellIcon,
  CpuIcon,
  DatabaseIcon,
  UploadIcon,
} from '@/registry/ndeko/lib/icons';

const STEP_DURATION = 1.4;

const SECOND_STEP_DELAY = STEP_DURATION;

const THIRD_STEP_DELAY = STEP_DURATION * 2;

const RELAY_PAUSE = STEP_DURATION * 2;

export function AnimatedBeamPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      role='img'
      aria-label='A file is uploaded, processed, stored, then a notification goes out'
      className='relative flex w-full max-w-md items-center justify-between px-2 py-10'
    >
      <BeamNode ref={uploadRef} size='sm'>
        <UploadIcon />
      </BeamNode>
      <BeamNode ref={processRef} size='sm'>
        <CpuIcon />
      </BeamNode>
      <BeamNode ref={storeRef} size='sm'>
        <DatabaseIcon />
      </BeamNode>
      <BeamNode ref={notifyRef} material='gem' size='sm'>
        <BellIcon />
      </BeamNode>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={uploadRef}
        toRef={processRef}
        duration={STEP_DURATION}
        repeatDelay={RELAY_PAUSE}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={processRef}
        toRef={storeRef}
        duration={STEP_DURATION}
        delay={SECOND_STEP_DELAY}
        repeatDelay={RELAY_PAUSE}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={storeRef}
        toRef={notifyRef}
        duration={STEP_DURATION}
        delay={THIRD_STEP_DELAY}
        repeatDelay={RELAY_PAUSE}
      />
    </div>
  );
}
