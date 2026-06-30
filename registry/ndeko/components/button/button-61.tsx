'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { CheckIcon, DownloadIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

type DownloadStatus = 'idle' | 'downloading' | 'done';

const PROGRESS_STEPS = [6, 14, 27, 38, 46, 59, 71, 80, 88, 96, 100];
const COMPLETE = 100;
const STEP_MS = 180;
const SETTLE_MS = 220;
const DONE_RESET_MS = 2200;

const FILL =
  'bg-primary/12 pointer-events-none absolute inset-0 -z-10 transition-[translate,opacity] duration-180 ease-linear';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

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

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function labelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return LABEL_VARIANTS;
}

function nextProgressOf(progress: number) {
  const nextStep = PROGRESS_STEPS.find((step) => step > progress);
  if (nextStep === undefined) {
    return COMPLETE;
  }
  return nextStep;
}

function iconOf(status: DownloadStatus) {
  if (status === 'done') {
    return <CheckIcon />;
  }
  return <DownloadIcon className='opacity-60' />;
}

function DownloadLabel({
  status,
  progress,
}: {
  status: DownloadStatus;
  progress: number;
}) {
  if (status === 'downloading') {
    return (
      <>
        Downloading
        <span className='ms-1 inline-block w-[4ch] text-end tabular-nums'>
          {progress}%
        </span>
      </>
    );
  }
  if (status === 'done') {
    return 'Downloaded';
  }
  return 'Download report';
}

function announcementOf(status: DownloadStatus) {
  if (status === 'downloading') {
    return 'Downloading the report';
  }
  if (status === 'done') {
    return 'Report downloaded';
  }
  return '';
}

function fillStyleOf(
  status: DownloadStatus,
  progress: number
): React.CSSProperties {
  const offset = progress - COMPLETE;
  const isDownloading = status === 'downloading';
  return { translate: `${offset}% 0`, opacity: Number(isDownloading) };
}

export default function Button61() {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const labelVariants = labelVariantsOf(shouldReduceMotion);
  const isDownloading = status === 'downloading';
  const isDone = status === 'done';
  const isBusy = status !== 'idle';
  const hasReachedEnd = progress === COMPLETE;
  const iconKey = String(isDone);

  useEffect(() => {
    if (!isDownloading) {
      return;
    }
    const interval = window.setInterval(() => {
      setProgress(nextProgressOf);
    }, STEP_MS);
    return () => window.clearInterval(interval);
  }, [isDownloading]);

  useEffect(() => {
    if (!isDownloading) {
      return;
    }
    if (!hasReachedEnd) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('done');
    }, SETTLE_MS);
    return () => window.clearTimeout(timeout);
  }, [isDownloading, hasReachedEnd]);

  useEffect(() => {
    if (!isDone) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setProgress(0);
      setStatus('idle');
    }, DONE_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isDone]);

  function startDownload() {
    setProgress(0);
    setStatus('downloading');
  }

  return (
    <>
      <Button
        variant='outline'
        onClick={startDownload}
        disabled={isBusy}
        focusableWhenDisabled
        aria-busy={isDownloading}
        className='isolate overflow-hidden data-disabled:opacity-100'
      >
        <span
          aria-hidden='true'
          className={FILL}
          style={fillStyleOf(status, progress)}
        />
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={iconKey}
              className='flex'
              variants={iconVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {iconOf(status)}
            </motion.span>
          </AnimatePresence>
        </span>
        <AnimatedSize axis='width' as='span' contentClassName='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={status}
              className='flex'
              variants={labelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <DownloadLabel status={status} progress={progress} />
            </motion.span>
          </AnimatePresence>
        </AnimatedSize>
      </Button>
      <span className='sr-only' role='status'>
        {announcementOf(status)}
      </span>
    </>
  );
}
