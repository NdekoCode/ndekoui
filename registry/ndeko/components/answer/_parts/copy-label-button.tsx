'use client';

import { useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

const COPIED_FOR_MS = 1500;

const COPY_GLYPH = <CopyIcon />;

const COPIED_GLYPH = <CheckIcon />;

function labelOf(isCopied: boolean, label: string) {
  if (isCopied) {
    return 'Copied';
  }
  return label;
}

function glyphOf(isCopied: boolean) {
  if (isCopied) {
    return COPIED_GLYPH;
  }
  return COPY_GLYPH;
}

type CopyLabelButtonProps = {
  text: string;
  /** What the button copies, as an action: "Copy query". */
  label: string;
  /** Shows "Copied" for a demonstration that presses the button, without touching the clipboard. */
  isCopied?: boolean;
  /** Shows the button held down, for a demonstration that presses it. */
  isPressed?: boolean;
  className?: string;
};

export function CopyLabelButton({
  text,
  label,
  isCopied = false,
  isPressed = false,
  className,
}: CopyLabelButtonProps) {
  const [ownCopied, setOwnCopied] = useState(false);
  const { schedule } = useTimeouts();
  const shownCopied = ownCopied || isCopied;
  const shownLabel = labelOf(shownCopied, label);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setOwnCopied(true);
    schedule(() => setOwnCopied(false), COPIED_FOR_MS);
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      onClick={copy}
      className={cn(pressedQuietOf(isPressed), className)}
    >
      <Swap swapKey={String(shownCopied)}>{glyphOf(shownCopied)}</Swap>
      <Swap swapKey={shownLabel}>{shownLabel}</Swap>
    </Button>
  );
}
