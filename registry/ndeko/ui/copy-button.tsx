'use client';

import { useState } from 'react';

import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';

const COPIED_FOR_MS = 1600;

function accessibleLabelOf(isCopied: boolean, label: string) {
  if (isCopied) {
    return 'Copied';
  }
  return label;
}

type CopyButtonProps = {
  text: string;
  /** What the button copies, as an action: "Copy the command". */
  label: string;
  className?: string;
};

export function CopyButton({ text, label, className }: CopyButtonProps) {
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
    schedule(() => setIsCopied(false), COPIED_FOR_MS);
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={accessibleLabel}
      onClick={copy}
      className={cn('text-muted-foreground size-6', className)}
    >
      <Swap swapKey={glyphKey}>
        {isCopied && <CheckIcon className='size-3.5' />}
        {!isCopied && <CopyIcon className='size-3.5' />}
      </Swap>
    </Button>
  );
}
