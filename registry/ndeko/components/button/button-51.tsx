'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { CircleUserRoundIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

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

const ROW_ENTER_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};
const ROW_EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const ROW_VARIANTS: Variants = {
  hidden: { height: 0, opacity: 0, transition: ROW_EXIT_TRANSITION },
  shown: { height: 'auto', opacity: 1, transition: ROW_ENTER_TRANSITION },
};

const ROW_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: ROW_EXIT_TRANSITION },
  shown: { opacity: 1, transition: ROW_ENTER_TRANSITION },
};

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

function uploadLabelOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change image';
  }
  return 'Upload image';
}

export default function Button51() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: 'image/*',
    });
  const shouldReduceMotion = useReducedMotion();
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const rowVariants = rowVariantsOf(shouldReduceMotion);

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
    <div className='flex flex-col items-center'>
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
            <AnimatedSize
              axis='width'
              as='span'
              contentClassName='relative flex'
            >
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
            </AnimatedSize>
          </Button>
          <input
            {...getInputProps()}
            className='sr-only'
            aria-label='Upload image file'
            tabIndex={-1}
          />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {fileName && (
          <motion.div
            key='file-name'
            className='-mx-1 -mb-1 overflow-hidden'
            variants={rowVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <div className='inline-flex gap-2 px-1 pt-2 pb-1 text-xs'>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
