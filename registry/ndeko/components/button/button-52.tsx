'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';

import { useFileUpload } from '@/registry/ndeko/hooks/use-file-upload';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CircleUserRoundIcon, XIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ROW_ENTER_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};
const ROW_EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

const POP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const ROW_VARIANTS: Variants = {
  hidden: { height: 0, opacity: 0, transition: ROW_EXIT_TRANSITION },
  shown: { height: 'auto', opacity: 1, transition: ROW_ENTER_TRANSITION },
};

const ROW_FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: ROW_EXIT_TRANSITION },
  shown: { opacity: 1, transition: ROW_ENTER_TRANSITION },
};

function popVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return POP_VARIANTS;
}

function rowVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ROW_FADE_VARIANTS;
  }
  return ROW_VARIANTS;
}

function avatarActionOf(hasImage: boolean) {
  if (hasImage) {
    return 'Change image';
  }
  return 'Upload image';
}

export default function Button52() {
  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: 'image/*',
    });
  const shouldReduceMotion = usePrefersReducedMotion();
  const popVariants = popVariantsOf(shouldReduceMotion);
  const rowVariants = rowVariantsOf(shouldReduceMotion);

  const image = files[0];
  const previewUrl = image?.preview;
  const fileName = image?.file.name;
  const hasImage = Boolean(image);

  function removeImage() {
    if (!image) {
      return;
    }
    removeFile(image.id);
  }

  return (
    <div className='flex flex-col items-center'>
      <div className='relative inline-flex'>
        <Button
          variant='outline'
          className='size-16 overflow-hidden p-0'
          onClick={openFileDialog}
          aria-label={avatarActionOf(hasImage)}
        >
          <Avatar className='size-full bg-transparent ring-0'>
            {previewUrl && (
              <AvatarImage src={previewUrl} alt='Preview of uploaded image' />
            )}
            <AvatarFallback className='bg-transparent'>
              <CircleUserRoundIcon className='opacity-60' />
            </AvatarFallback>
          </Avatar>
        </Button>
        <AnimatePresence initial={false}>
          {hasImage && (
            <motion.span
              key='remove'
              className='absolute -end-1 -top-1 flex'
              variants={popVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <Button
                size='icon'
                onClick={removeImage}
                aria-label='Remove image'
                className='border-background size-6 border-2 ring-0'
              >
                <XIcon className='size-3.5' />
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
        <input
          {...getInputProps()}
          className='sr-only'
          aria-label='Upload image file'
          tabIndex={-1}
        />
      </div>
      <AnimatePresence initial={false}>
        {fileName && (
          <motion.p
            key='file-name'
            className='text-muted-foreground overflow-hidden text-xs'
            variants={rowVariants}
            initial='hidden'
            animate='shown'
            exit='hidden'
          >
            <span className='block pt-2'>{fileName}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
