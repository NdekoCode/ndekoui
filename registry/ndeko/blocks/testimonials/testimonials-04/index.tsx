'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
  StoreIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { SECTION, STORIES } from './data';
import { PersonTabs, tabIdOf } from './person-tabs';
import { PortraitStack } from './portrait-stack';
import { StoryQuote } from './story-quote';

const STORY_MS = 6500;

const ENTER: Transition = { duration: 0.45, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const QUOTE_VARIANTS: Variants = {
  enter: { opacity: 0, y: 8, filter: 'blur(4px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: ENTER },
  gone: { opacity: 0, y: -6, filter: 'blur(4px)', transition: EXIT },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  shown: { opacity: 1, transition: ENTER },
  gone: { opacity: 0, transition: EXIT },
};

function variantsOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return QUOTE_VARIANTS;
}

function indexAfter(index: number) {
  const next = index + 1;
  return next % STORIES.length;
}

function indexBefore(index: number) {
  const shifted = index + STORIES.length;
  const previous = shifted - 1;
  return previous % STORIES.length;
}

/** The next person of every story, so a round ends on the first story and the loop shows no seam. */
const ROTATION = STORIES.map((_, index) => indexAfter(index));

function spokenStoryOf(index: number) {
  const { person } = STORIES[index];
  return `${person.name}, ${person.role} at ${person.company}`;
}

type Testimonials04Props = {
  /** Moves to the next story every few seconds until a person clicks, types or tabs into the block. */
  autoplay?: boolean;
};

export default function Testimonials04({
  autoplay = true,
}: Testimonials04Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState('');
  const idBase = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const activeStory = STORIES[activeIndex];
  const panelId = `${idBase}-panel`;
  const activeTabId = tabIdOf(idBase, activeStory.id);
  const variants = variantsOf(shouldReduceMotion);
  const isFree = !isHovered;
  const isRotationEnabled = autoplay && isFree;

  const steps = ROTATION.map((index) => ({
    after: STORY_MS,
    run: () => setActiveIndex(index),
  }));
  const { ref } = useAutoplay<HTMLElement>(steps, {
    loopAfter: 0,
    isEnabled: isRotationEnabled,
  });

  function showByPerson(index: number) {
    setActiveIndex(index);
    setMessage(spokenStoryOf(index));
  }

  function pick(storyId: string) {
    const index = STORIES.findIndex((story) => story.id === storyId);
    showByPerson(index);
  }

  function showPrevious() {
    showByPerson(indexBefore(activeIndex));
  }

  function showNext() {
    showByPerson(indexAfter(activeIndex));
  }

  function holdUnderPointer(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') {
      setIsHovered(true);
    }
  }

  function releasePointer() {
    setIsHovered(false);
  }

  return (
    <section
      ref={ref}
      onPointerEnter={holdUnderPointer}
      onPointerLeave={releasePointer}
      className='@container'
    >
      <div className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 @2xl:px-6 @2xl:py-24 @5xl:px-8'>
        <header className='flex max-w-2xl flex-col gap-3'>
          <p className='text-primary-ink flex items-center gap-1.5 text-[13px] font-medium'>
            <StoreIcon className='size-4' />
            {SECTION.label}
          </p>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.lead}
          </p>
        </header>
        <div className='grid gap-6 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-12'>
          <PortraitStack stories={STORIES} activeId={activeStory.id} />
          <div className='flex min-w-0 flex-col gap-8 @3xl:justify-between @3xl:py-2'>
            <div className='flex flex-col gap-5'>
              <div className='flex items-center justify-between gap-3'>
                <QuoteIcon className='text-primary-ink size-7' />
                <Badge variant='secondary'>Sample quotes</Badge>
              </div>
              <div
                id={panelId}
                role='tabpanel'
                aria-labelledby={activeTabId}
                className='grid *:col-start-1 *:row-start-1'
              >
                {STORIES.map((story) => (
                  <div key={story.id} aria-hidden='true' className='invisible'>
                    <StoryQuote story={story} />
                  </div>
                ))}
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeStory.id}
                    variants={variants}
                    initial='enter'
                    animate='shown'
                    exit='gone'
                  >
                    <StoryQuote story={activeStory} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className='flex items-end gap-3'>
              <PersonTabs
                stories={STORIES}
                activeId={activeStory.id}
                tabIdBase={idBase}
                panelId={panelId}
                onPick={pick}
                className='min-w-0 flex-1'
              />
              <div className='flex shrink-0 items-center gap-1 pb-1'>
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Show the previous story'
                  onClick={showPrevious}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Show the next story'
                  onClick={showNext}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LiveRegion message={message} />
    </section>
  );
}
