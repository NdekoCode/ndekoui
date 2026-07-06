'use client';

import { useCallback, useLayoutEffect, useReducer } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

type DeckDirection = 1 | -1;

type DeckState = {
  front: number;
  /** The card held out of the deck for a moment: the one that left the front, or the one about to come back to it. */
  out: number | null;
  /** The out card waits in its pose, then comes back to the front from there. */
  isReturning: boolean;
};

type DeckAction =
  | { type: 'leave'; count: number }
  | { type: 'summon'; count: number }
  | { type: 'jump'; direction: DeckDirection; count: number }
  | { type: 'land' };

const RESTING: DeckState = { front: 0, out: null, isReturning: false };

/** An index that runs past either end of a list comes back in at the other end. */
export function wrapIndex(index: number, count: number) {
  if (count <= 0) {
    return 0;
  }
  const remainder = index % count;
  const positive = remainder + count;
  return positive % count;
}

/** How many cards sit in front of this one: 0 for the front card. */
export function depthOf(index: number, front: number, count: number) {
  const behind = index - front;
  return wrapIndex(behind, count);
}

function landed(deck: DeckState): DeckState {
  if (deck.out === null) {
    return deck;
  }
  if (deck.isReturning) {
    return { front: deck.out, out: null, isReturning: false };
  }
  return { front: deck.front, out: null, isReturning: false };
}

function reduceDeck(deck: DeckState, action: DeckAction): DeckState {
  const settled = landed(deck);
  if (action.type === 'land') {
    return settled;
  }
  if (action.type === 'jump') {
    const stepped = settled.front + action.direction;
    const front = wrapIndex(stepped, action.count);
    return { front, out: null, isReturning: false };
  }
  if (action.type === 'leave') {
    const stepped = settled.front + 1;
    const front = wrapIndex(stepped, action.count);
    return { front, out: settled.front, isReturning: false };
  }
  const before = settled.front - 1;
  const out = wrapIndex(before, action.count);
  return { front: settled.front, out, isReturning: true };
}

/**
 * A deck that turns one card at a time. Going forward, the front card is held out while the others
 * step up, then it joins the back. Going back, the last card is placed out first and comes to the
 * front from there. Each piece draws the out pose its own way: dropped, swung aside.
 */
export function useDeck(count: number, leaveMs: number) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [deck, dispatch] = useReducer(reduceDeck, RESTING);
  const { schedule, clearAll } = useTimeouts();
  const canTurn = count > 1;

  useLayoutEffect(() => {
    if (!deck.isReturning) {
      return;
    }
    // A transition starts from the last pose the browser applied. Reading a layout value applies
    // the out pose now, so the card travels from there and not from the back of the deck.
    document.body.getBoundingClientRect();
    const frame = requestAnimationFrame(() => dispatch({ type: 'land' }));
    return () => cancelAnimationFrame(frame);
  }, [deck.isReturning, deck.out]);

  const next = useCallback(() => {
    if (!canTurn) {
      return;
    }
    clearAll();
    if (shouldReduceMotion) {
      dispatch({ type: 'jump', direction: 1, count });
      return;
    }
    dispatch({ type: 'leave', count });
    schedule(() => dispatch({ type: 'land' }), leaveMs);
  }, [canTurn, clearAll, count, leaveMs, schedule, shouldReduceMotion]);

  const previous = useCallback(() => {
    if (!canTurn) {
      return;
    }
    clearAll();
    if (shouldReduceMotion) {
      dispatch({ type: 'jump', direction: -1, count });
      return;
    }
    dispatch({ type: 'summon', count });
  }, [canTurn, clearAll, count, shouldReduceMotion]);

  const front = wrapIndex(deck.front, count);

  return {
    front,
    out: deck.out,
    isReturning: deck.isReturning,
    next,
    previous,
  };
}
