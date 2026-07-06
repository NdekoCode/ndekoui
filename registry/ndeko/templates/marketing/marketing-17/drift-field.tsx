'use client';

import { useInView } from 'motion/react';
import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

type Point = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

const POINT_COUNT = 16;

const FRAME_MS = 33;

const MAX_PIXEL_RATIO = 2;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function between(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

function signedBetween(random: () => number, min: number, max: number) {
  const direction = Math.sign(random() - 0.5) || 1;
  return direction * between(random, min, max);
}

function createPoints() {
  const random = createRandom(2718);
  return Array.from({ length: POINT_COUNT }, (): Point => ({
    x: random(),
    y: random(),
    vx: signedBetween(random, 0.004, 0.012),
    vy: signedBetween(random, 0.003, 0.009),
    radius: between(random, 1.2, 2.6),
    alpha: between(random, 0.35, 0.8),
  }));
}

function wrapped(value: number) {
  return ((value % 1) + 1) % 1;
}

function move(points: Point[], seconds: number) {
  for (const point of points) {
    point.x = wrapped(point.x + point.vx * seconds);
    point.y = wrapped(point.y + point.vy * seconds);
  }
}

function paint(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  height: number,
  color: string
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = color;
  for (const point of points) {
    context.globalAlpha = point.alpha;
    context.beginPath();
    context.arc(
      point.x * width,
      point.y * height,
      point.radius,
      0,
      Math.PI * 2
    );
    context.fill();
  }
  context.globalAlpha = 1;
}

export function DriftField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const isInView = useInView(canvasRef);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isMoving = isInView && !shouldReduceMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }
    if (pointsRef.current.length === 0) {
      pointsRef.current = createPoints();
    }
    const points = pointsRef.current;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;

    function draw() {
      if (!canvas || !context) {
        return;
      }
      const color = getComputedStyle(canvas).color;
      paint(context, points, width, height, color);
    }

    function resize() {
      if (!canvas || !context) {
        return;
      }
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw();
    }

    function tick(time: number) {
      frame = requestAnimationFrame(tick);
      const elapsed = time - lastTime;
      if (elapsed < FRAME_MS) {
        return;
      }
      lastTime = time;
      move(points, Math.min(elapsed, 100) / 1000);
      draw();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (isMoving) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isMoving]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className='text-foreground pointer-events-none absolute inset-0 size-full'
    />
  );
}
