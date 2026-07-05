'use client';

import { useState } from 'react';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

const COPIED_FOR_MS = 1500;

function accessibleLabelOf(isCopied: boolean, label: string) {
  if (isCopied) {
    return 'Copied';
  }
  return label;
}

type CopyActionProps = Omit<ButtonProps, 'children'> & {
  text: string;
  /** What the button copies, as an action: "Copy the answer". */
  label: string;
  onCopied?: () => void;
};

/** A copy icon button that passes trigger props through, so a tooltip row can wrap it. */
export function CopyAction({
  text,
  label,
  onCopied,
  onClick,
  className,
  ...props
}: CopyActionProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { schedule } = useTimeouts();
  const accessibleLabel = accessibleLabelOf(isCopied, label);
  const glyphKey = String(isCopied);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setIsCopied(true);
    onCopied?.();
    schedule(() => setIsCopied(false), COPIED_FOR_MS);
  }

  const handleClick: ButtonProps['onClick'] = (event) => {
    onClick?.(event);
    void copy();
  };

  return (
    <Button
      {...props}
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={accessibleLabel}
      onClick={handleClick}
      className={cn('text-muted-foreground', className)}
    >
      <Swap swapKey={glyphKey}>
        {isCopied && <CheckIcon className='size-3.5' />}
        {!isCopied && <CopyIcon className='size-3.5' />}
      </Swap>
    </Button>
  );
}
