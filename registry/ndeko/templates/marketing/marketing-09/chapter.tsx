'use client';

import { motion } from 'motion/react';
import { type ComponentType, useRef } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useDocumentVisible } from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { cn } from '@/registry/ndeko/lib/utils';

import { type Chapter as ChapterData } from './data';
import { LitCaption } from './lit-caption';
import { useChapterProgress } from './use-chapter-progress';
import { type VisualProps } from './visual-props';

function wrapperClassOf(isStill: boolean) {
  if (isStill) {
    return 'py-12';
  }
  return 'h-[180svh]';
}

function stageClassOf(isStill: boolean) {
  if (isStill) {
    return 'items-start';
  }
  return 'sticky top-0 h-svh items-center';
}

type ChapterProps = {
  chapter: ChapterData;
  number: number;
  total: number;
  Visual: ComponentType<VisualProps>;
};

export function Chapter({ chapter, number, total, Visual }: ChapterProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isVisible = useDocumentVisible();
  const { ref, isInView, isAutoplaying } = useAutoplay<HTMLDivElement>([]);
  const isPlaying = isInView && isAutoplaying && isVisible;
  const progress = useChapterProgress(wrapperRef, {
    isStill: shouldReduceMotion,
    isPlaying,
  });
  const captionId = `chapter-${chapter.id}-caption`;

  return (
    <section
      ref={wrapperRef}
      aria-labelledby={captionId}
      className={cn('relative', wrapperClassOf(shouldReduceMotion))}
    >
      <div
        ref={ref}
        className={cn(
          'flex overflow-hidden px-4 sm:px-6 lg:px-8',
          stageClassOf(shouldReduceMotion)
        )}
      >
        <div className='mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <p className='text-primary-ink text-xs font-medium'>
                Chapter {number} of {total}, {chapter.label}
              </p>
              <div className='bg-foreground/[0.08] h-0.5 w-24 overflow-hidden rounded-full'>
                <motion.div
                  aria-hidden='true'
                  style={{ scaleX: progress }}
                  className='bg-primary h-full origin-left rounded-full'
                />
              </div>
            </div>
            <LitCaption
              id={captionId}
              text={chapter.caption}
              progress={progress}
            />
          </div>
          <div className='min-w-0'>
            <Visual progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}
