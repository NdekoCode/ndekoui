'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import type { StatusId, Task } from './data';

const MOVE_DELAY_MS = 450;

type HeldPlacements = Record<string, StatusId>;

function withoutKey(placements: HeldPlacements, taskId: string) {
  const next = { ...placements };
  delete next[taskId];
  return next;
}

function heldOnce(
  placements: HeldPlacements,
  taskId: string,
  status: StatusId
): HeldPlacements {
  if (placements[taskId]) {
    return placements;
  }
  return { ...placements, [taskId]: status };
}

export function useDelayedPlacement() {
  const shouldReduceMotion = useReducedMotion();
  const [held, setHeld] = useState<HeldPlacements>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function release(taskId: string) {
    timers.current.delete(taskId);
    setHeld((current) => withoutKey(current, taskId));
  }

  function hold(taskId: string, previousStatus: StatusId) {
    if (shouldReduceMotion) {
      return;
    }
    const existing = timers.current.get(taskId);
    if (existing) {
      clearTimeout(existing);
    }
    setHeld((current) => heldOnce(current, taskId, previousStatus));
    const timer = setTimeout(() => release(taskId), MOVE_DELAY_MS);
    timers.current.set(taskId, timer);
  }

  function placementOf(task: Task) {
    return held[task.id] ?? task.status;
  }

  return { hold, placementOf };
}
