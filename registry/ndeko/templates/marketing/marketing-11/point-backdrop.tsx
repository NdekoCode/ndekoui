'use client';

import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { mountStage } from './canvas-stage';
import { createPointScene, type StopSpec } from './point-field';

const PULSE_EVERY_MS = 7000;

const TOP_OF_PAGE_SHARE = 0.4;

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
    if (!stage || shouldReduceMotion) {
      return () => stage?.dispose();
    }
    let isTakenOver = false;

    function takeOver() {
      isTakenOver = true;
    }

    function pulseAtTheTop() {
      const isTopShown =
        window.scrollY < window.innerHeight * TOP_OF_PAGE_SHARE;
      const isShowing = stage?.isShowing() ?? false;
      const isIdle = !isTakenOver;
      const canPlay = isIdle && isTopShown && isShowing;
      if (canPlay) {
        scene.pulse();
        stage?.wake();
      }
    }

    const timer = setInterval(pulseAtTheTop, PULSE_EVERY_MS);
    window.addEventListener('pointerdown', takeOver, true);
    window.addEventListener('keydown', takeOver, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pointerdown', takeOver, true);
      window.removeEventListener('keydown', takeOver, true);
      stage.dispose();
    };
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
