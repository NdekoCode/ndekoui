'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { createGlyphField, type GlyphFieldEngine } from './glyph-engine';
import type { Point } from './session';

type GlyphFieldProps = {
  hostRef: RefObject<HTMLElement | null>;
  isActive: boolean;
  demoLens: Point | null;
  demoRipples: number;
};

/**
 * The field of glyphs behind the content of `hostRef`. It takes its colour and its mono face from
 * the classes of the canvas, draws only while it is in view, and holds one still frame under
 * reduced motion. It is decoration: nothing in it is read aloud.
 */
export function GlyphField({
  hostRef,
  isActive,
  demoLens,
  demoRipples,
}: GlyphFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GlyphFieldEngine | null>(null);
  const seenRipples = useRef(demoRipples);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isLive = isActive && !shouldReduceMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) {
      return;
    }
    const engine = createGlyphField(canvas, host);
    engineRef.current = engine;
    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, [hostRef]);

  useEffect(() => {
    engineRef.current?.setLive(isLive);
  }, [isLive]);

  useEffect(() => {
    engineRef.current?.aimDemo(demoLens);
  }, [demoLens]);

  useEffect(() => {
    const hasNewRipple = demoRipples > seenRipples.current;
    seenRipples.current = demoRipples;
    if (hasNewRipple) {
      engineRef.current?.rippleDemo();
    }
  }, [demoRipples]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className='text-muted-foreground pointer-events-none absolute inset-0 size-full font-mono'
    />
  );
}
