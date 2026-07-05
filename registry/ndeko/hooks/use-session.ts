'use client';

import { useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';

export type SessionStep<State, Action> = {
  /** Milliseconds after the previous step. */
  after: number;
  action: Action;
  /**
   * Who does it. The agent's steps always play. A demo step plays only until a person takes over.
   * A person step is done by the demonstration after its delay, and waits for the person once they
   * have taken over.
   */
  by?: 'agent' | 'demo' | 'person';
  /** For a person step: true once the person has done it themselves. */
  isAnswered?: (state: State) => boolean;
  /** The control the demonstration presses for this step. */
  press?: string;
};

export type SessionConfig<State, Action> = {
  reducer: (state: State, action: Action) => State;
  initial: State;
  /** What the block shows under reduced motion, where nothing plays. */
  resting: State;
  script: readonly SessionStep<State, Action>[];
  loopAfter: number;
  /** While it returns true the agent's steps wait: a pause, or a person who took the controls. */
  holdWhile?: (state: State) => boolean;
};

type Engine<State> = {
  state: State;
  cursor: number;
  round: number;
};

type Plan = 'play' | 'skip' | 'wait' | 'loop' | 'stop';

type Pending = {
  key: string;
  remaining: number;
  scheduledAt: number;
};

type Timer = ReturnType<typeof setTimeout>;

/** A finger goes down before the click lands. */
const PRESS_LEAD_MS = 140;

function planOfPersonStep(isAutoplaying: boolean, isAnswered: boolean): Plan {
  if (isAnswered) {
    return 'skip';
  }
  if (isAutoplaying) {
    return 'play';
  }
  return 'wait';
}

function planOfDemoStep(isAutoplaying: boolean): Plan {
  if (isAutoplaying) {
    return 'play';
  }
  return 'skip';
}

function planOfEnd(isAutoplaying: boolean): Plan {
  if (isAutoplaying) {
    return 'loop';
  }
  return 'stop';
}

function planOfAgentStep(isHeld: boolean): Plan {
  if (isHeld) {
    return 'wait';
  }
  return 'play';
}

function planOf<State, Action>(
  step: SessionStep<State, Action> | undefined,
  isAutoplaying: boolean,
  isAnswered: boolean,
  isHeld: boolean
): Plan {
  if (!step) {
    return planOfEnd(isAutoplaying);
  }
  if (step.by === 'person') {
    return planOfPersonStep(isAutoplaying, isAnswered);
  }
  if (step.by === 'demo') {
    return planOfDemoStep(isAutoplaying);
  }
  return planOfAgentStep(isHeld);
}

function neverHold() {
  return false;
}

function delayOf(plan: Plan, stepAfter: number, loopAfter: number) {
  if (plan === 'loop') {
    return loopAfter;
  }
  if (plan === 'skip') {
    return 0;
  }
  return stepAfter;
}

function remainingOf(saved: Pending | null, key: string, delay: number) {
  if (saved?.key === key) {
    return saved.remaining;
  }
  return delay;
}

function skipped<State>(engine: Engine<State>): Engine<State> {
  return { ...engine, cursor: engine.cursor + 1 };
}

/**
 * Plays a scripted session into a reducer while the block is on screen. The agent's part always
 * plays; the person's part is demonstrated until the first click or key, then waits for the person.
 */
export function useSession<State, Action>({
  reducer,
  initial,
  resting,
  script,
  loopAfter,
  holdWhile = neverHold,
}: SessionConfig<State, Action>) {
  const autoplay = useAutoplay([]);
  const isVisible = useDocumentVisible();
  const shouldReduceMotion = useReducedMotion();
  const [engine, setEngine] = useState<Engine<State>>({
    state: initial,
    cursor: 0,
    round: 0,
  });
  const [pressed, setPressed] = useState<string | null>(null);
  const pending = useRef<Pending | null>(null);
  const { isAutoplaying, isInView } = autoplay;
  const restartAutoplay = autoplay.restart;
  const step = script[engine.cursor];
  const isAnswered = step?.isAnswered?.(engine.state) ?? false;
  const isHeld = holdWhile(engine.state);
  const plan = planOf(step, isAutoplaying, isAnswered, isHeld);
  const isOnScreen = isInView && isVisible;
  const waitKey = `${engine.round}:${engine.cursor}:${plan}`;
  const restingCursor = script.length;

  useEffect(() => {
    if (!shouldReduceMotion) {
      return;
    }
    const timer = setTimeout(() => {
      setEngine({ state: resting, cursor: restingCursor, round: 0 });
    }, 0);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion, resting, restingCursor]);

  useEffect(() => {
    const isIdle = plan === 'wait' || plan === 'stop';
    if (!isOnScreen || isIdle) {
      return;
    }
    const stepAfter = step?.after ?? 0;
    const delay = delayOf(plan, stepAfter, loopAfter);
    const remaining = remainingOf(pending.current, waitKey, delay);
    pending.current = { key: waitKey, remaining, scheduledAt: Date.now() };
    let pressTimer: Timer | undefined;

    function restarted(current: Engine<State>): Engine<State> {
      return { state: initial, cursor: 0, round: current.round + 1 };
    }

    function play(action: Action) {
      setEngine((current) => ({
        ...current,
        state: reducer(current.state, action),
        cursor: current.cursor + 1,
      }));
    }

    function fire() {
      pending.current = null;
      if (plan === 'loop') {
        setEngine(restarted);
        return;
      }
      if (plan === 'skip' || !step) {
        setEngine(skipped);
        return;
      }
      const action = step.action;
      const pressKey = step.press;
      const shouldPress = isAutoplaying && pressKey !== undefined;
      if (!shouldPress) {
        play(action);
        return;
      }
      setPressed(pressKey);
      pressTimer = setTimeout(() => {
        pressTimer = undefined;
        setPressed(null);
        play(action);
      }, PRESS_LEAD_MS);
    }

    const timer = setTimeout(fire, remaining);

    return () => {
      clearTimeout(timer);
      const wasPressing = pressTimer !== undefined;
      if (wasPressing) {
        clearTimeout(pressTimer);
        pending.current = { key: waitKey, remaining: 0, scheduledAt: 0 };
        return;
      }
      const saved = pending.current;
      if (!saved) {
        return;
      }
      const spent = Date.now() - saved.scheduledAt;
      const left = Math.max(0, saved.remaining - spent);
      pending.current = { ...saved, remaining: left };
    };
  }, [
    isOnScreen,
    plan,
    step,
    waitKey,
    loopAfter,
    isAutoplaying,
    reducer,
    initial,
  ]);

  const act = useCallback(
    (action: Action) => {
      setEngine((current) => ({
        ...current,
        state: reducer(current.state, action),
      }));
    },
    [reducer]
  );

  const restart = useCallback(() => {
    pending.current = null;
    setPressed(null);
    setEngine((current) => ({
      state: initial,
      cursor: 0,
      round: current.round + 1,
    }));
    restartAutoplay();
  }, [initial, restartAutoplay]);

  return {
    ref: autoplay.ref,
    isInView,
    isAutoplaying,
    state: engine.state,
    act,
    pressed,
    isFinished: step === undefined,
    restart,
  };
}
