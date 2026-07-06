'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { mountStage } from './canvas-stage';
import { createPointScene, type StopSpec } from './point-field';

type PointBackdropProps = {
  stops: readonly StopSpec[];
};

export function PointBackdrop({ stops }: PointBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const scene = createPointScene(stops);
    const stage = mountStage(canvas, scene, { isStill: shouldReduceMotion });
    return () => stage?.dispose();
  }, [stops, shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      style={{ color: 'var(--primary)' }}
      className='decoration-foreground pointer-events-none fixed inset-0 z-0 size-full'
    />
  );
}
