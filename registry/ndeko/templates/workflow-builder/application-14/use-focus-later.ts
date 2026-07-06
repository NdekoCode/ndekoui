'use client';

import { useCallback, type RefObject } from 'react';

export const CANVAS_FRAME = '[data-canvas-frame]';

export const INSPECTOR_HEADING = '[data-inspector-heading]';

/**
 * What takes the focus is often drawn by the very change that asks for it: a step that was just
 * added, a sheet that opens. It is looked up once the page has been drawn again, inside the template only.
 */
export function useFocusLater(ref: RefObject<HTMLElement | null>) {
  const focusLater = useCallback(
    (selector: string) => {
      requestAnimationFrame(() => {
        const target = ref.current?.querySelector<HTMLElement>(selector);
        target?.focus();
      });
    },
    [ref]
  );

  const focusNode = useCallback(
    (id: string) => {
      focusLater(`[data-node="${id}"]`);
    },
    [focusLater]
  );

  return { focusLater, focusNode };
}
