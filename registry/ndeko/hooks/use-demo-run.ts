'use client';

import { useInView } from 'motion/react';
import { useRef, useState } from 'react';

import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import type { RunSnapshot } from '@/registry/ndeko/lib/agent-run';

type DemoRunOptions = {
  initial: RunSnapshot;
  /** While it returns true (a request waits on a person), the script holds its place. Keep it at module level. */
  holdWhile?: (snapshot: RunSnapshot) => boolean;
  loopAfter?: number;
};

function neverHold() {
  return false;
}

export function useDemoRun<Element extends HTMLElement = HTMLDivElement>(
  script: RunScriptStep[],
  { initial, holdWhile = neverHold, loopAfter }: DemoRunOptions
) {
  const ref = useRef<Element>(null);
  const isInView = useInView(ref, { amount: 0.3 });
  const [isHeld, setIsHeld] = useState(false);
  const isActive = isInView && !isHeld;
  const run = useRunScript(script, { initial, isActive, loopAfter });
  const shouldHold = holdWhile(run.snapshot);
  if (shouldHold !== isHeld) {
    setIsHeld(shouldHold);
  }
  return { ref, isInView, ...run };
}
