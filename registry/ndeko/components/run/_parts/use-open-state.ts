'use client';

import { useState } from 'react';

type OpenStateOptions = {
  /** When given, the parent owns the state. */
  isOpen?: boolean;
  defaultOpen: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

function currentOpenOf(isOpen: boolean | undefined, ownOpen: boolean) {
  if (isOpen === undefined) {
    return ownOpen;
  }
  return isOpen;
}

export function useOpenState({
  isOpen,
  defaultOpen,
  onOpenChange,
}: OpenStateOptions) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const current = currentOpenOf(isOpen, ownOpen);

  function toggle() {
    const next = !current;
    setOwnOpen(next);
    onOpenChange?.(next);
  }

  return { isOpen: current, toggle };
}
