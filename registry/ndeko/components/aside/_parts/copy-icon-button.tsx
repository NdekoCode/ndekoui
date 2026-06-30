'use client';

import { useEffect, useState } from 'react';

import { CheckIcon, CopyIcon, LinkIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { Swap } from './swap';

const COPIED_RESET_MS = 1600;

type CopyGlyph = 'copy' | 'link';

function glyphOf(isCopied: boolean, glyph: CopyGlyph) {
  if (isCopied) {
    return <CheckIcon className='text-success-foreground' />;
  }
  if (glyph === 'link') {
    return <LinkIcon />;
  }
  return <CopyIcon />;
}

type CopyIconButtonProps = {
  text: string;
  label: string;
  /** Announced once the text is on the clipboard. */
  announcement: string;
  glyph?: CopyGlyph;
  className?: string;
};

export function CopyIconButton({
  text,
  label,
  announcement,
  glyph = 'copy',
  className,
}: CopyIconButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const icon = glyphOf(isCopied, glyph);
  const iconKey = String(isCopied);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, COPIED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={label}
        onClick={copy}
        className={cn('text-muted-foreground', className)}
      >
        <Swap swapKey={iconKey}>{icon}</Swap>
      </Button>
      <span className='sr-only' role='status'>
        {isCopied && announcement}
      </span>
    </>
  );
}
