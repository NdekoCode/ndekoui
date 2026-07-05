'use client';

import { useCallback, useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

/** How long a control stays down when a demonstration presses it. */
const PRESS_MS = 200;

/** A finger goes down before the click lands: a step that presses a control is followed by its action this long after. */
export const PRESS_LEAD_MS = 130;

/** A demonstration presses deeper than a finger does, so the press reads from across the page. */
const PRESSED_SOLID = 'scale-[0.94] bg-primary/85';

const PRESSED_QUIET =
  'scale-[0.94] bg-foreground/[0.07] text-foreground dark:bg-foreground/[0.1]';

export function pressedSolidOf(isPressed: boolean) {
  if (isPressed) {
    return PRESSED_SOLID;
  }
  return undefined;
}

export function pressedQuietOf(isPressed: boolean) {
  if (isPressed) {
    return PRESSED_QUIET;
  }
  return undefined;
}

/** Shows a press on one control at a time and lets go of it on its own. */
export function usePress<Key extends string>() {
  const [pressed, setPressed] = useState<Key | null>(null);
  const { schedule } = useTimeouts();

  const press = useCallback(
    (key: Key) => {
      function release(current: Key | null) {
        if (current === key) {
          return null;
        }
        return current;
      }
      setPressed(key);
      schedule(() => setPressed(release), PRESS_MS);
    },
    [schedule]
  );

  return { pressed, press };
}

/** A step that only waits, so a round ends once the piece has finished on its own. */
export function hold() {}

/** `aria-hidden` for a status a demonstration shows without saying it. */
export function hiddenIf(isDemonstrating: boolean) {
  if (isDemonstrating) {
    return true;
  }
  return undefined;
}

/** A demonstration is not read aloud: the live region speaks once a person takes over. */
export function spokenUnless(isDemonstrating: boolean, message: string) {
  if (isDemonstrating) {
    return '';
  }
  return message;
}
