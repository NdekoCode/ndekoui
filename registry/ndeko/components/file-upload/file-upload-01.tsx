'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CircleUserRoundIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };
const RESIZE_TRANSITION: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};
const INSTANT_TRANSITION: Transition = { duration: 0 };

const LABEL_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function resizeTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT_TRANSITION;
  }
  return RESIZE_TRANSITION;
}

function uploadLabelOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change image';
  }
  return 'Upload image';
}

function useLabelWidth() {
  const [label, setLabel] = useState<HTMLSpanElement | null>(null);
  const [labelWidth, setLabelWidth] = useState<number>();

  useEffect(() => {
    if (!label) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      setLabelWidth(entry.contentRect.width);
    });
    observer.observe(label);
    return () => observer.disconnect();
  }, [label]);

  return { measureLabel: setLabel, labelWidth };
}

export default function FileUpload01() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: 'image/*',
    });
  const { measureLabel, labelWidth } = useLabelWidth();
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const resizeTransition = resizeTransitionOf(shouldReduceMotion);

  const image = files[0];
  const previewUrl = image?.preview;
  const fileName = image?.file.name;
  const hasImage = Boolean(image);
  const label = uploadLabelOf(hasImage);

  function removeImage() {
    if (!image) {
      return;
    }
    removeFile(image.id);
  }

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='inline-flex items-center gap-2 align-top'>
        <Avatar className='rounded-md'>
          {previewUrl && (
            <AvatarImage src={previewUrl} alt='Preview of uploaded image' />
          )}
          <AvatarFallback>
            <CircleUserRoundIcon className='opacity-60' />
          </AvatarFallback>
        </Avatar>
        <div className='relative inline-block'>
          <Button onClick={openFileDialog} aria-haspopup='dialog'>
            <motion.span
              className='flex overflow-hidden'
              initial={false}
              animate={{ width: labelWidth }}
              transition={resizeTransition}
            >
              <span ref={measureLabel} className='relative flex w-max shrink-0'>
                <AnimatePresence mode='popLayout' initial={false}>
                  <motion.span
                    key={label}
                    className='flex'
                    variants={labelVariants}
                    initial='enter'
                    animate='visible'
                    exit='exit'
                    transition={SWAP_TRANSITION}
                  >
                    {label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.span>
          </Button>
          <input
            {...getInputProps()}
            className='sr-only'
            aria-label='Upload image file'
            tabIndex={-1}
          />
        </div>
      </div>
      {fileName && (
        <div className='inline-flex gap-2 text-xs'>
          <p className='text-muted-foreground truncate' aria-live='polite'>
            {fileName}
          </p>
          <Button
            variant='link'
            size='sm'
            onClick={removeImage}
            aria-label={`Remove ${fileName}`}
            className='text-destructive-ink h-auto px-0'
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
