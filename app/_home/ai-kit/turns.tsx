'use client';

import { useInView } from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';

import { offscreenAttributeOf } from '@/app/_site/use-offscreen-pause';
import {
  ClockGateContext,
  useDocumentVisible,
} from '@/registry/ndeko/hooks/use-agent-run';
import { AutoplayGateContext } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

type Turns = {
  activeName: string;
  heldName: string | null;
  register: (name: string, element: HTMLElement | null) => void;
  hold: (name: string) => void;
  release: (name: string) => void;
};

const TurnsContext = createContext<Turns | null>(null);

/** A tile hidden at this width (a phone shows fewer) has no box, so its turn is skipped. */
function isShown(element: HTMLElement | undefined) {
  if (!element) {
    return false;
  }
  const boxes = element.getClientRects();
  return boxes.length > 0;
}

function nextShownOf(
  order: readonly string[],
  current: string,
  elements: Map<string, HTMLElement>
) {
  const start = order.indexOf(current);
  for (let step = 1; step <= order.length; step += 1) {
    const index = (start + step) % order.length;
    const name = order[index];
    if (isShown(elements.get(name))) {
      return name;
    }
  }
  return current;
}

type TurnTakingProps = {
  /** The pieces that play a demonstration, in the order they take their turn. */
  order: readonly string[];
  turnMs: number;
  className?: string;
  children: ReactNode;
};

/**
 * Lets the pieces of a section play one at a time instead of all at once: six demonstrations
 * running together cost the main thread far more than one, and draw the eye everywhere at once.
 * The piece under the pointer or the keyboard keeps playing for as long as it is held.
 */
export function TurnTaking({
  order,
  turnMs,
  className,
  children,
}: TurnTakingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.15 });
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = usePrefersReducedMotion();
  const elements = useRef(new Map<string, HTMLElement>());
  const [activeName, setActiveName] = useState(order[0]);
  const [heldName, setHeldName] = useState<string | null>(null);
  const isHeld = heldName !== null;
  const isOnScreen = isInView && isVisible;
  const canRotate = isOnScreen && !shouldReduceMotion;
  const isRotating = canRotate && !isHeld;

  useEffect(() => {
    if (!isRotating) {
      return;
    }
    const timer = setTimeout(() => {
      setActiveName((current) => nextShownOf(order, current, elements.current));
    }, turnMs);
    return () => clearTimeout(timer);
  }, [isRotating, activeName, order, turnMs]);

  const register = useCallback((name: string, element: HTMLElement | null) => {
    if (element) {
      elements.current.set(name, element);
      return;
    }
    elements.current.delete(name);
  }, []);

  const hold = useCallback((name: string) => {
    setHeldName(name);
  }, []);

  const release = useCallback((name: string) => {
    setHeldName((current) => {
      if (current === name) {
        return null;
      }
      return current;
    });
  }, []);

  const turns = useMemo(
    () => ({ activeName, heldName, register, hold, release }),
    [activeName, heldName, register, hold, release]
  );

  return (
    <TurnsContext.Provider value={turns}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </TurnsContext.Provider>
  );
}

function isTurnOf(turns: Turns | null, name: string) {
  if (!turns) {
    return true;
  }
  const isHeldHere = turns.heldName === name;
  if (isHeldHere) {
    return true;
  }
  const isHeldElsewhere = turns.heldName !== null;
  if (isHeldElsewhere) {
    return false;
  }
  return turns.activeName === name;
}

/** The pointer or the focus went to an element still inside the piece. */
function staysInside(event: FocusEvent<HTMLDivElement>) {
  const next = event.relatedTarget;
  const isNode = next instanceof Node;
  return isNode && event.currentTarget.contains(next);
}

type TurnProps = {
  name: string;
  children: ReactNode;
};

/**
 * Opens the gates of one piece while it is its turn: its demonstration steps, its clocks, and its
 * CSS loops, which hold where they are the rest of the time.
 */
export function Turn({ name, children }: TurnProps) {
  const turns = useContext(TurnsContext);
  const isClockAllowed = useContext(ClockGateContext);
  const ref = useRef<HTMLDivElement>(null);
  const isItsTurn = isTurnOf(turns, name);
  const isClockRunning = isClockAllowed && isItsTurn;
  const register = turns?.register;
  const hold = turns?.hold;
  const release = turns?.release;

  useEffect(() => {
    const box = ref.current?.parentElement ?? null;
    register?.(name, box);
    return () => register?.(name, null);
  }, [register, name]);

  function holdHere() {
    hold?.(name);
  }

  function releaseHere() {
    release?.(name);
  }

  function releaseUnlessInside(event: FocusEvent<HTMLDivElement>) {
    if (staysInside(event)) {
      return;
    }
    releaseHere();
  }

  return (
    <AutoplayGateContext.Provider value={isItsTurn}>
      <ClockGateContext.Provider value={isClockRunning}>
        <div
          ref={ref}
          className='contents'
          data-offscreen={offscreenAttributeOf(isItsTurn)}
          onPointerEnter={holdHere}
          onPointerLeave={releaseHere}
          onFocus={holdHere}
          onBlur={releaseUnlessInside}
        >
          {children}
        </div>
      </ClockGateContext.Provider>
    </AutoplayGateContext.Provider>
  );
}
