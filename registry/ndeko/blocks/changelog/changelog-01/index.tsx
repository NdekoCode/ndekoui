'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { PAGE_SIZE, RELEASES, SECTION } from './data';
import { ReleaseEntry, releaseAnchorOf } from './release-entry';

const PRESENCE_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

const PRESENCE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0 },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};

function presenceVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PRESENCE_VARIANTS;
}

function shownCountLabelOf(shown: number, total: number) {
  if (total === 1) {
    return 'Showing the only release';
  }
  return `Showing ${shown} of ${total} releases`;
}

function nextCountOf(count: number) {
  const next = count + PAGE_SIZE;
  return Math.min(next, RELEASES.length);
}

export default function Changelog01() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const presenceVariants = presenceVariantsOf(shouldReduceMotion);
  const visibleReleases = RELEASES.slice(0, visibleCount);
  const hasMore = visibleCount < RELEASES.length;
  const shownCountLabel = shownCountLabelOf(visibleCount, RELEASES.length);

  useEffect(() => {
    if (!focusTargetId) {
      return;
    }
    const target = document.getElementById(focusTargetId);
    target?.focus();
  }, [focusTargetId]);

  function loadMore() {
    const firstNewRelease = RELEASES[visibleCount];
    const nextCount = nextCountOf(visibleCount);
    const anchor = releaseAnchorOf(firstNewRelease.version);
    setVisibleCount(nextCount);
    setFocusTargetId(anchor);
  }

  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-4xl flex-col gap-12'>
        <div className='flex flex-col gap-2 md:ps-[12rem]'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base'>
            {SECTION.description}
          </p>
        </div>
        <AnimatedSize>
          <ol className='flex flex-col gap-14'>
            <AnimatePresence initial={false}>
              {visibleReleases.map((release) => (
                <motion.li
                  key={release.version}
                  variants={presenceVariants}
                  initial='hidden'
                  animate='shown'
                  transition={PRESENCE_TRANSITION}
                >
                  <ReleaseEntry release={release} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </AnimatedSize>
        <div className='flex flex-col items-start gap-3 md:ps-[12rem]'>
          <p className='text-muted-foreground text-xs tabular-nums'>
            <WordRoll text={shownCountLabel} value={visibleCount} />
          </p>
          {hasMore && (
            <Button variant='outline' onClick={loadMore}>
              Load more releases
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
