'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import type { Point } from './math';
import { mountStage, type Scene, type Stage } from './stage';

export type StageHandle = {
  /** Something outside the loop changed the scene: it is drawn again, and its loop is woken. */
  refresh: () => void;
  /** Where the centre of an element sits on the canvas, or null when it is outside. */
  centreOf: (element: Element) => Point | null;
};

type StageCanvasProps = {
  scene: Scene;
  hue: string;
  isInteractive?: boolean;
  className?: string;
  handleRef?: Ref<StageHandle>;
};

/**
 * The one canvas of a background. It fills its parent, lets every pointer event through and is
 * hidden from assistive technology, since it is decoration. A canvas cannot take a colour from a
 * class: the hue rides on its `color` and the neutral of lines on `decoration-foreground`, and the
 * stage reads both from the computed style. No transition may sit on those two, or the stage
 * would read a colour halfway through it.
 */
export function StageCanvas({
  scene,
  hue,
  isInteractive = false,
  className,
  handleRef,
}: StageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const mounted = mountStage(canvas, scene, {
      isStill: shouldReduceMotion,
      isInteractive,
    });
    stage.current = mounted;
    return () => {
      mounted?.dispose();
      stage.current = null;
    };
  }, [scene, isInteractive, shouldReduceMotion]);

  useEffect(() => {
    stage.current?.reink();
  }, [hue]);

  useImperativeHandle(
    handleRef,
    () => ({
      refresh: () => stage.current?.refresh(),
      centreOf: (element) => stage.current?.centreOf(element) ?? null,
    }),
    []
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      style={{ color: hue }}
      className={cn(
        'decoration-foreground pointer-events-none absolute inset-0 size-full',
        className
      )}
    />
  );
}
