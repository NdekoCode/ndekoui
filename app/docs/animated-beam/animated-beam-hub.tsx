'use client';

import { useRef } from 'react';

import { AnimatedBeam, BeamNode } from '@/components/core/animated-beam';
import {
  CalendarIcon,
  DatabaseIcon,
  LayersIcon,
  MailIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';

export function AnimatedBeamHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const databaseRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const personRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      role='img'
      aria-label='Mail, calendar and database sources flow into one workspace, which feeds one person'
      className='relative flex w-full max-w-md items-center justify-between px-2 py-6'
    >
      <div className='flex flex-col gap-8'>
        <BeamNode ref={mailRef}>
          <MailIcon />
        </BeamNode>
        <BeamNode ref={calendarRef}>
          <CalendarIcon />
        </BeamNode>
        <BeamNode ref={databaseRef}>
          <DatabaseIcon />
        </BeamNode>
      </div>
      <BeamNode ref={hubRef} material='gem' size='lg'>
        <LayersIcon />
      </BeamNode>
      <BeamNode ref={personRef}>
        <UserIcon />
      </BeamNode>
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={mailRef}
        toRef={hubRef}
        curvature={-30}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={calendarRef}
        toRef={hubRef}
        delay={0.4}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={databaseRef}
        toRef={hubRef}
        curvature={30}
        delay={0.8}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={hubRef}
        toRef={personRef}
        delay={1.6}
      />
    </div>
  );
}
