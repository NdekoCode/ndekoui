'use client';

import { useEffect, useState } from 'react';

import { CheckIcon, CopyIcon, LinkIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button, type ButtonProps } from '@/registry/ndeko/ui/button';

import { Swap } from './swap';

const COPIED_RESET_MS = 1600;

/** Copies a text and says so for a moment. */
export function useCopy(text: string) {
  const [isCopied, setIsCopied] = useState(false);

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

  return { isCopied, copy };
}

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

function labelOf(isCopied: boolean, label: string, copiedLabel: string) {
  if (isCopied) {
    return copiedLabel;
  }
  return label;
}

type CopyButtonProps = Omit<ButtonProps, 'children' | 'onClick'> & {
  text: string;
  /** Visible label. Leave it out for an icon button, and give `aria-label` instead. */
  label?: string;
  copiedLabel?: string;
  /** Announced once the text is on the clipboard. */
  announcement: string;
  glyph?: CopyGlyph;
};

/** A copy action whose icon becomes a check and whose label becomes Copied, then returns. */
export function CopyButton({
  text,
  label,
  copiedLabel = 'Copied',
  announcement,
  glyph = 'copy',
  variant = 'outline',
  size = 'sm',
  ...props
}: CopyButtonProps) {
  const { isCopied, copy } = useCopy(text);
  const icon = glyphOf(isCopied, glyph);
  const iconKey = String(isCopied);
  const hasLabel = Boolean(label);
  const shownLabel = labelOf(isCopied, label ?? '', copiedLabel);

  return (
    <>
      <Button variant={variant} size={size} onClick={copy} {...props}>
        <Swap swapKey={iconKey}>{icon}</Swap>
        {hasLabel && (
          <AnimatedSize axis='width' as='span'>
            <Swap swapKey={shownLabel} kind='label'>
              {shownLabel}
            </Swap>
          </AnimatedSize>
        )}
      </Button>
      <span className='sr-only' role='status'>
        {isCopied && announcement}
      </span>
    </>
  );
}
