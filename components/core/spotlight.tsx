'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  motion,
  useSpring,
  useTransform,
  useReducedMotion,
  SpringOptions,
} from 'motion/react';
import { cn } from '@/lib/utils';

export type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
};

function visibilityOf(isHovered: boolean) {
  if (isHovered) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.style.overflow = 'hidden';
        setParentElement(parent);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return;
      const { left, top } = parentElement.getBoundingClientRect();
      const pointerX = event.clientX - left;
      const pointerY = event.clientY - top;
      if (prefersReducedMotion) {
        mouseX.jump(pointerX);
        mouseY.jump(pointerY);
        return;
      }
      mouseX.set(pointerX);
      mouseY.set(pointerY);
    },
    [mouseX, mouseY, parentElement, prefersReducedMotion]
  );

  useEffect(() => {
    if (!parentElement) return;

    const abortController = new AbortController();

    parentElement.addEventListener('mousemove', handleMouseMove, {
      signal: abortController.signal,
    });
    parentElement.addEventListener('mouseenter', () => setIsHovered(true), {
      signal: abortController.signal,
    });
    parentElement.addEventListener('mouseleave', () => setIsHovered(false), {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [parentElement, handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops),transparent_80%)] blur-xl transition-opacity duration-200',
        'from-foreground/20 via-foreground/10 to-foreground/5',
        visibilityOf(isHovered),
        className
      )}
      style={{
        width: size,
        height: size,
        left: spotlightLeft,
        top: spotlightTop,
      }}
    />
  );
}
