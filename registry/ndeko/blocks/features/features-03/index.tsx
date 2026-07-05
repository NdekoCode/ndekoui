'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import { DEFAULT_FEATURE_ID, FEATURES, type FeatureId, SECTION } from './data';
import { FeaturePreview } from './feature-previews';

const CROSSFADE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.23, 1, 0.32, 1],
};

const CROSSFADE_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function crossfadeVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return CROSSFADE_VARIANTS;
}

function isFeatureId(value: unknown): value is FeatureId {
  return FEATURES.some((feature) => feature.id === value);
}

function tabIdOf(id: FeatureId) {
  return `features-03-tab-${id}`;
}

function panelIdOf(id: FeatureId) {
  return `features-03-panel-${id}`;
}

export default function Features03() {
  const [activeId, setActiveId] = useState<FeatureId>(DEFAULT_FEATURE_ID);
  const shouldReduceMotion = usePrefersReducedMotion();
  const crossfadeVariants = crossfadeVariantsOf(shouldReduceMotion);

  function pickFeature(value: unknown) {
    if (isFeatureId(value)) {
      setActiveId(value);
    }
  }

  return (
    <section className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-10 sm:gap-14'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {SECTION.description}
          </p>
        </div>
        <TabsPrimitive.Root
          value={activeId}
          onValueChange={pickFeature}
          orientation='vertical'
          className='grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12'
        >
          <TabsPrimitive.List
            aria-label='Loomboard views'
            className='relative flex flex-col gap-1'
          >
            {FEATURES.map((feature) => (
              <TabsPrimitive.Tab
                key={feature.id}
                value={feature.id}
                id={tabIdOf(feature.id)}
                aria-controls={panelIdOf(feature.id)}
                className='group/feature focus-visible:ring-ring/25 hover:bg-foreground/[0.025] relative z-10 flex w-full cursor-pointer items-start gap-3 rounded-xl p-3 text-left transition-colors outline-none focus-visible:ring-[3px] sm:p-4'
              >
                <span className='keycap-3d text-muted-foreground group-data-active/feature:text-primary-ink flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors'>
                  <feature.icon />
                </span>
                <span className='flex flex-col gap-1'>
                  <span className='text-muted-foreground group-data-active/feature:text-foreground text-sm font-medium transition-colors'>
                    {feature.title}
                  </span>
                  <span className='text-muted-foreground text-[13px] leading-relaxed text-pretty'>
                    {feature.description}
                  </span>
                </span>
              </TabsPrimitive.Tab>
            ))}
            <TabsPrimitive.Indicator className='bg-foreground/[0.04] before:bg-primary dark:bg-foreground/[0.06] pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-full translate-y-(--active-tab-top) rounded-xl transition-[translate,height] duration-300 ease-(--ease-out-strong) before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full' />
          </TabsPrimitive.List>
          <div className='bg-foreground/[0.025] rounded-2xl p-4 sm:p-8'>
            <AnimatedSize contentClassName='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.div
                  key={activeId}
                  id={panelIdOf(activeId)}
                  role='tabpanel'
                  aria-labelledby={tabIdOf(activeId)}
                  tabIndex={0}
                  variants={crossfadeVariants}
                  initial='enter'
                  animate='visible'
                  exit='exit'
                  transition={CROSSFADE_TRANSITION}
                  className='focus-visible:ring-ring/25 rounded-xl outline-none focus-visible:ring-[3px]'
                >
                  <FeaturePreview id={activeId} />
                </motion.div>
              </AnimatePresence>
            </AnimatedSize>
          </div>
        </TabsPrimitive.Root>
      </div>
    </section>
  );
}
