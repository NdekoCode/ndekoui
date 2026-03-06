// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useCallback } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Skeleton } from '@/registry/ndeko/ui/skeleton';

type GeneratedImageLike = {
  base64?: string;
  uint8Array?: Uint8Array;
  mediaType?: string;
};

type ImageProps = GeneratedImageLike &
  Omit<React.ComponentProps<'img'>, 'src' | 'ref'> & {
    alt: string;
  };

const DEFAULT_MEDIA_TYPE = 'image/png';

const PICTURE =
  'h-auto max-w-full overflow-hidden rounded-lg transition-opacity duration-200 starting:opacity-0';

function dataUrlOf(base64: string | undefined, mediaType: string) {
  if (!base64) {
    return undefined;
  }
  return `data:${mediaType};base64,${base64}`;
}

function rawBytesOf(
  base64: string | undefined,
  uint8Array: Uint8Array | undefined
) {
  if (base64) {
    return undefined;
  }
  return uint8Array;
}

function Image({
  base64,
  uint8Array,
  mediaType = DEFAULT_MEDIA_TYPE,
  className,
  alt,
  ...props
}: ImageProps) {
  const dataUrl = dataUrlOf(base64, mediaType);
  const rawBytes = rawBytesOf(base64, uint8Array);
  const hasDataUrl = dataUrl !== undefined;
  const hasRawBytes = rawBytes !== undefined;
  const hasPicture = hasDataUrl || hasRawBytes;

  const attachBytes = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) {
        return;
      }
      if (!rawBytes) {
        return;
      }
      const bytes = new Uint8Array(rawBytes);
      const blob = new Blob([bytes], { type: mediaType });
      const objectUrl = URL.createObjectURL(blob);
      image.src = objectUrl;
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    },
    [rawBytes, mediaType]
  );

  if (!hasPicture) {
    return (
      <Skeleton
        role='img'
        aria-label={alt}
        aria-hidden={false}
        className={cn('aspect-square w-full max-w-sm rounded-lg', className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- registry items land in any React app, where next/image may not exist
    <img
      data-slot='image'
      ref={attachBytes}
      src={dataUrl}
      alt={alt}
      className={cn(PICTURE, className)}
      {...props}
    />
  );
}

export { Image, type GeneratedImageLike, type ImageProps };
