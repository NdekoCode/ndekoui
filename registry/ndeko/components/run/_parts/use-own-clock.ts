'use client';

import { useEffect, useRef } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

type ClockGate = {
  isInView: boolean;
  isAutoplaying: boolean;
  /** True once a person pressed one of the controls: under reduced motion the piece then runs for real. */
  isHandled: boolean;
};

/**
 * The demonstration plays the first round through its script. From the moment a person takes over,
 * or presses a control under reduced motion, the piece runs on its own clock instead, so a
 * countdown or a job they started always reaches its end.
 */
export function useIsOwnClockOn({
  isInView,
  isAutoplaying,
  isHandled,
}: ClockGate) {
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isSeen = isInView && isVisible;
  const hasTakenOver = !isAutoplaying;
  const mayRun = !shouldReduceMotion || isHandled;
  return isSeen && hasTakenOver && mayRun;
}

/** Calls the latest `onTick` every `intervalMs` while `isOn`, and holds still otherwise. */
export function useInterval(
  onTick: () => void,
  intervalMs: number,
  isOn: boolean
) {
  const latest = useRef(onTick);

  useEffect(() => {
    latest.current = onTick;
  });

  useEffect(() => {
    if (!isOn) {
      return;
    }
    const timer = setInterval(() => latest.current(), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, isOn]);
}

/** Calls the latest `onElapse` once, `delayMs` after `isOn` turns true. */
export function useTimeout(
  onElapse: () => void,
  delayMs: number,
  isOn: boolean
) {
  const latest = useRef(onElapse);

  useEffect(() => {
    latest.current = onElapse;
  });

  useEffect(() => {
    if (!isOn) {
      return;
    }
    const timer = setTimeout(() => latest.current(), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, isOn]);
}
