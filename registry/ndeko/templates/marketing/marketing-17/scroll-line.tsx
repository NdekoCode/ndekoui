'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';

import { SCROLL_LINE } from './data';

const RUN_FROM = '12%';

const RUN_TO = '-48%';

function SlidingLine() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const x = useTransform(scrollYProgress, [0, 1], [RUN_FROM, RUN_TO]);

  return (
    <section ref={ref} className='overflow-x-clip py-12 @sm:py-20'>
      <motion.p
        style={{ x }}
        className='w-max text-[clamp(2.5rem,9cqw,7rem)] leading-none font-semibold whitespace-nowrap'
      >
        {SCROLL_LINE}
      </motion.p>
    </section>
  );
}

function StillLine() {
  return (
    <section className='px-4 py-12 @sm:px-6 @sm:py-20 @5xl:px-8'>
      <p className='mx-auto max-w-6xl text-[clamp(2rem,6cqw,4.5rem)] leading-tight font-semibold text-balance'>
        {SCROLL_LINE}
      </p>
    </section>
  );
}

export function ScrollLine() {
  const shouldReduceMotion = usePrefersReducedMotion();

  if (shouldReduceMotion) {
    return <StillLine />;
  }
  return <SlidingLine />;
}
